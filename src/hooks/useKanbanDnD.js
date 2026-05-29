import { useCallback, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  getKanbanDragPersistUpdates,
  usePersistKanbanMutation,
} from "./useTaskMutations.js";

export const COLUMN_KEYS = ["todo", "inProgress", "review", "done"];

const COLUMN_STATUS = {
  todo: "todo",
  inProgress: "in-progress",
  review: "review",
  done: "done",
};

/** Gộp task các cột (dùng cho đếm assignee / thống kê từ state board). */
export function flattenTasksByColumn(tasksByColumn) {
  if (!tasksByColumn) return [];
  return COLUMN_KEYS.flatMap((key) => tasksByColumn[key] ?? []);
}

export const COLUMN_TO_FIREBASE = {
  todo: "column_01",
  inProgress: "column_02",
  review: "column_03",
  done: "column_04",
};

const KANBAN_PERSIST_MAPS = {
  columnKeys: COLUMN_KEYS,
  columnToFirebase: COLUMN_TO_FIREBASE,
  columnStatus: COLUMN_STATUS,
};

export function getTaskDndId(task, columnKey, index) {
  return String(task.id ?? task.__dndId ?? `${columnKey}-${index}`);
}

/** Prefix droppable ids so they never collide with Firestore task ids (e.g. id "done"). */
const KB_COL_PREFIX = "kb-col-";
const KB_EMPTY_PREFIX = "kb-empty-";

export function columnDroppableId(columnKey) {
  return `${KB_COL_PREFIX}${columnKey}`;
}

export function emptyZoneDroppableId(columnKey) {
  return `${KB_EMPTY_PREFIX}${columnKey}`;
}

function isColumnOrEmptyDropTarget(overId) {
  const s = String(overId);
  return (
    s.startsWith(KB_COL_PREFIX) ||
    s.startsWith(KB_EMPTY_PREFIX) ||
    COLUMN_KEYS.includes(s) ||
    (s.startsWith("empty-") && COLUMN_KEYS.includes(s.replace(/^empty-/, "")))
  );
}

/**
 * Prefer the rightmost column when the same draggable id appears twice (stale state),
 * so the visible card in "Done" wins over a ghost copy in an earlier column.
 */
function findContainerByTaskIdInState(taskId, source) {
  for (const columnKey of [...COLUMN_KEYS].reverse()) {
    const found = source[columnKey].some(
      (task, index) => getTaskDndId(task, columnKey, index) === String(taskId)
    );
    if (found) return columnKey;
  }
  return null;
}

/**
 * Remove every copy of this draggable / Firestore task from all columns, then caller inserts `moved` once.
 * Prevents duplicate React keys when the target column already held the same `task.id`.
 */
function stripMatchingTasksFromAllColumns(prev, activeIdValue, firestoreTaskId) {
  const activeStr = String(activeIdValue);
  const fid =
    firestoreTaskId != null && String(firestoreTaskId) !== ""
      ? String(firestoreTaskId)
      : null;

  const next = {};
  for (const key of COLUMN_KEYS) {
    next[key] = prev[key].filter((t, i) => {
      const tid = getTaskDndId(t, key, i);
      if (tid === activeStr) return false;
      if (fid !== null && t?.id != null && String(t.id) === fid) return false;
      return true;
    });
  }
  return next;
}

/**
 * (1) Mỗi cột: chỉ giữ một task cho mỗi `id` Firestore (tránh 2× `task_06` trong Done).
 * (2) Giữa các cột: cùng `id` chỉ tồn tại ở cột phải nhất trên board.
 */
