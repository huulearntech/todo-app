import { describe, it, expect } from "vitest";
import { createModalStore } from "./modal.store";
import type { TaskResponseDto as Task, ProjectResponseDto as Project } from "@todo/shared";

describe("createModalStore", () => {
  it("initializes with activeModal as null", () => {
    const store = createModalStore();
    expect(store.getState().activeModal).toBeNull();
  });

  it("opens add-task modal with optional location data", () => {
    const store = createModalStore();

    store.getState().openModal({
      type: "add-task",
      projectId: "proj-1",
      sectionId: "sec-1",
    });

    expect(store.getState().activeModal).toEqual({
      type: "add-task",
      projectId: "proj-1",
      sectionId: "sec-1",
    });
  });

  it("opens edit-task modal with required task entity", () => {
    const store = createModalStore();
    const mockTask = { id: "task-1", title: "Test Task" } as Task;

    store.getState().openModal({
      type: "edit-task",
      task: mockTask,
    });

    expect(store.getState().activeModal).toEqual({
      type: "edit-task",
      task: mockTask,
    });
  });

  it("opens edit-project modal with required project entity", () => {
    const store = createModalStore();
    const mockProject = { id: "proj-1", name: "Test Project" } as Project;

    store.getState().openModal({
      type: "edit-project",
      project: mockProject,
    });

    expect(store.getState().activeModal).toEqual({
      type: "edit-project",
      project: mockProject,
    });
  });

  it("closes modal and sets activeModal back to null", () => {
    const store = createModalStore();
    store.getState().openModal({ type: "add-task" });
    expect(store.getState().activeModal).not.toBeNull();

    store.getState().closeModal();
    expect(store.getState().activeModal).toBeNull();
  });
});
