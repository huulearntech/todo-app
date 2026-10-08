import * as chrono from "chrono-node";
import moo from "moo";
import { TaskPriority } from "@todo/shared";

export interface ParsedRawQuickTask {
  title: string;
  projectName?: string;
  sectionName?: string;
  labelNames: string[];
  priority?: TaskPriority;
  deadlineString?: string;
  parsedDate?: Date;
  dateText?: string;
  description: string;
  assignee?: string;
  reminder?: string;
}

export interface QuickTaskEntityContext {
  projects: Array<{ id: string; name: string; colorHexCode?: string }>;
  sections: Array<{ id: string; name: string; projectId: string }>;
  labels: Array<{ id: string; name: string; colorHexCode?: string }>;
  defaultProjectId?: string;
  defaultSectionId?: string;
}

export interface ResolvedQuickTask {
  title: string;
  description: string;
  priority: TaskPriority;
  projectId?: string;
  projectName?: string;
  projectColor?: string;
  sectionId?: string;
  sectionName?: string;
  labels: Array<{ id: string; name: string; colorHexCode?: string }>;
  timeRange: { start: string; end: string } | null;
  dateDisplayText?: string;
  assignee?: string;
  reminder?: string;
}

export interface ParserOptions {
  projects?: Array<{ id: string; name: string; colorHexCode?: string }>;
  sections?: Array<{ id: string; name: string; projectId: string }>;
  labels?: Array<{ id: string; name: string; colorHexCode?: string }>;
}

const escapeRegex = (s: string) =>
  s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

export const normalizeName = (s: string) =>
  s.replace(/[\s\-_]/g, "").toLowerCase();