export function sanitizeKanbanTaskColumnsState(state) {
  const deduped = {};
  for (const key of COLUMN_KEYS) {
    const seen = new Set();
    deduped[key] = state[key].filter((t) => {
      const id = t?.id;
      if (id == null || id === "") return true;
      const sid = String(id);
      if (seen.has(sid)) return false;
      seen.add(sid);
      return true;
    });
  }
  const owner = new Map();
  for (const columnKey of [...COLUMN_KEYS].reverse()) {
    for (const t of deduped[columnKey]) {
      const id = t?.id;
      if (id == null || id === "") continue;
      const sid = String(id);
      if (!owner.has(sid)) owner.set(sid, columnKey);
    }
  }
  const next = {};
  for (const columnKey of COLUMN_KEYS) {
    next[columnKey] = deduped[columnKey].filter((t) => {
      const id = t?.id;
      if (id == null || id === "") return true;
      return owner.get(String(id)) === columnKey;
    });
  }
  return next;
}

function resolveColumnFromOverId(overId, findContainerByTaskId) {
  const s = String(overId);
  if (s.startsWith(KB_COL_PREFIX)) {
    const key = s.slice(KB_COL_PREFIX.length);
    return COLUMN_KEYS.includes(key) ? key : null;
  }
  if (s.startsWith(KB_EMPTY_PREFIX)) {
    const key = s.slice(KB_EMPTY_PREFIX.length);
    return COLUMN_KEYS.includes(key) ? key : null;
  }
  if (COLUMN_KEYS.includes(s)) return s;
  if (s.startsWith("empty-")) {
    const key = s.replace(/^empty-/, "");
    return COLUMN_KEYS.includes(key) ? key : null;
  }
  return findContainerByTaskId(overId);
}

function cloneKanbanColumnsState(state) {
  const sanitized = sanitizeKanbanTaskColumnsState(state);
  if (typeof structuredClone === "function") {
    return structuredClone(sanitized);
  }
  return JSON.parse(JSON.stringify(sanitized));
}

/**
 * @param {Record<string, unknown[]>} prev
 * @param {string} activeIdValue
 * @param {string} overId
 * @param {{ allowSameColumn?: boolean }} [options]
 * @returns {Record<string, unknown[]> | null}
 */
function applyDragMove(prev, activeIdValue, overId, { allowSameColumn = true } = {}) {
  const resolveContainer = (tid) => findContainerByTaskIdInState(tid, prev);
  const sourceColumn = resolveContainer(activeIdValue);
  const targetColumn = resolveColumnFromOverId(overId, resolveContainer);

  if (!sourceColumn || !targetColumn) return null;

  if (sourceColumn !== targetColumn) {
    const sourceItems = prev[sourceColumn];
    const sourceIndex = sourceItems.findIndex(
      (task, index) => getTaskDndId(task, sourceColumn, index) === activeIdValue
    );
    if (sourceIndex < 0) return null;

    const moved = sourceItems[sourceIndex];
    const firestoreId = moved?.id;
    const next = stripMatchingTasksFromAllColumns(prev, activeIdValue, firestoreId);
    const targetItems = [...next[targetColumn]];
    const overIndex = isColumnOrEmptyDropTarget(overId)
      ? targetItems.length
      : targetItems.findIndex(
          (task, index) => getTaskDndId(task, targetColumn, index) === overId
        );
    const insertIndex = overIndex < 0 ? targetItems.length : overIndex;
    targetItems.splice(insertIndex, 0, moved);
    next[targetColumn] = targetItems;
    return sanitizeKanbanTaskColumnsState(next);
  }

  if (
    allowSameColumn &&
    activeIdValue !== overId &&
    !isColumnOrEmptyDropTarget(overId)
  ) {
    const items = [...prev[sourceColumn]];
    const oldIndex = items.findIndex(
      (task, index) => getTaskDndId(task, sourceColumn, index) === activeIdValue
    );
    const newIndex = items.findIndex(
      (task, index) => getTaskDndId(task, sourceColumn, index) === overId
    );
    if (oldIndex < 0 || newIndex < 0) return null;
    return sanitizeKanbanTaskColumnsState({
      ...prev,
      [sourceColumn]: arrayMove(items, oldIndex, newIndex),
    });
  }

  return null;
}

