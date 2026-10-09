import * as chrono from "chrono-node";
import moo from "moo";
import { TaskPriority, type ReminderDto } from "@todo/shared";
import { getColorConfig } from "@/lib/color-palette";

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
  reminderMinutes?: number;
}

export interface QuickTaskEntityContext {
  projects: Array<{ id: string; name: string; colorKey?: string }>;
  sections: Array<{ id: string; name: string; projectId: string }>;
  labels: Array<{ id: string; name: string; colorKey?: string }>;
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
  labels: Array<{ id: string; name: string; colorKey?: string }>;
  timeRange: { start: string; end: string } | null;
  dateDisplayText?: string;
  assignee?: string;
  reminder?: string;
  reminderMinutes?: number;
  reminders?: ReminderDto[];
}

export interface ParserOptions {
  projects?: Array<{ id: string; name: string; colorKey?: string }>;
  sections?: Array<{ id: string; name: string; projectId: string }>;
  labels?: Array<{ id: string; name: string; colorKey?: string }>;
}

const escapeRegex = (s: string) =>
  s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

export const normalizeName = (s: string) =>
  s.replace(/[\s\-_]/g, "").toLowerCase();

/**
 * Parses relative minute offset from a string like "30m", "1h", "1d", "0m",
 * or natural language phrases like "at time of task".
 */
