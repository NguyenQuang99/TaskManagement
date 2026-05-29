import { currentUserProfileQueryKeyRoot } from "../hooks/useCurrentUserProfile.js";
import { allUsersQueryKeyRoot } from "../hooks/useAllUsers.js";
import { auth } from "../services/firebase.js";
import {
  kanbanInitialLoadQueryKeyRoot,
  kanbanRefreshQueryKeyRoot,
  getKanbanInitialLoadQueryOptions,
} from "../hooks/useKanbanTasks.js";

const AUTH_SESSION_QUERY_ROOTS = [
  currentUserProfileQueryKeyRoot,
  allUsersQueryKeyRoot,
  kanbanInitialLoadQueryKeyRoot,
  kanbanRefreshQueryKeyRoot,
];

/**
 * Xóa cache user-scoped sau logout (tránh user mới thấy data user cũ).
 * ProtectedRoute chỉ dựa Firebase Auth — không phụ thuộc query cache.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 */
export function clearAuthSessionQueries(queryClient) {
  for (const queryKey of AUTH_SESSION_QUERY_ROOTS) {
    queryClient.removeQueries({ queryKey });
  }
}

/**
 * Sau sign-in: làm mới profile + prefetch kanban trước khi vào board.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 */
export async function prepareQueriesAfterLogin(queryClient) {
  await queryClient.invalidateQueries({ queryKey: currentUserProfileQueryKeyRoot });
  const uid = auth.currentUser?.uid;
  if (uid) {
    await queryClient.prefetchQuery(getKanbanInitialLoadQueryOptions(uid));
  }
}
