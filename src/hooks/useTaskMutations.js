import { useMutation } from "@tanstack/react-query";
import { createTask, updateTask } from "../services/firebase.js";

export function useCreateTaskMutation() {
  return useMutation({
    mutationFn: (payload) => createTask(payload),
  });
}

export function useUpdateTaskMutation() {
  return useMutation({
    mutationFn: ({ taskId, payload }) => updateTask(taskId, payload),
  });
}

/**
 * Map taskId → vị trí trên board (cột UI + index trong cột).
 * @param {Record<string, unknown[]>} tasksByColumn
 * @param {string[]} columnKeys
 */
function buildTaskPlacementMap(tasksByColumn, columnKeys) {
  const map = new Map();
  for (const columnKey of columnKeys) {
    const list = tasksByColumn[columnKey] ?? [];
    for (let index = 0; index < list.length; index++) {
      const task = list[index];
      if (task?.id == null || task.id === "") continue;
      map.set(String(task.id), { columnKey, orderIndex: index, task });
    }
  }
  return map;
}

/**
 * So sánh snapshot (trước drag) vs nextTasksByColumn (sau drag).
 * Chỉ trả về task có columnId hoặc order (index) đổi — không quét/persist cả 4 cột.
 *
 * - Cross-column: thường chỉ task được kéo (column + order đổi).
 * - Same-column reorder: mọi task trong cột có index đổi so với snapshot.
 *
 * @param {Record<string, unknown[]>} snapshot
 * @param {Record<string, unknown[]>} nextTasksByColumn
 * @param {{
 *   columnKeys: string[];
 *   columnToFirebase: Record<string, string>;
 *   columnStatus: Record<string, string>;
 * }} maps
 * @returns {Array<{ taskId: string; payload: Record<string, unknown> }>}
 */
export function getKanbanDragPersistUpdates(snapshot, nextTasksByColumn, maps) {
  const { columnKeys, columnToFirebase, columnStatus } = maps;
  const beforeMap = buildTaskPlacementMap(snapshot, columnKeys);
  const afterMap = buildTaskPlacementMap(nextTasksByColumn, columnKeys);
  const updates = [];

  for (const [taskId, { columnKey, orderIndex, task }] of afterMap) {
    const prev = beforeMap.get(taskId);
    if (
      prev &&
      prev.columnKey === columnKey &&
      prev.orderIndex === orderIndex
    ) {
      continue;
    }

    updates.push({
      taskId,
      payload: {
        columnId: columnToFirebase[columnKey],
        status: columnStatus[columnKey] ?? columnKey,
        order: String(orderIndex),
        userId: task.userId,
      },
    });
  }

  return updates;
}

/**
 * Gọi updateTask tuần tự theo danh sách delta từ getKanbanDragPersistUpdates.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult<
 *   unknown,
 *   Error,
 *   {
 *     updates: Array<{ taskId: string; payload: Record<string, unknown> }>;
 *   }
 * >}
 */
export function usePersistKanbanMutation() {
  return useMutation({
    mutationFn: async ({ updates }) => {
      if (!updates?.length) return [];
      return Promise.all(
        updates.map(({ taskId, payload }) => updateTask(taskId, payload))
      );
    },
  });
}