export function parseReminderOffset(val: string): number | null {
  if (!val) return null;
  const clean = val
    .replace(/^!/, "")
    .replace(/["'\[\]]/g, "")
    .trim()
    .toLowerCase();

  if (
    clean === "0" ||
    clean === "0m" ||
    clean === "at time of task" ||
    clean === "on time" ||
    clean === "at start"
  ) {
    return 0;
  }

  const match = clean.match(
    /^(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)?$/i
  );
  if (!match) return null;

  const num = parseInt(match[1], 10);
  if (isNaN(num)) return null;

  const unit = match[2]?.toLowerCase();
  if (!unit || unit.startsWith("m")) {
    return num;
  }
  if (unit.startsWith("h")) {
    return num * 60;
  }
  if (unit.startsWith("d")) {
    return num * 1440;
  }
  return num;
}

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
    quoted_reminder: {
      match: /!(?:\"[^\"]+\"|\[[^\]]+\])/,
      value: (s) => s.slice(2, -1),
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

  interface FoundProjectSection {
    start: number;
    end: number;
    projectName?: string;
    sectionName?: string;
  }

  const foundList: FoundProjectSection[] = [];

  // 1. Quoted or Bracketed compound or separated:
  // e.g. #"Work Projects" / "Sprint 1" or #[Work Projects]/[Sprint 1] or #"Work Projects/Sprint 1"
  const quotedRegex =
    /(?:^|\s)(#(?:\"([^\"]+)\"|\[([^\]]+)\])(?:(?:\/|\s*\/\s*)(?:\"([^\"]+)\"|\[([^\]]+)\]))?)/gi;
  let qm: RegExpExecArray | null;
  while ((qm = quotedRegex.exec(input)) !== null) {
    const rawSpan = qm[1];
    const startIndex = qm.index + qm[0].indexOf(rawSpan);
    const rawProj = (qm[2] || qm[3] || "").trim();
    const rawSec = (qm[4] || qm[5] || "").trim();
    let pName = rawProj;
    let sName = rawSec || undefined;
    if (!sName && rawProj.includes("/")) {
      const parts = rawProj.split("/");
      pName = parts[0]?.trim();
      sName = parts[1]?.trim();
    }
    foundList.push({
      start: startIndex,
      end: startIndex + rawSpan.length,
      projectName: pName,
      sectionName: sName,
    });
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
        `(?:^|\\s)(#(?:${pEsc}|${pSlug})(?:\\s*\\/\\s*([^%#@+!{\\n]+))?)`,
        "gi"
      );
      let m: RegExpExecArray | null;
      while ((m = re.exec(input)) !== null) {
        const rawSpan = m[1];
        const startIndex = m.index + m[0].indexOf(rawSpan);
        let sName: string | undefined;
        if (m[2]) {
          const secPart = m[2].trim();
          const projSections = options.sections
            ? options.sections.filter((s) => s.projectId === proj.id)
            : [];
          const sortedSections = [...projSections].sort(
            (a, b) => b.name.length - a.name.length
          );
          let foundSec = false;
          for (const sec of sortedSections) {
            if (secPart.toLowerCase().startsWith(sec.name.toLowerCase())) {
              sName = sec.name;
              foundSec = true;
              break;
            }
          }
          if (!foundSec) {
            sName = secPart.split(/\s+(?:%|@|p[1-4]|\+|!|\{|\/\/)/i)[0]?.trim();
          }
        }
        foundList.push({
          start: startIndex,
          end: startIndex + rawSpan.length,
          projectName: proj.name,
          sectionName: sName,
        });
      }
    }
  }

  // 3. Standalone quoted section: /"Section Name" or /[Section Name]
  const quotedSecRegex = /(?:^|\s)(\/(?:\"([^\"]+)\"|\[([^\]]+)\]))/gi;
  let sm: RegExpExecArray | null;
  while ((sm = quotedSecRegex.exec(input)) !== null) {
    const rawSpan = sm[1];
    const startIndex = sm.index + sm[0].indexOf(rawSpan);
    const sName = (sm[2] || sm[3] || "").trim();
    foundList.push({
      start: startIndex,
      end: startIndex + rawSpan.length,
      sectionName: sName,
    });
  }

  // Deduplicate overlapping spans (earliest / longest start wins)
  foundList.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const nonOverlapping: FoundProjectSection[] = [];
  let lastEnd = 0;
  for (const item of foundList) {
    if (item.start >= lastEnd) {
      nonOverlapping.push(item);
      lastEnd = item.end;
    }
  }

  // Determine latest-wins values:
  for (const item of nonOverlapping) {
    if (item.projectName) {
      projectName = item.projectName;
      sectionName = item.sectionName;
    } else if (item.sectionName) {
      sectionName = item.sectionName;
    }
  }

  // Strip ALL matched project and section spans from text (in reverse order)
  const sortedDesc = [...nonOverlapping].sort((a, b) => b.start - a.start);
  for (const item of sortedDesc) {
    text = `${text.slice(0, item.start)} ${text.slice(item.end)}`;
  }

  return { text: text.replace(/\s+/g, " ").trim(), projectName, sectionName };
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

  // 2. Extract inline reminder (!30m, !1h, !["30 minutes before"], etc.) BEFORE date parsing
  // so Chrono's natural language parser never mistakes "!30m" for a relative timestamp ("30 minutes from now").
  let preReminder: string | undefined;
  let preReminderMinutes: number | undefined;

  const reminderRegex =
    /(?:^|\s)(!(?:\"([^\"]+)\"|\[([^\]]+)\]|[^\s\/#%@{}+!]+))(?=\s|$)/g;
  const foundReminders = [...textToParse.matchAll(reminderRegex)];
  if (foundReminders.length > 0) {
    const lastR = foundReminders[foundReminders.length - 1];
    const rawVal = (lastR[2] || lastR[3] || lastR[1].slice(1)).trim();
    preReminder = rawVal;
    const offset = parseReminderOffset(rawVal);
    if (offset !== null) {
      preReminderMinutes = offset;
    }
    // Remove all reminder tokens from textToParse so Chrono doesn't see them
    textToParse = textToParse.replace(reminderRegex, " ").trim();
  }

  // 3. Extract deadline {date} or natural language date via chrono-node
  let deadlineString: string | undefined;
  let parsedDate: Date | undefined;
  let dateText: string | undefined;

  const deadlineMatches = [...textToParse.matchAll(/\{([^}\n]+)\}/g)];
  if (deadlineMatches.length > 0) {
    // Latest wins: iterate in reverse to find the winning date
    for (let i = deadlineMatches.length - 1; i >= 0; i--) {
      const dMatch = deadlineMatches[i];
      const rawDate = dMatch[1].trim();
      const dateRes = chrono.parseDate(rawDate, new Date(), {
        forwardDate: true,
      });
      if (dateRes) {
        parsedDate = dateRes;
        deadlineString = rawDate;
        dateText = rawDate;
        break;
      }
    }
    // Remove ALL {date} tokens from remaining text so none leak into title
    textToParse = textToParse.replace(/\{[^}\n]+\}/g, " ").trim();
  } else {
    // Attempt natural language date extraction
    const chronoResults = chrono.parse(textToParse, new Date(), {
      forwardDate: true,
    });
    if (chronoResults.length > 0) {
      // Pick the last natural language date match
      const match = chronoResults[chronoResults.length - 1];
      parsedDate = match.start.date();
      dateText = match.text;
      // Remove all natural language date spans
      for (let i = chronoResults.length - 1; i >= 0; i--) {
        const m = chronoResults[i];
        const before = textToParse.slice(0, m.index);
        const after = textToParse.slice(m.index + m.text.length);
        textToParse = `${before} ${after}`;
      }
      textToParse = textToParse.replace(/\s+/g, " ").trim();
    }
  }

  // 4. Extract multi-word project & section names (quoted or entity-matched)
  const {
    text: textAfterProjectSection,
    projectName: preProjectName,
    sectionName: preSectionName,
  } = extractMultiWordProjectAndSection(textToParse, options);
  textToParse = textAfterProjectSection;

  // 5. Extract multi-word label names (quoted or entity-matched)
  const { text: textAfterLabels, labelNames: preLabelNames } =
    extractMultiWordLabels(textToParse, options);
  textToParse = textAfterLabels;

  // 6. Tokenize remaining text with moo
  const lexer = createLexer();
  lexer.reset(textToParse);

  const titleWords: string[] = [];
  const labelNames: string[] = [...preLabelNames];
  let projectName = preProjectName;
  let sectionName = preSectionName;
  let priority: TaskPriority | undefined;
  let assignee: string | undefined;
  let reminder: string | undefined = preReminder;
  let reminderMinutes: number | undefined = preReminderMinutes;

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
      case "quoted_reminder":
      case "reminder": {
        reminder = token.value;
        const offset = parseReminderOffset(token.value);
        if (offset !== null) {
          reminderMinutes = offset;
        }
        break;
      }
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
    reminderMinutes,
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
  const projectColor = resolvedProject?.colorKey;

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
    colorKey?: string;
  }> = [];
  for (const name of parsed.labelNames) {
    const match =
      labels.find((l) => l.name.toLowerCase() === name.toLowerCase()) ||
      labels.find((l) => normalizeName(l.name) === normalizeName(name));
    if (match) {
      resolvedLabels.push({
        id: match.id,
        name: match.name,
        colorKey: match.colorKey,
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
  if (parsed.reminder && parsed.reminderMinutes === undefined) {
    notes.push(`[Reminder: ${parsed.reminder}]`);
  }
  if (notes.length > 0) {
    const extra = notes.join(" ");
    finalDescription = finalDescription
      ? `${finalDescription}\n\n${extra}`
      : extra;
  }

  const reminders =
    parsed.reminderMinutes !== undefined
      ? [
          {
            type: "relative" as const,
            minuteOffset: parsed.reminderMinutes,
            channel: "email" as const,
          },
        ]
      : [];

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
    reminderMinutes: parsed.reminderMinutes,
    reminders,
  };
}

export type AutocompleteKind = "project" | "section" | "label" | "reminder";

export interface AutocompleteContext {
  kind: AutocompleteKind;
  trigger: "#" | "/" | "%" | "@" | "!";
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

  // 4. Standalone triggers: # (project), / (section), % or @ (label), ! (reminder)
  const standaloneRegex = /(?:^|\s)([#%@/!])([^#%@/!{}\n]*)$/;
  const match = sub.match(standaloneRegex);
  if (!match) return null;

  const trigger = match[1] as "#" | "/" | "%" | "@" | "!";
  const query = match[2] || "";
  const triggerIndexInMatch = match[0].lastIndexOf(trigger);
  const start = sub.length - match[0].length + triggerIndexInMatch;

  let kind: AutocompleteKind;
  if (trigger === "#") {
    kind = "project";
  } else if (trigger === "/") {
    kind = "section";
  } else if (trigger === "!") {
    kind = "reminder";
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

export interface ReminderSuggestion {
  id: string;
  name: string;
  minuteOffset: number;
  token: string;
}

export const DEFAULT_REMINDER_SUGGESTIONS: ReminderSuggestion[] = [
  { id: "0m", name: "At time of task", minuteOffset: 0, token: "0m" },
  { id: "10m", name: "10 minutes before", minuteOffset: 10, token: "10m" },
  { id: "15m", name: "15 minutes before", minuteOffset: 15, token: "15m" },
  { id: "30m", name: "30 minutes before", minuteOffset: 30, token: "30m" },
  { id: "1h", name: "1 hour before", minuteOffset: 60, token: "1h" },
  { id: "2h", name: "2 hours before", minuteOffset: 120, token: "2h" },
  { id: "1d", name: "1 day before", minuteOffset: 1440, token: "1d" },
];

/**
 * Replaces any existing reminder token with the newly selected minute offset,
 * or removes it if minuteOffset is null.
 */
export function syncReminderToken(
  text: string,
  minuteOffset: number | null
): string {
  const reminderRegex =
    /(?:^|\s)!([^\s!]+|"[^"]*"|'[^']*'|\[[^\]]*\])(?=\s|$)/g;

  if (minuteOffset === null) {
    return text.replace(reminderRegex, " ").replace(/\s+/g, " ").trim();
  }

  let label = `${minuteOffset}m`;
  if (minuteOffset === 0) label = "0m";
  else if (minuteOffset % 1440 === 0) label = `${minuteOffset / 1440}d`;
  else if (minuteOffset % 60 === 0) label = `${minuteOffset / 60}h`;

  const newToken = `!${label}`;
  if (reminderRegex.test(text)) {
    return text
      .replace(reminderRegex, ` ${newToken}`)
      .replace(/\s+/g, " ")
      .trim();
  }
  return `${text.trim()} ${newToken}`.trim();
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
  const formattedName = formatEntityToken(name);
  const inserted = `${ctx.trigger}${formattedName} `;
  let prefix = text.slice(0, ctx.start);
  let suffix = text.slice(ctx.end);

  prefix = prefix.replace(/\s+$/, "");
  if (prefix.length > 0) {
    prefix = `${prefix} `;
  }
  suffix = suffix.replace(/^\s+/, "");
  if (suffix.length > 0) {
    suffix = ` ${suffix}`;
  }

  const nextText = `${prefix}${inserted}${suffix}`;
  const nextCaret = prefix.length + inserted.length;

  return { text: nextText, caret: nextCaret };
}

function formatEntityToken(name: string): string {
  if (/[\s\/#%@{}]/.test(name)) {
    return `"${name}"`;
  }
  return name;
}

/**
 * Replaces any existing project/section token with the newly selected one,
 * or appends it to the text if none existed.
 */
export function syncProjectSectionToken(
  text: string,
  projectName: string,
  sectionName?: string
): string {
  const pStr = formatEntityToken(projectName);
  const sStr = sectionName ? `/${formatEntityToken(sectionName)}` : "";
  const newToken = `#${pStr}${sStr}`;

  const projectRegex =
    /(?:^|\s)(#(?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^\s\/]+)(?:\/(?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^\s\/]+))?|\/(?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^\s\/]+))(?=\s|$)/g;

  if (projectRegex.test(text)) {
    let replacedFirst = false;
    return text
      .replace(projectRegex, (match) => {
        if (!replacedFirst) {
          replacedFirst = true;
          const leadingSpace = match.startsWith(" ") ? " " : "";
          return `${leadingSpace}${newToken}`;
        }
        return "";
      })
      .replace(/\s+/g, " ")
      .trim();
  }

  return `${text.trim()} ${newToken}`.trim();
}

/**
 * Replaces or updates the priority token (p1..p4) in the text, or removes it if null.
 */
export function syncPriorityToken(
  text: string,
  priority?: TaskPriority | null
): string {
  const priorityRegex = /(?:^|\s)\b(p[1-4])\b(?=\s|$)/gi;

  if (!priority) {
    return text.replace(priorityRegex, " ").replace(/\s+/g, " ").trim();
  }

  const pToken =
    priority === TaskPriority.HIGH
      ? "p1"
      : priority === TaskPriority.MEDIUM
      ? "p2"
      : "p3";

  if (priorityRegex.test(text)) {
    let replacedFirst = false;
    return text
      .replace(priorityRegex, (match) => {
        if (!replacedFirst) {
          replacedFirst = true;
          const leadingSpace = match.startsWith(" ") ? " " : "";
          return `${leadingSpace}${pToken}`;
        }
        return "";
      })
      .replace(/\s+/g, " ")
      .trim();
  }

  return `${text.trim()} ${pToken}`.trim();
}

/**
 * Replaces or updates the braced date token {...} in the text, or removes it if null.
 */
export function syncDateToken(
  text: string,
  displayText?: string | null
): string {
  const dateRegex = /(?:^|\s)\{[^}]*\}(?=\s|$)/g;

  if (!displayText) {
    return text.replace(dateRegex, " ").replace(/\s+/g, " ").trim();
  }

  const newToken = `{${displayText}}`;

  if (dateRegex.test(text)) {
    let replacedFirst = false;
    return text
      .replace(dateRegex, (match) => {
        if (!replacedFirst) {
          replacedFirst = true;
          const leadingSpace = match.startsWith(" ") ? " " : "";
          return `${leadingSpace}${newToken}`;
        }
        return "";
      })
      .replace(/\s+/g, " ")
      .trim();
  }

  return `${text.trim()} ${newToken}`.trim();
}

/**
 * Toggles a label token (%label) in the text.
 */
export function syncLabelToken(
  text: string,
  labelName: string,
  active: boolean
): string {
  const escaped = escapeRegex(labelName);
  const labelRegex = new RegExp(
    `(?:^|\\s)%("${escaped}"|'${escaped}'|\\[${escaped}\\]|${escaped})(?=\\s|$)`,
    "i"
  );

  if (!active) {
    return text.replace(labelRegex, " ").replace(/\s+/g, " ").trim();
  }

  if (labelRegex.test(text)) {
    return text;
  }

  const tokenStr = formatEntityToken(labelName);
  return `${text.trim()} %${tokenStr}`.trim();
}

export interface HighlightToken {
  text: string;
  type:
    | "text"
    | "project"
    | "section"
    | "label"
    | "priority"
    | "date"
    | "reminder"
    | "description";
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  isOverridden?: boolean;
}

interface MatchInterval {
  start: number;
  end: number;
  type:
    | "project"
    | "section"
    | "label"
    | "priority"
    | "date"
    | "reminder"
    | "description";
  raw: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

export function tokenizeQuickTaskForHighlight(
  text: string,
  options?: ParserOptions
): HighlightToken[] {
  if (!text) return [];

  const intervals: MatchInterval[] = [];

  // 1. Description token (from // to end of string)
  const descMatch = text.match(/\/\/\s*[\s\S]*$/);
  if (descMatch && descMatch.index !== undefined) {
    intervals.push({
      start: descMatch.index,
      end: text.length,
      type: "description",
      raw: descMatch[0],
    });
  }

  const limitIndex =
    descMatch && descMatch.index !== undefined ? descMatch.index : text.length;
  const searchableText = text.slice(0, limitIndex);

  // 2. Date token ({...})
  const dateRegex = /\{[^}]+\}/g;
  let match: RegExpExecArray | null;
  while ((match = dateRegex.exec(searchableText)) !== null) {
    intervals.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "date",
      raw: match[0],
    });
  }

  // 3. Priority token (\bp[1-4]\b)
  const priorityRegex = /(?:^|\s)\b(p[1-4])\b(?=\s|$)/gi;
  while ((match = priorityRegex.exec(searchableText)) !== null) {
    const rawToken = match[1];
    const tokenIndex = match.index + match[0].indexOf(rawToken);
    intervals.push({
      start: tokenIndex,
      end: tokenIndex + rawToken.length,
      type: "priority",
      raw: rawToken,
    });
  }

  // 4. Known multi-word projects and sections
  if (options?.projects && options.projects.length > 0) {
    const sortedProjects = [...options.projects].sort(
      (a, b) => b.name.length - a.name.length
    );
    for (const proj of sortedProjects) {
      const pEsc = escapeRegex(proj.name);
      const re = new RegExp(`#(?:${pEsc})(?:\\s*\\/\\s*([^%#@+!{\\n]+))?`, "gi");
      let mProj: RegExpExecArray | null;
      while ((mProj = re.exec(searchableText)) !== null) {
        let fullRaw = mProj[0];
        if (mProj[1] && options.sections) {
          const secTrimmed = mProj[1].trim();
          for (const s of options.sections) {
            if (secTrimmed.toLowerCase().startsWith(s.name.toLowerCase())) {
              fullRaw = mProj[0].slice(
                0,
                mProj[0].toLowerCase().indexOf(s.name.toLowerCase()) + s.name.length
              );
              break;
            }
          }
        }
        intervals.push({
          start: mProj.index,
          end: mProj.index + fullRaw.length,
          type: "project",
          raw: fullRaw,
        });
      }
    }
  }

  // 5. Known multi-word labels
  if (options?.labels && options.labels.length > 0) {
    const sortedLabels = [...options.labels].sort(
      (a, b) => b.name.length - a.name.length
    );
    for (const lbl of sortedLabels) {
      const lEsc = escapeRegex(lbl.name);
      const re = new RegExp(`[%@](?:${lEsc})`, "gi");
      let mLbl: RegExpExecArray | null;
      while ((mLbl = re.exec(searchableText)) !== null) {
        intervals.push({
          start: mLbl.index,
          end: mLbl.index + mLbl[0].length,
          type: "label",
          raw: mLbl[0],
        });
      }
    }
  }

  // 6. Generic or Quoted Project/Section tokens (#...)
  const projectRegex =
    /(?:^|\s)(#(?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^\s\/#%@{]+)(?:\/(?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^\s\/#%@{]+))?|\/(?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^\s\/#%@{]+))(?=\s|$)/g;
  while ((match = projectRegex.exec(searchableText)) !== null) {
    const rawToken = match[1];
    const tokenIndex = match.index + match[0].indexOf(rawToken);
    intervals.push({
      start: tokenIndex,
      end: tokenIndex + rawToken.length,
      type: rawToken.startsWith("#") ? "project" : "section",
      raw: rawToken,
    });
  }

  // 7. Generic or Quoted Label tokens (%... or @...)
  const labelRegex =
    /(?:^|\s)([%@](?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^\s\/#%@{]+))(?=\s|$)/g;
  while ((match = labelRegex.exec(searchableText)) !== null) {
    const rawToken = match[1];
    const tokenIndex = match.index + match[0].indexOf(rawToken);
    intervals.push({
      start: tokenIndex,
      end: tokenIndex + rawToken.length,
      type: "label",
      raw: rawToken,
    });
  }

  // 8. Generic or Quoted Reminder tokens (!...)
  const reminderRegex =
    /(?:^|\s)(!(?:"[^"]*"|'[^']*'|\[[^\]]*\]|[^\s\/#%@{}+!]+))(?=\s|$)/g;
  while ((match = reminderRegex.exec(searchableText)) !== null) {
    const rawToken = match[1];
    const tokenIndex = match.index + match[0].indexOf(rawToken);
    intervals.push({
      start: tokenIndex,
      end: tokenIndex + rawToken.length,
      type: "reminder",
      raw: rawToken,
    });
  }

  // Sort intervals by start index
  intervals.sort((a, b) => a.start - b.start);

  // Deduplicate overlapping intervals (first one wins)
  const nonOverlapping: MatchInterval[] = [];
  let lastEnd = 0;
  for (const interval of intervals) {
    if (interval.start >= lastEnd) {
      nonOverlapping.push(interval);
      lastEnd = interval.end;
    }
  }

  // Find the winning (last) interval for each single-value attribute type
  let lastProjectItem: MatchInterval | undefined;
  let lastSectionItem: MatchInterval | undefined;
  let lastPriorityItem: MatchInterval | undefined;
  let lastDateItem: MatchInterval | undefined;
  let lastReminderItem: MatchInterval | undefined;

  for (const item of nonOverlapping) {
    if (item.type === "project") {
      lastProjectItem = item;
    } else if (item.type === "section") {
      lastSectionItem = item;
    } else if (item.type === "priority") {
      lastPriorityItem = item;
    } else if (item.type === "date") {
      lastDateItem = item;
    } else if (item.type === "reminder") {
      lastReminderItem = item;
    }
  }

  // Build final tokens with text gaps
  const result: HighlightToken[] = [];
  let cursor = 0;

  for (const item of nonOverlapping) {
    if (item.start > cursor) {
      result.push({
        text: text.slice(cursor, item.start),
        type: "text",
      });
    }

    const raw = text.slice(item.start, item.end);
    let isOverridden = false;
    if (item.type === "project") {
      isOverridden = item !== lastProjectItem;
    } else if (item.type === "section") {
      isOverridden = item !== lastSectionItem;
    } else if (item.type === "priority") {
      isOverridden = item !== lastPriorityItem;
    } else if (item.type === "date") {
      isOverridden = item !== lastDateItem;
    } else if (item.type === "reminder") {
      isOverridden = item !== lastReminderItem;
    }

    let color: string | undefined;
    let backgroundColor: string | undefined;
    let borderColor: string | undefined;

    if (isOverridden) {
      color = "var(--muted-foreground)";
      backgroundColor = "transparent";
      borderColor = "transparent";
    } else if (item.type === "project" || item.type === "section") {
      const cleanProjectName = raw
        .replace(/^#/, "")
        .split("/")[0]
        .replace(/["'\[\]]/g, "")
        .trim();
      const matchedProject = options?.projects?.find(
        (p) => normalizeName(p.name) === normalizeName(cleanProjectName)
      );
      const projColor = getColorConfig(matchedProject?.colorKey).hex;
      color = projColor;
      backgroundColor = hexToRgba(projColor, 0.12);
      borderColor = hexToRgba(projColor, 0.3);
    } else if (item.type === "label") {
      const cleanLabelName = raw
        .replace(/^[%@]/, "")
        .replace(/["'\[\]]/g, "")
        .trim();
      const matchedLabel = options?.labels?.find(
        (l) => normalizeName(l.name) === normalizeName(cleanLabelName)
      );
      if (matchedLabel?.colorKey) {
        const labelColorHex = getColorConfig(matchedLabel.colorKey).hex;
        color = labelColorHex;
        backgroundColor = hexToRgba(labelColorHex, 0.12);
        borderColor = hexToRgba(labelColorHex, 0.25);
      } else {
        // Label does not have colorKey, do not show competing color
        color = "var(--muted-foreground)";
        backgroundColor = "rgba(128, 128, 128, 0.08)";
        borderColor = "transparent";
      }
    } else if (item.type === "priority") {
      const pLower = item.raw.toLowerCase();
      if (pLower === "p1") {
        color = "#ef4444";
        backgroundColor = "rgba(239, 68, 68, 0.15)";
        borderColor = "rgba(239, 68, 68, 0.35)";
      } else if (pLower === "p2") {
        color = "#f59e0b";
        backgroundColor = "rgba(245, 158, 11, 0.15)";
        borderColor = "rgba(245, 158, 11, 0.35)";
      } else if (pLower === "p3") {
        color = "#3b82f6";
        backgroundColor = "rgba(59, 130, 246, 0.15)";
        borderColor = "rgba(59, 130, 246, 0.35)";
      } else {
        color = "var(--muted-foreground)";
        backgroundColor = "rgba(120, 120, 120, 0.1)";
        borderColor = "rgba(120, 120, 120, 0.2)";
      }
    } else if (item.type === "date") {
      color = "#8b5cf6";
      backgroundColor = "rgba(139, 92, 246, 0.14)";
      borderColor = "rgba(139, 92, 246, 0.35)";
    } else if (item.type === "reminder") {
      color = "#f59e0b";
      backgroundColor = "rgba(245, 158, 11, 0.15)";
      borderColor = "rgba(245, 158, 11, 0.35)";
    } else if (item.type === "description") {
      color = "var(--muted-foreground)";
    }

    result.push({
      text: raw,
      type: item.type,
      color,
      backgroundColor,
      borderColor,
      isOverridden,
    });

    cursor = item.end;
  }

  if (cursor < text.length) {
    result.push({
      text: text.slice(cursor),
      type: "text",
    });
  }

  return result;
}

