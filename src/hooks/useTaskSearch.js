import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function normalizeForSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * @param {Record<string, unknown>} task
 * @param {string} normalizedQuery from {@link normalizeForSearch}; empty = match all
 */
export function taskMatchesSearchQuery(task, normalizedQuery) {
  if (!normalizedQuery) return true;
  const title = normalizeForSearch(task?.title ?? task?.name ?? "");
  const description = normalizeForSearch(task?.description ?? task?.desc ?? "");
  return title.includes(normalizedQuery) || description.includes(normalizedQuery);
}

/**
 * Filter a column map (e.g. Kanban) with the same rules as the board search.
 * @param {Record<string, unknown[]>} tasksByColumn
 * @param {string} normalizedQuery
 */
export function filterTasksByColumnForQuery(tasksByColumn, normalizedQuery) {
  if (!normalizedQuery) return tasksByColumn;
  return Object.fromEntries(
    Object.entries(tasksByColumn).map(([key, list]) => [
      key,
      Array.isArray(list)
        ? list.filter((task) => taskMatchesSearchQuery(task, normalizedQuery))
        : list,
    ])
  );
}

/**
 * Reads `q` from the URL and exposes search helpers + optional pre-filtered columns.
 *
 * @param {Record<string, unknown[]> | undefined} tasksByColumn — if passed, `filteredTasksByColumn` is memoized
 * @returns {{
 *   queryRaw: string,
 *   queryNormalized: string,
 *   normalizeForSearch: typeof normalizeForSearch,
 *   filteredTasksByColumn: Record<string, unknown[]> | undefined,
 *   filterTasksByColumn: (columns: Record<string, unknown[]>) => Record<string, unknown[]>,
 *   taskMatchesQuery: (task: Record<string, unknown>) => boolean,
 * }}
 */
export function useTaskSearch(tasksByColumn) {
  const [searchParams] = useSearchParams();
  const queryRaw = searchParams.get("q") ?? "";
  const queryNormalized = useMemo(() => normalizeForSearch(queryRaw), [queryRaw]);

  const filterTasksByColumn = useCallback(
    (columns) => filterTasksByColumnForQuery(columns, queryNormalized),
    [queryNormalized]
  );

  const filteredTasksByColumn = useMemo(() => {
    if (tasksByColumn === undefined) return undefined;
    return filterTasksByColumnForQuery(tasksByColumn, queryNormalized);
  }, [tasksByColumn, queryNormalized]);

  const taskMatchesQuery = useCallback(
    (task) => taskMatchesSearchQuery(task, queryNormalized),
    [queryNormalized]
  );

  return {
    queryRaw,
    queryNormalized,
    normalizeForSearch,
    filteredTasksByColumn,
    filterTasksByColumn,
    taskMatchesQuery,
  };
}
