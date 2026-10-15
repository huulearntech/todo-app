import { describe, it, expect } from "vitest";
import {
  parseReminderOffset,
  normalizeName,
  parseQuickTaskInput,
  resolveQuickTask,
  getAutocompleteContext,
} from "./quick-task-parser";
import { TaskPriority } from "@todo/shared";

describe("quick-task-parser", () => {
  describe("parseReminderOffset", () => {
    it("parses zero offsets and synonyms", () => {
      expect(parseReminderOffset("0")).toBe(0);
      expect(parseReminderOffset("0m")).toBe(0);
      expect(parseReminderOffset("at time of task")).toBe(0);
      expect(parseReminderOffset("on time")).toBe(0);
      expect(parseReminderOffset("at start")).toBe(0);
    });

    it("parses minute offsets", () => {
      expect(parseReminderOffset("15m")).toBe(15);
      expect(parseReminderOffset("30min")).toBe(30);
      expect(parseReminderOffset("45 minutes")).toBe(45);
    });

    it("parses hour offsets into minutes", () => {
      expect(parseReminderOffset("1h")).toBe(60);
      expect(parseReminderOffset("2hr")).toBe(120);
      expect(parseReminderOffset("3 hours")).toBe(180);
    });

    it("parses day offsets into minutes", () => {
      expect(parseReminderOffset("1d")).toBe(1440);
      expect(parseReminderOffset("2 days")).toBe(2880);
    });

    it("returns null for invalid inputs", () => {
      expect(parseReminderOffset("")).toBeNull();
      expect(parseReminderOffset("invalid")).toBeNull();
      expect(parseReminderOffset("abc min")).toBeNull();
    });
  });

  describe("normalizeName", () => {
    it("strips whitespace, dashes, underscores and lowercases", () => {
      expect(normalizeName("My Project")).toBe("myproject");
      expect(normalizeName("my-project")).toBe("myproject");
      expect(normalizeName("MY_PROJECT")).toBe("myproject");
    });
  });

  describe("parseQuickTaskInput", () => {
    it("parses basic title", () => {
      const result = parseQuickTaskInput("Buy milk");
      expect(result.title).toBe("Buy milk");
      expect(result.description).toBe("");
      expect(result.labelNames).toEqual([]);
      expect(result.priority).toBeUndefined();
    });

    it("parses priority tokens", () => {
      expect(parseQuickTaskInput("Task A p1").priority).toBe(TaskPriority.HIGH);
      expect(parseQuickTaskInput("Task B p2").priority).toBe(TaskPriority.MEDIUM);
      expect(parseQuickTaskInput("Task C p3").priority).toBe(TaskPriority.LOW);
      expect(parseQuickTaskInput("Task D p4").priority).toBe(TaskPriority.LOW);
    });

    it("parses inline project and section", () => {
      const result = parseQuickTaskInput("Fix bug #Backend/API");
      expect(result.title).toBe("Fix bug");
      expect(result.projectName).toBe("Backend");
      expect(result.sectionName).toBe("API");
    });

    it("parses quoted multi-word project and section", () => {
      const result = parseQuickTaskInput('Deploy website #"Marketing Web"/"Sprint 1"');
      expect(result.title).toBe("Deploy website");
      expect(result.projectName).toBe("Marketing Web");
      expect(result.sectionName).toBe("Sprint 1");
    });

    it("parses labels", () => {
      const result = parseQuickTaskInput("Write docs %documentation @frontend");
      expect(result.title).toBe("Write docs");
      expect(result.labelNames).toEqual(["documentation", "frontend"]);
    });

    it("parses reminder token", () => {
      const result = parseQuickTaskInput("Team meeting !30m");
      expect(result.title).toBe("Team meeting");
      expect(result.reminder).toBe("30m");
      expect(result.reminderMinutes).toBe(30);
    });

    it("parses inline description separated by //", () => {
      const result = parseQuickTaskInput("Submit report // Make sure to check quarterly sales");
      expect(result.title).toBe("Submit report");
      expect(result.description).toBe("Make sure to check quarterly sales");
    });

    it("parses explicit deadline with braces", () => {
      const result = parseQuickTaskInput("Finish feature {tomorrow at 5pm}");
      expect(result.title).toBe("Finish feature");
      expect(result.deadlineString).toBe("tomorrow at 5pm");
      expect(result.parsedDate).toBeInstanceOf(Date);
    });
  });

  describe("resolveQuickTask", () => {
    const context = {
      projects: [
        { id: "proj-1", name: "Backend", colorKey: "blue" },
        { id: "proj-2", name: "Frontend", colorKey: "green" },
      ],
      sections: [
        { id: "sec-1", name: "Inbox", projectId: "proj-1" },
        { id: "sec-2", name: "Sprint", projectId: "proj-1" },
        { id: "sec-3", name: "General", projectId: "proj-2" },
      ],
      labels: [
        { id: "lbl-1", name: "Bug", colorKey: "red" },
        { id: "lbl-2", name: "Feature", colorKey: "purple" },
      ],
      defaultProjectId: "proj-1",
      defaultSectionId: "sec-1",
    };

    it("resolves project, section, and labels by name", () => {
      const raw = parseQuickTaskInput("Fix auth #Backend/Sprint %Bug p1 !1h");
      const resolved = resolveQuickTask(raw, context);

      expect(resolved.title).toBe("Fix auth");
      expect(resolved.projectId).toBe("proj-1");
      expect(resolved.projectName).toBe("Backend");
      expect(resolved.sectionId).toBe("sec-2");
      expect(resolved.sectionName).toBe("Sprint");
      expect(resolved.labels).toEqual([{ id: "lbl-1", name: "Bug", colorKey: "red" }]);
      expect(resolved.priority).toBe(TaskPriority.HIGH);
      expect(resolved.reminders).toEqual([
        {
          type: "relative",
          minuteOffset: 60,
          channel: "email",
        },
      ]);
    });

    it("falls back to default project and section when none provided", () => {
      const raw = parseQuickTaskInput("Simple task");
      const resolved = resolveQuickTask(raw, context);

      expect(resolved.projectId).toBe("proj-1");
      expect(resolved.sectionId).toBe("sec-1");
    });

    it("computes 1-hour timeRange from parsedDate", () => {
      const date = new Date("2026-10-15T10:00:00Z");
      const raw = {
        title: "Conference call",
        labelNames: [],
        description: "",
        parsedDate: date,
      };

      const resolved = resolveQuickTask(raw, context);
      expect(resolved.timeRange).not.toBeNull();
      expect(resolved.timeRange?.start).toBe("2026-10-15T10:00:00.000Z");
      expect(resolved.timeRange?.end).toBe("2026-10-15T11:00:00.000Z");
    });
  });

  describe("getAutocompleteContext", () => {
    it("detects # project trigger", () => {
      const ctx = getAutocompleteContext("Task #Back", 10);
      expect(ctx).not.toBeNull();
      expect(ctx?.kind).toBe("project");
      expect(ctx?.trigger).toBe("#");
      expect(ctx?.query).toBe("Back");
    });

    it("detects / section trigger", () => {
      const ctx = getAutocompleteContext("Task /Spr", 9);
      expect(ctx).not.toBeNull();
      expect(ctx?.kind).toBe("section");
      expect(ctx?.trigger).toBe("/");
      expect(ctx?.query).toBe("Spr");
    });

    it("detects compound #Project/section trigger", () => {
      const ctx = getAutocompleteContext("Task #Backend/In", 16);
      expect(ctx).not.toBeNull();
      expect(ctx?.kind).toBe("section");
      expect(ctx?.projectName).toBe("Backend");
      expect(ctx?.query).toBe("In");
    });

    it("detects % label trigger", () => {
      const ctx = getAutocompleteContext("Task %urg", 9);
      expect(ctx).not.toBeNull();
      expect(ctx?.kind).toBe("label");
      expect(ctx?.trigger).toBe("%");
      expect(ctx?.query).toBe("urg");
    });

    it("detects ! reminder trigger", () => {
      const ctx = getAutocompleteContext("Task !15", 8);
      expect(ctx).not.toBeNull();
      expect(ctx?.kind).toBe("reminder");
      expect(ctx?.trigger).toBe("!");
      expect(ctx?.query).toBe("15");
    });

    it("returns null if inside description after //", () => {
      const ctx = getAutocompleteContext("Task // check #notAProject", 24);
      expect(ctx).toBeNull();
    });
  });
});
