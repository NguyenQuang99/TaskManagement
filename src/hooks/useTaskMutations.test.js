import { describe, expect, it } from "vitest";
import { getKanbanDragPersistTaskIds } from "./useTaskMutations.js";

const PERSIST_MAPS = {
  columnKeys: ["todo", "inProgress", "review", "done"],
  columnToFirebase: {
    todo: "column_01",
    inProgress: "column_02",
    review: "column_03",
    done: "column_04",
  },
  columnStatus: {
    todo: "todo",
    inProgress: "in-progress",
    review: "review",
    done: "done",
  },
};

function board(overrides = {}) {
  return {
    todo: [],
    inProgress: [],
    review: [],
    done: [],
    ...overrides,
  };
}

describe("getKanbanDragPersistTaskIds", () => {
  it("returns empty list when board placement is unchanged", () => {
    const snapshot = board({
      todo: [{ id: "a" }, { id: "b" }],
      done: [{ id: "c" }],
    });

    expect(getKanbanDragPersistTaskIds(snapshot, snapshot, PERSIST_MAPS)).toEqual(
      []
    );
  });

  it("returns moved task id when task changes column without shifting others", () => {
    const snapshot = board({
      todo: [{ id: "a", userId: "u1" }],
    });
    const next = board({
      inProgress: [{ id: "a", userId: "u1" }],
    });

    expect(getKanbanDragPersistTaskIds(snapshot, next, PERSIST_MAPS)).toEqual([
      "a",
    ]);
  });

  it("includes tasks whose order index changed when a card is inserted ahead of them", () => {
    const snapshot = board({
      todo: [{ id: "a", userId: "u1" }],
      done: [{ id: "b" }],
    });
    const next = board({
      done: [{ id: "a", userId: "u1" }, { id: "b" }],
      todo: [],
    });

    expect(getKanbanDragPersistTaskIds(snapshot, next, PERSIST_MAPS)).toEqual([
      "a",
      "b",
    ]);
  });

  it("returns all task ids whose order index changed in the same column", () => {
    const snapshot = board({
      todo: [{ id: "a" }, { id: "b" }, { id: "c" }],
    });
    const next = board({
      todo: [{ id: "c" }, { id: "a" }, { id: "b" }],
    });

    expect(getKanbanDragPersistTaskIds(snapshot, next, PERSIST_MAPS)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
});
