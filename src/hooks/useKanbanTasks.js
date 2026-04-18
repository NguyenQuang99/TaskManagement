import { useCallback, useLayoutEffect, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTasksByColumn, getTasksByColumnPage } from "../services/firebase.js";
import {
  COLUMN_KEYS,
  COLUMN_TO_FIREBASE,
  sanitizeKanbanTaskColumnsState,
} from "./useKanbanDnD.js";

export const kanbanInitialLoadQueryKeyRoot = ["kanbanTasks", "initialLoad"];
const kanbanRefreshQueryKeyRoot = ["kanbanTasks", "refreshAll"];

function initialColumnPagination() {
  return COLUMN_KEYS.reduce((acc, key) => {
    acc[key] = { cursor: null, hasMore: true };
    return acc;
  }, {});
}

function initialLoadingMoreByColumn() {
  return COLUMN_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});
}

function normalizeTasks(tasks) {
  return tasks.map((task, index) => ({
    ...task,
    __dndId: task.id ?? `${task.title ?? "task"}-${index}-${Math.random().toString(36).slice(2, 8)}`,
  }));
}

async function fetchPagedFirstLoadByColumn() {
  return Promise.all(
    COLUMN_KEYS.map((key) => getTasksByColumnPage(COLUMN_TO_FIREBASE[key], null))
  );
}

async function fetchAllColumnsFull() {
  const [todo, inProgress, review, done] = await Promise.all([
    getTasksByColumn(COLUMN_TO_FIREBASE.todo),
    getTasksByColumn(COLUMN_TO_FIREBASE.inProgress),
    getTasksByColumn(COLUMN_TO_FIREBASE.review),
    getTasksByColumn(COLUMN_TO_FIREBASE.done),
  ]);
  return { todo, inProgress, review, done };
}

/**
 * Paged first load per column, load-more, and full refresh for the Kanban board.
 */
export function useKanbanTasks() {
  const queryClient = useQueryClient();
  const [tasksByColumn, setTasksByColumn] = useState({
    todo: [],
    inProgress: [],
    review: [],
    done: [],
  });
  const [columnPagination, setColumnPagination] = useState(() => initialColumnPagination());
  const columnPaginationRef = useRef(initialColumnPagination());
  const loadingMoreRef = useRef(initialLoadingMoreByColumn());
  const [loadingMoreByColumn, setLoadingMoreByColumn] = useState(() => initialLoadingMoreByColumn());

  const applyPagedLoad = useCallback((results) => {
    const nextTasks = {};
    const nextPag = {};
    COLUMN_KEYS.forEach((key, i) => {
      const r = results[i];
      nextTasks[key] = normalizeTasks(r.tasks);
      nextPag[key] = { cursor: r.lastDoc, hasMore: r.hasMore };
    });
    columnPaginationRef.current = nextPag;
    setColumnPagination(nextPag);
    setTasksByColumn(sanitizeKanbanTaskColumnsState(nextTasks));
  }, []);

  const applyFullLoad = useCallback((fullTasks) => {
    const fullPagination = COLUMN_KEYS.reduce((acc, key) => {
      acc[key] = { cursor: null, hasMore: false };
      return acc;
    }, {});
    columnPaginationRef.current = fullPagination;
    setColumnPagination(fullPagination);
    setTasksByColumn(
      sanitizeKanbanTaskColumnsState({
        todo: normalizeTasks(fullTasks.todo),
        inProgress: normalizeTasks(fullTasks.inProgress),
        review: normalizeTasks(fullTasks.review),
        done: normalizeTasks(fullTasks.done),
      })
    );
  }, []);

  const {
    data: initialLoadData,
    isError: initialLoadFailed,
    isPending: kanbanInitialPending,
  } = useQuery({
    queryKey: kanbanInitialLoadQueryKeyRoot,
    queryFn: async () => {
      try {
        const paged = await fetchPagedFirstLoadByColumn();
        return { mode: "paged", payload: paged };
      } catch (error) {
        console.error("Paged task load failed, falling back to full fetch:", error);
        const full = await fetchAllColumnsFull();
        return { mode: "full", payload: full };
      }
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  useLayoutEffect(() => {
    if (!initialLoadData) return;
    if (initialLoadData.mode === "paged") {
      applyPagedLoad(initialLoadData.payload);
    } else {
      applyFullLoad(initialLoadData.payload);
    }
  }, [initialLoadData, applyPagedLoad, applyFullLoad]);

  useEffect(() => {
    if (!initialLoadFailed) return;
    const emptyPag = COLUMN_KEYS.reduce((acc, key) => {
      acc[key] = { cursor: null, hasMore: false };
      return acc;
    }, {});
    columnPaginationRef.current = emptyPag;
    setColumnPagination(emptyPag);
    setTasksByColumn({
      todo: [],
      inProgress: [],
      review: [],
      done: [],
    });
  }, [initialLoadFailed]);

  const refreshBoardTasks = useCallback(async () => {
    try {
      const fullTasks = await queryClient.fetchQuery({
        queryKey: kanbanRefreshQueryKeyRoot,
        queryFn: fetchAllColumnsFull,
        staleTime: 0,
      });
      applyFullLoad(fullTasks);
    } catch (err) {
      console.error("Failed to reload tasks:", err);
    }
  }, [queryClient, applyFullLoad]);

  const loadMoreColumn = useCallback(async (columnKey) => {
    if (loadingMoreRef.current[columnKey]) return;
    const pag = columnPaginationRef.current[columnKey];
    if (!pag?.hasMore) return;

    loadingMoreRef.current[columnKey] = true;
    setLoadingMoreByColumn((p) => ({ ...p, [columnKey]: true }));

    try {
      const { tasks, lastDoc, hasMore } = await getTasksByColumnPage(
        COLUMN_TO_FIREBASE[columnKey],
        pag.cursor
      );
      setTasksByColumn((prev) =>
        sanitizeKanbanTaskColumnsState({
          ...prev,
          [columnKey]: [...prev[columnKey], ...normalizeTasks(tasks)],
        })
      );
      setColumnPagination((prev) => {
        const next = {
          ...prev,
          [columnKey]: { cursor: lastDoc, hasMore },
        };
        columnPaginationRef.current = next;
        return next;
      });
    } catch (err) {
      console.error("Failed to load more tasks:", columnKey, err);
    } finally {
      loadingMoreRef.current[columnKey] = false;
      setLoadingMoreByColumn((p) => ({ ...p, [columnKey]: false }));
    }
  }, []);

  return {
    tasksByColumn,
    setTasksByColumn,
    columnPagination,
    loadingMoreByColumn,
    loadMoreColumn,
    refreshBoardTasks,
    kanbanInitialPending,
    kanbanInitialLoadFailed: initialLoadFailed,
  };
}
