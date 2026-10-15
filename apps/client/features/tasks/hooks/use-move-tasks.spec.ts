import { describe, it, expect } from "vitest";
import { reorderTasksOptimistically } from "./use-move-tasks";
import { TaskPriority, type TaskResponseDto as Task } from "@todo/shared";

function createTask(id: string, sectionId: string, title: string): Task {
  return {
    id,
    title,
    description: "",
    timeRange: null,
    priority: TaskPriority.LOW,
    sectionId,
    section: {
      id: sectionId,
      name: `Section ${sectionId}`,
      project: { id: "proj-1", name: "Project 1" },
    },
    labels: [],
    completedAt: null,
    recurrence: null,
    reminders: [],
  };
}

describe("reorderTasksOptimistically", () => {
  const initialTasks: Task[] = [
    createTask("t1", "sec-1", "Task 1"),
    createTask("t2", "sec-1", "Task 2"),
    createTask("t3", "sec-1", "Task 3"),
    createTask("t4", "sec-2", "Task 4"),
    createTask("t5", "sec-2", "Task 5"),
  ];

  it("should return identical array if task is not found", () => {
    const result = reorderTasksOptimistically(initialTasks, {
      taskId: "non-existent",
      sectionId: "sec-1",
      prevId: null,
    });
    expect(result).toEqual(initialTasks);
  });

  it("should reorder within same section to the top (prevId is null)", () => {
    const result = reorderTasksOptimistically(initialTasks, {
      taskId: "t3",
      sectionId: "sec-1",
      prevId: null,
    });

    const sec1TaskIds = result.filter((t) => t.sectionId === "sec-1").map((t) => t.id);
    expect(sec1TaskIds).toEqual(["t3", "t1", "t2"]);
  });

  it("should reorder within same section after another task", () => {
    const result = reorderTasksOptimistically(initialTasks, {
      taskId: "t1",
      sectionId: "sec-1",
      prevId: "t2",
    });

    const sec1TaskIds = result.filter((t) => t.sectionId === "sec-1").map((t) => t.id);
    expect(sec1TaskIds).toEqual(["t2", "t1", "t3"]);
  });

  it("should move a task to another section at the top (prevId is null)", () => {
    const result = reorderTasksOptimistically(initialTasks, {
      taskId: "t1",
      sectionId: "sec-2",
      prevId: null,
    });

    const sec1TaskIds = result.filter((t) => t.sectionId === "sec-1").map((t) => t.id);
    const sec2TaskIds = result.filter((t) => t.sectionId === "sec-2").map((t) => t.id);

    expect(sec1TaskIds).toEqual(["t2", "t3"]);
    expect(sec2TaskIds).toEqual(["t1", "t4", "t5"]);

    const movedTask = result.find((t) => t.id === "t1");
    expect(movedTask?.sectionId).toBe("sec-2");
    expect(movedTask?.section?.id).toBe("sec-2");
  });

  it("should move a task to another section after a specific task", () => {
    const result = reorderTasksOptimistically(initialTasks, {
      taskId: "t1",
      sectionId: "sec-2",
      prevId: "t4",
    });

    const sec1TaskIds = result.filter((t) => t.sectionId === "sec-1").map((t) => t.id);
    const sec2TaskIds = result.filter((t) => t.sectionId === "sec-2").map((t) => t.id);

    expect(sec1TaskIds).toEqual(["t2", "t3"]);
    expect(sec2TaskIds).toEqual(["t4", "t1", "t5"]);
  });

  it("should move a task to an empty section", () => {
    const result = reorderTasksOptimistically(initialTasks, {
      taskId: "t1",
      sectionId: "sec-empty",
      prevId: null,
    });

    const emptySecTaskIds = result.filter((t) => t.sectionId === "sec-empty").map((t) => t.id);
    expect(emptySecTaskIds).toEqual(["t1"]);

    const movedTask = result.find((t) => t.id === "t1");
    expect(movedTask?.sectionId).toBe("sec-empty");
  });

  it("should not mutate the original tasks array", () => {
    const copy = [...initialTasks];
    reorderTasksOptimistically(initialTasks, {
      taskId: "t2",
      sectionId: "sec-2",
      prevId: "t4",
    });

    expect(initialTasks).toEqual(copy);
  });
});