// Moo lexer rules for inline syntax shortcuts
const createLexer = () =>
  moo.compile({
    description: {
      match: /\/\/\s*[\s\S]*$/,
      value: (s) => s.replace(/^\/\/\s*/, ""),
    },
    deadline: {
      match: /\{[^}\n]+\}/,
      value: (s) => s.slice(1, -1).trim(),
    },
    quoted_label: {
      match: /[%@](?:\"[^\"]+\"|\[[^\]]+\])/,
      value: (s) => s.slice(2, -1),
    },
    quoted_project_section: {
      match: /#(?:\"[^\"]+\"|\[[^\]]+\])(?:(?:\/|\s*\/\s*)(?:\"[^\"]+\"|\[[^\]]+\]))?/,
      value: (s) => s.slice(1),
    },
    quoted_section: {
      match: /\/(?:\"[^\"]+\"|\[[^\]]+\])/,
      value: (s) => s.slice(2, -1),
    },
    project_section: {
      match: /#[^\s/#]+(?:\/[^\s#]+)?/,
      value: (s) => s.slice(1),
    },
    section: {
      match: /\/[^\s/#]+/,
      value: (s) => s.slice(1),
    },
    label: {
      match: /[%@][^\s%@]+/,
      value: (s) => s.slice(1),
    },
    priority: {
      match: /\b[pP][1-4]\b/,
      value: (s) => s.toLowerCase(),
    },
    assignee: {
      match: /\+[^\s+]+/,
      value: (s) => s.slice(1),
    },
    reminder: {
      match: /![^\s!]+/,
      value: (s) => s.slice(1),
    },
    ws: /[ \t]+/,
    word: /[^ \t\n]+/,
  });

/**
 * Extracts project and section names that may contain spaces:
 * 1. Quoted / Bracketed syntax: #"Work Projects"/"Sprint 1" or #[Work Projects/Sprint 1]
 * 2. Entity-aware greedy match against known projects and sections: #Work Projects/Sprint 1
 */
function extractMultiWordProjectAndSection(
  input: string,
  options?: ParserOptions
): { text: string; projectName?: string; sectionName?: string } {
  let text = input;
  let projectName: string | undefined;
  let sectionName: string | undefined;

  // 1. Quoted or Bracketed compound or separated:
  // e.g. #"Work Projects" / "Sprint 1" or #[Work Projects]/[Sprint 1] or #"Work Projects/Sprint 1"
  const quotedRegex =
    /#(?:\"([^\"]+)\"|\[([^\]]+)\])(?:(?:\/|\s*\/\s*)(?:\"([^\"]+)\"|\[([^\]]+)\]))?/i;
  const qm = text.match(quotedRegex);
  if (qm) {
    const rawProj = (qm[1] || qm[2] || "").trim();
    const rawSec = (qm[3] || qm[4] || "").trim();
    if (rawSec) {
      projectName = rawProj;
      sectionName = rawSec;
    } else if (rawProj.includes("/")) {
      const parts = rawProj.split("/");
      projectName = parts[0]?.trim();
      sectionName = parts[1]?.trim();
    } else {
      projectName = rawProj;
    }
    text = text.replace(qm[0], " ").trim();
    return { text, projectName, sectionName };
  }

  // 2. Entity-aware greedy match against known projects (sorted by length descending)
  if (options?.projects && options.projects.length > 0) {
    const sortedProjects = [...options.projects].sort(
      (a, b) => b.name.length - a.name.length
    );

    for (const proj of sortedProjects) {
      const pEsc = escapeRegex(proj.name);
      const pSlug = escapeRegex(normalizeName(proj.name));
      // Matches #ProjectName or #ProjectSlug optionally followed by /SectionName
      const re = new RegExp(
        `#(?:${pEsc}|${pSlug})(?:\\s*\\/\\s*([^%#@+!{\\n]+))?`,
        "i"
      );
      const m = text.match(re);
      if (m) {
        projectName = proj.name;
        const matchedSpan = m[0];

        if (m[1]) {
          const secPart = m[1].trim();
          const projSections = options.sections
            ? options.sections.filter((s) => s.projectId === proj.id)
            : [];
          const sortedSections = [...projSections].sort(
            (a, b) => b.name.length - a.name.length
          );

          let foundSec = false;
          for (const sec of sortedSections) {
            if (secPart.toLowerCase().startsWith(sec.name.toLowerCase())) {
              sectionName = sec.name;
              foundSec = true;
              break;
            }
          }
          if (!foundSec) {
            // Cut candidate at next inline syntax character if present
            sectionName = secPart
              .split(/\s+(?:%|@|p[1-4]|\+|!|\{|\/\/)/i)[0]
              ?.trim();
          }
        }

        text = text.replace(matchedSpan, " ").trim();
        return { text, projectName, sectionName };
      }
    }
  }

  // 3. Standalone quoted section: /"Section Name" or /[Section Name]
  const quotedSecRegex = /(?:^|\s)\/(?:\"([^\"]+)\"|\[([^\]]+)\])/i;
  const sm = text.match(quotedSecRegex);
  if (sm) {
    sectionName = (sm[1] || sm[2] || "").trim();
    text = text.replace(sm[0], " ").trim();
  }

  return { text, projectName, sectionName };
}

/**
 * Extracts multi-word label names:
 * 1. Quoted / Bracketed syntax: %"label 4" or %[label 4] or @"label 4"
 * 2. Entity-aware greedy match against known labels: %label 4
 */
function extractMultiWordLabels(
  input: string,
  options?: ParserOptions
): { text: string; labelNames: string[] } {
  let text = input;
  const labelNames: string[] = [];

  // 1. Quoted / Bracketed syntax: %"label 4" or %[label 4] or @"label 4"
  const quotedRegex = /(?:^|\s)([%@])(?:\"([^\"]+)\"|\[([^\]]+)\])/gi;
  text = text.replace(quotedRegex, (_match, _sym, q1, q2) => {
    const val = (q1 || q2 || "").trim();
    if (val) {
      labelNames.push(val);
    }
    return " ";
  });

  // 2. Entity-aware greedy match against known labels (sorted by length descending)
  if (options?.labels && options.labels.length > 0) {
    const sortedLabels = [...options.labels].sort(
      (a, b) => b.name.length - a.name.length
    );

    for (const label of sortedLabels) {
      const lEsc = escapeRegex(label.name);
      const lSlug = escapeRegex(normalizeName(label.name));
      // Matches %label_name or @label_name followed by space, end of string, or syntax delimiter
      const re = new RegExp(
        `(?:^|\\s)([%@])(?:${lEsc}|${lSlug})(?=$|\\s|[%@#+/!{]|//)`,
        "i"
      );
      const m = text.match(re);
      if (m) {
        labelNames.push(label.name);
        text = text.replace(m[0], " ");
      }
    }
  }

  return { text: text.trim(), labelNames };
}

/**
 * Parses raw task input text using chrono-node for date/deadline parsing
 * and moo for lexical tokenizing of inline syntax shortcuts.
 */
export function parseQuickTaskInput(
  input: string,
  options?: ParserOptions
): ParsedRawQuickTask {
  if (!input || !input.trim()) {
    return {
      title: "",
      labelNames: [],
      description: "",
    };
  }

  let textToParse = input.trim();
  let inlineDescription: string | undefined;

  // 1. Extract inline description after "//"
  const descIndex = textToParse.indexOf("//");
  if (descIndex !== -1) {
    inlineDescription = textToParse.slice(descIndex + 2).trim();
    textToParse = textToParse.slice(0, descIndex).trim();
  }

  // 2. Extract deadline {date} or natural language date via chrono-node
  let deadlineString: string | undefined;
  let parsedDate: Date | undefined;
  let dateText: string | undefined;

  const deadlineMatch = textToParse.match(/\{([^}\n]+)\}/);
  if (deadlineMatch) {
    deadlineString = deadlineMatch[1].trim();
    const dateRes = chrono.parseDate(deadlineString, new Date(), {
      forwardDate: true,
    });
    if (dateRes) {
      parsedDate = dateRes;
      dateText = deadlineString;
    }
    // Remove the {date} token from remaining text
    textToParse = textToParse.replace(deadlineMatch[0], " ").trim();
  } else {
    // Attempt natural language date extraction
    const chronoResults = chrono.parse(textToParse, new Date(), {
      forwardDate: true,
    });
    if (chronoResults.length > 0) {
      const match = chronoResults[0];
      parsedDate = match.start.date();
      dateText = match.text;
      // Remove parsed date span from text
      const before = textToParse.slice(0, match.index);
      const after = textToParse.slice(match.index + match.text.length);
      textToParse = `${before} ${after}`.replace(/\s+/g, " ").trim();
    }
  }

  // 3. Extract multi-word project & section names (quoted or entity-matched)
  const {
    text: textAfterProjectSection,
    projectName: preProjectName,
    sectionName: preSectionName,
  } = extractMultiWordProjectAndSection(textToParse, options);
  textToParse = textAfterProjectSection;

  // 4. Extract multi-word label names (quoted or entity-matched)
  const { text: textAfterLabels, labelNames: preLabelNames } =
    extractMultiWordLabels(textToParse, options);
  textToParse = textAfterLabels;

  // 5. Tokenize remaining text with moo
  const lexer = createLexer();
  lexer.reset(textToParse);

  const titleWords: string[] = [];
  const labelNames: string[] = [...preLabelNames];
  let projectName = preProjectName;
  let sectionName = preSectionName;
  let priority: TaskPriority | undefined;
  let assignee: string | undefined;
  let reminder: string | undefined;

  for (const token of lexer) {
    switch (token.type) {
      case "quoted_project_section": {
        if (!projectName) {
          const raw = token.value.replace(/["\[\]]/g, "");
          const parts = raw.split("/");
          projectName = parts[0]?.trim();
          if (parts[1]) {
            sectionName = parts[1]?.trim();
          }
        }
        break;
      }
      case "quoted_section":
        if (!sectionName) {
          sectionName = token.value.trim();
        }
        break;
      case "project_section": {
        if (!projectName) {
          const parts = token.value.split("/");
          projectName = parts[0];
          if (parts[1]) {
            sectionName = parts[1];
          }
        }
        break;
      }
      case "section":
        if (!sectionName) {
          sectionName = token.value;
        }
        break;
      case "quoted_label":
      case "label":
        labelNames.push(token.value.trim());
        break;
      case "priority":
        switch (token.value) {
          case "p1":
            priority = TaskPriority.HIGH;
            break;
          case "p2":
            priority = TaskPriority.MEDIUM;
            break;
          case "p3":
          case "p4":
            priority = TaskPriority.LOW;
            break;
        }
        break;
      case "assignee":
        assignee = token.value;
        break;
      case "reminder":
        reminder = token.value;
        break;
      case "description":
        if (!inlineDescription) {
          inlineDescription = token.value;
        }
        break;
      case "word":
        titleWords.push(token.value);
        break;
      case "deadline":
        if (!parsedDate) {
          const dateRes = chrono.parseDate(token.value, new Date(), {
            forwardDate: true,
          });
          if (dateRes) {
            parsedDate = dateRes;
            dateText = token.value;
          }
        }
        break;
      default:
        break;
    }
  }

  return {
    title: titleWords.join(" ").trim(),
    projectName,
    sectionName,
    labelNames: Array.from(new Set(labelNames)),
    priority,
    deadlineString,
    parsedDate,
    dateText,
    description: inlineDescription || "",
    assignee,
    reminder,
  };
}

/**
 * Resolves parsed token names against database entities (projects, sections, labels)
 * and formats the final validated payload for task creation.
 */
export function resolveQuickTask(
  parsed: ParsedRawQuickTask,
  context: QuickTaskEntityContext
): ResolvedQuickTask {
  const { projects, sections, labels, defaultProjectId, defaultSectionId } =
    context;

  // 1. Resolve Project (exact match first, then normalized slug/space-insensitive match)
  let resolvedProject = parsed.projectName
    ? projects.find(
        (p) => p.name.toLowerCase() === parsed.projectName?.toLowerCase()
      )
    : undefined;

  if (!resolvedProject && parsed.projectName) {
    resolvedProject = projects.find(
      (p) => normalizeName(p.name) === normalizeName(parsed.projectName!)
    );
  }

  if (!resolvedProject && defaultProjectId) {
    resolvedProject = projects.find((p) => p.id === defaultProjectId);
  }

  const projectId = resolvedProject?.id || defaultProjectId;
  const projectName = resolvedProject?.name;
  const projectColor = resolvedProject?.colorHexCode;

  // 2. Resolve Section (belongs to resolved project)
  const availableSections = projectId
    ? sections.filter((s) => s.projectId === projectId)
    : sections;

  let resolvedSection = parsed.sectionName
    ? availableSections.find(
        (s) => s.name.toLowerCase() === parsed.sectionName?.toLowerCase()
      )
    : undefined;

  if (!resolvedSection && parsed.sectionName) {
    resolvedSection = availableSections.find(
      (s) => normalizeName(s.name) === normalizeName(parsed.sectionName!)
    );
  }

  if (!resolvedSection) {
    // Fallback to first section of the project, or defaultSectionId
    resolvedSection =
      availableSections[0] ||
      (defaultSectionId
        ? sections.find((s) => s.id === defaultSectionId)
        : undefined);
  }

  const sectionId = resolvedSection?.id || defaultSectionId;
  const sectionName = resolvedSection?.name;

  // 3. Resolve Labels
  const resolvedLabels: Array<{
    id: string;
    name: string;
    colorHexCode?: string;
  }> = [];
  for (const name of parsed.labelNames) {
    const match =
      labels.find((l) => l.name.toLowerCase() === name.toLowerCase()) ||
      labels.find((l) => normalizeName(l.name) === normalizeName(name));
    if (match) {
      resolvedLabels.push({
        id: match.id,
        name: match.name,
        colorHexCode: match.colorHexCode,
      });
    }
  }

  // 4. Resolve Date & timeRange
  let timeRange: { start: string; end: string } | null = null;
  let dateDisplayText: string | undefined;

  if (parsed.parsedDate) {
    const startDate = new Date(parsed.parsedDate);
    // When a single point in time is specified, default duration is 1 hour
    // ensuring start < end (PostgreSQL tstzrange requires start < end for non-empty ranges)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    timeRange = {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
    dateDisplayText = parsed.dateText || startDate.toLocaleDateString();
  }

  // 5. Build description, noting unsupported features if present
  let finalDescription = (parsed.description || "").trim();
  const notes: string[] = [];
  if (parsed.assignee) {
    notes.push(`[Assignee: ${parsed.assignee}]`);
  }
  if (parsed.reminder) {
    notes.push(`[Reminder: ${parsed.reminder}]`);
  }
  if (notes.length > 0) {
    const extra = notes.join(" ");
    finalDescription = finalDescription
      ? `${finalDescription}\n\n${extra}`
      : extra;
  }

  return {
    title: parsed.title,
    description: finalDescription,
    priority: parsed.priority || TaskPriority.HIGH,
    projectId,
    projectName,
    projectColor,
    sectionId,
    sectionName,
    labels: resolvedLabels,
    timeRange,
    dateDisplayText,
    assignee: parsed.assignee,
    reminder: parsed.reminder,
  };
}

export type AutocompleteKind = "project" | "section" | "label";

export interface AutocompleteContext {
  kind: AutocompleteKind;
  trigger: "#" | "/" | "%" | "@";
  query: string;
  start: number;
  end: number;
  projectName?: string;
}

/**
 * Detects whether the current caret position is within an inline trigger token (#, /, %, @),
 * extracting the query and trigger context for live autocomplete suggestions.
 */
export function getAutocompleteContext(
  text: string,
  caret: number
): AutocompleteContext | null {
  if (caret <= 0 || caret > text.length) return null;

  const sub = text.slice(0, caret);

  // 1. Ignore if caret is inside a description (after //)
  const descIndex = sub.indexOf("//");
  if (descIndex !== -1) return null;

  // 2. Ignore if caret is inside a deadline { ... }
  const lastOpenBrace = sub.lastIndexOf("{");
  const lastCloseBrace = sub.lastIndexOf("}");
  if (lastOpenBrace !== -1 && lastOpenBrace > lastCloseBrace) {
    return null;
  }

  // 3. Check for compound #Project/query or #[Project]/query section trigger
  const compoundRegex = /(?:^|\s)#([^#%@{}/\n]+)\/([^#%@{}\n]*)$/;
  const compoundMatch = sub.match(compoundRegex);
  if (compoundMatch) {
    let rawProj = compoundMatch[1].trim();
    if (
      (rawProj.startsWith('"') && rawProj.endsWith('"')) ||
      (rawProj.startsWith("[") && rawProj.endsWith("]"))
    ) {
      rawProj = rawProj.slice(1, -1).trim();
    }

    const slashIndexInMatch = compoundMatch[0].lastIndexOf("/");
    const start = sub.length - compoundMatch[0].length + slashIndexInMatch;
    const query = compoundMatch[2] || "";

    return {
      kind: "section",
      trigger: "/",
      query,
      start,
      end: caret,
      projectName: rawProj,
    };
  }

  // 4. Standalone triggers: # (project), / (section), % or @ (label)
  const standaloneRegex = /(?:^|\s)([#%@/])([^#%@{}\n]*)$/;
  const match = sub.match(standaloneRegex);
  if (!match) return null;

  const trigger = match[1] as "#" | "/" | "%" | "@";
  const query = match[2] || "";
  const triggerIndexInMatch = match[0].lastIndexOf(trigger);
  const start = sub.length - match[0].length + triggerIndexInMatch;

  let kind: AutocompleteKind;
  if (trigger === "#") {
    kind = "project";
  } else if (trigger === "/") {
    kind = "section";
  } else {
    kind = "label";
  }

  return {
    kind,
    trigger,
    query,
    start,
    end: caret,
  };
}

/**
 * Replaces the typed trigger and query token with the chosen entity name,
 * returning the updated text and new caret position placed right after the trailing space.
 */
export function applyAutocompleteSelection(
  text: string,
  ctx: AutocompleteContext,
  name: string
): { text: string; caret: number } {
  let formattedName = name;
  if (/[\/#%@{}]/.test(name)) {
    formattedName = `[${name}]`;
  }

  const prefix = text.slice(0, ctx.start);
  const suffix = text.slice(ctx.end);
  const inserted = `${ctx.trigger}${formattedName} `;
  const nextText = `${prefix}${inserted}${suffix}`;
  const nextCaret = prefix.length + inserted.length;

  return { text: nextText, caret: nextCaret };
}