/**
 * @param {{
 *   todo: unknown[];
 *   inProgress: unknown[];
 *   review: unknown[];
 *   done: unknown[];
 * }} tasksByColumn
 * @param {React.Dispatch<React.SetStateAction<typeof tasksByColumn>>} setTasksByColumn
 * @param {() => Promise<void>} refreshBoardTasks
 * @param {undefined | (() => Promise<void> | void)} onPersistSuccess
 */
export function useKanbanDnD(
  tasksByColumn,
  setTasksByColumn,
  refreshBoardTasks,
  onPersistSuccess
) {
  const [activeId, setActiveId] = useState(null);
  const tasksByColumnRef = useRef(tasksByColumn);
  const dragSnapshotRef = useRef(null);
  const persistMutation = usePersistKanbanMutation();

  tasksByColumnRef.current = tasksByColumn;

  const findTaskById = useCallback(
    (taskId) => {
      const col = findContainerByTaskIdInState(taskId, tasksByColumn);
      if (!col) return null;
      const list = tasksByColumn[col];
      return list.find((task, index) => getTaskDndId(task, col, index) === String(taskId)) ?? null;
    },
    [tasksByColumn]
  );

  const clearDragSession = useCallback(() => {
    setActiveId(null);
    dragSnapshotRef.current = null;
  }, []);

  const restoreDragSnapshot = useCallback(() => {
    const snapshot = dragSnapshotRef.current;
    if (snapshot) {
      setTasksByColumn(snapshot);
    }
  }, [setTasksByColumn]);

  const handleDragStart = useCallback(({ active }) => {
    dragSnapshotRef.current = cloneKanbanColumnsState(tasksByColumnRef.current);
    setActiveId(active?.id ?? null);
  }, []);

  /**
   * Không mutate tasksByColumn khi dragOver — đổi SortableContext items lúc đang kéo
   * gây vòng measureRect (Maximum update depth) của @dnd-kit.
   * Preview: DragOverlay; thả cột: applyDragMove trong handleDragEnd.
   */
  const handleDragOver = useCallback(() => {}, []);

  const handleDragCancel = useCallback(() => {
    restoreDragSnapshot();
    setActiveId(null);
    dragSnapshotRef.current = null;
  }, [restoreDragSnapshot]);

  const handleDragEnd = useCallback(
    async ({ active, over }) => {
      if (!over) {
        restoreDragSnapshot();
        setActiveId(null);
        dragSnapshotRef.current = null;
        return;
      }

      const activeIdValue = String(active.id);
      const overId = String(over.id);
      const snapshot = dragSnapshotRef.current;

      let nextTasksByColumn = null;

      setTasksByColumn((prev) => {
        const base = dragSnapshotRef.current ?? prev;
        const moved = applyDragMove(base, activeIdValue, overId, { allowSameColumn: true });
        const next = moved ?? base;
        nextTasksByColumn = sanitizeKanbanTaskColumnsState(next);
        return nextTasksByColumn;
      });

      if (!snapshot || !nextTasksByColumn) {
        clearDragSession();
        return;
      }

      const updates = getKanbanDragPersistUpdates(
        snapshot,
        nextTasksByColumn,
        KANBAN_PERSIST_MAPS
      );

      if (updates.length === 0) {
        clearDragSession();
        return;
      }

      try {
        await persistMutation.mutateAsync({ updates });
        dragSnapshotRef.current = cloneKanbanColumnsState(nextTasksByColumn);
        await onPersistSuccess?.();
      } catch (err) {
        console.error("Failed to persist drag updates:", err);
        restoreDragSnapshot();
        await refreshBoardTasks();
      } finally {
        clearDragSession();
      }
    },
    [
      setTasksByColumn,
      refreshBoardTasks,
      onPersistSuccess,
      persistMutation,
      restoreDragSnapshot,
      clearDragSession,
    ]
  );

  return {
    activeId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    findTaskById,
  };
}
