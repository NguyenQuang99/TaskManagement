import { ASSIGNEE_CHIP_KEY_UNASSIGNED } from "../components/CustomFiltersPanel.jsx";

export const KANBAN_COLUMN_KEYS = ["todo", "inProgress", "review", "done"];

/**
 * @param {URLSearchParams | { get: (key: string) => string | null }} searchParams
 * @returns {string[]}
 */
export function parseAssigneeKeysFromSearchParams(searchParams) {
  return (searchParams.get("assignees") ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

/**
 * Lọc task theo chip assignee trên URL (known user id hoặc __unassigned__).
 *
 * @param {Record<string, unknown[]>} tasksByColumn
 * @param {Iterable<string>} selectedAssigneeKeys — rỗng = không lọc
 * @param {Iterable<string>} knownUserIds — user id có trong directory
 * @param {string[]} [columnKeys]
 * @returns {Record<string, unknown[]>}
 */
export function filterTasksByColumnForAssigneeKeys(
  tasksByColumn,
  selectedAssigneeKeys,
  knownUserIds,
  columnKeys = KANBAN_COLUMN_KEYS
) {
  const keys =
    selectedAssigneeKeys instanceof Set
      ? selectedAssigneeKeys
      : new Set(selectedAssigneeKeys);

  if (keys.size === 0) return tasksByColumn;

  const known =
    knownUserIds instanceof Set ? knownUserIds : new Set(knownUserIds);
  const includeUnassigned = keys.has(ASSIGNEE_CHIP_KEY_UNASSIGNED);
  const out = {};

  for (const columnKey of columnKeys) {
    out[columnKey] = (tasksByColumn[columnKey] ?? []).filter((task) => {
      const rawUserId =
        typeof task?.userId === "string" ? task.userId.trim() : "";
      const hasKnownAssignee = Boolean(rawUserId) && known.has(rawUserId);

      if (hasKnownAssignee) return keys.has(rawUserId);
      return includeUnassigned;
    });
  }

  return out;
}
