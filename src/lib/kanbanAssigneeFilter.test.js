import { describe, expect, it } from "vitest";
import { ASSIGNEE_CHIP_KEY_UNASSIGNED } from "../components/CustomFiltersPanel.jsx";
import {
  filterTasksByColumnForAssigneeKeys,
  parseAssigneeKeysFromSearchParams,
} from "./kanbanAssigneeFilter.js";

function params(assignees) {
  return new URLSearchParams(assignees != null ? { assignees } : {});
}

const board = {
  todo: [
    { id: "t1", userId: "user-a" },
    { id: "t2", userId: "" },
    { id: "t3", userId: "unknown-id" },
  ],
  inProgress: [{ id: "t4", userId: "user-b" }],
  review: [],
  done: [],
};

describe("parseAssigneeKeysFromSearchParams", () => {
  it("returns empty array when assignees param is missing", () => {
    expect(parseAssigneeKeysFromSearchParams(new URLSearchParams())).toEqual([]);
  });

  it("splits, trims, and drops empty segments", () => {
    expect(parseAssigneeKeysFromSearchParams(params(" user-a ,, user-b "))).toEqual([
      "user-a",
      "user-b",
    ]);
  });
});

describe("filterTasksByColumnForAssigneeKeys", () => {
  const knownUserIds = new Set(["user-a", "user-b"]);

  it("returns input unchanged when no assignee keys are selected", () => {
    expect(
      filterTasksByColumnForAssigneeKeys(board, [], knownUserIds)
    ).toBe(board);
  });

  it("keeps only tasks assigned to selected known users", () => {
    const filtered = filterTasksByColumnForAssigneeKeys(
      board,
      ["user-a"],
      knownUserIds
    );

    expect(filtered.todo.map((t) => t.id)).toEqual(["t1"]);
    expect(filtered.inProgress).toEqual([]);
  });

  it("includes unassigned tasks when __unassigned__ chip is selected", () => {
    const filtered = filterTasksByColumnForAssigneeKeys(
      board,
      [ASSIGNEE_CHIP_KEY_UNASSIGNED],
      knownUserIds
    );

    expect(filtered.todo.map((t) => t.id)).toEqual(["t2", "t3"]);
    expect(filtered.inProgress).toEqual([]);
  });

  it("combines user filter and unassigned chip", () => {
    const filtered = filterTasksByColumnForAssigneeKeys(
      board,
      ["user-b", ASSIGNEE_CHIP_KEY_UNASSIGNED],
      knownUserIds
    );

    expect(filtered.todo.map((t) => t.id)).toEqual(["t2", "t3"]);
    expect(filtered.inProgress.map((t) => t.id)).toEqual(["t4"]);
  });
});
