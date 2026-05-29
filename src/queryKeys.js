/** TanStack Query key roots và helpers (prefix match khi invalidate/remove). */

export const currentUserProfile = ["currentUserProfile"];

export const allUsers = ["allUsers"];

export const kanbanInitialLoad = ["kanbanTasks", "initialLoad"];

export const kanbanRefresh = ["kanbanTasks", "refreshAll"];

/**
 * @param {string | undefined} authUid
 * @returns {readonly [string, string]}
 */
export function currentUserProfileKey(authUid) {
  return [...currentUserProfile, authUid || "anonymous"];
}

/**
 * @param {string | undefined} authUid
 * @returns {readonly [string, string, string]}
 */
export function kanbanInitialLoadKey(authUid) {
  return [...kanbanInitialLoad, authUid || "anonymous"];
}
