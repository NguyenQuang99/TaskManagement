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
 * Persist all Kanban column lists after DnD.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult<
 *   unknown,
 *   Error,
 *   {
 *     columnKeys: string[];
 *     tasksByColumn: Record<string, Array<Record<string, unknown>>>;
 *     persistColumnOrders: (columnKey: string, tasks: Array<Record<string, unknown>>) => Promise<void>;
 *   }
 * >}
 */
export function usePersistKanbanMutation() {
  return useMutation({
    mutationFn: async ({ columnKeys, tasksByColumn, persistColumnOrders }) =>
      Promise.all(columnKeys.map((key) => persistColumnOrders(key, tasksByColumn[key]))),
  });
}
