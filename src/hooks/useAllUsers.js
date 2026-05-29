import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../services/firebase.js";
import { allUsers } from "../queryKeys.js";

/**
 * Tải toàn bộ user từ Firestore (`getAllUsers`).
 *
 * @returns {{
 *   users: Array<Record<string, unknown> & { id: string }>;
 *   loading: boolean;
 *   error: null | Error;
 *   usersLoadFailed: boolean;
 *   refetch: () => Promise<unknown>;
 * }}
 */
export function useAllUsers() {
  const { data, isLoading, error, refetch, isError } = useQuery({
    queryKey: allUsers,
    queryFn: async () => {
      const list = await getAllUsers();
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const normalizedError = isError
    ? error instanceof Error
      ? error
      : new Error(String(error))
    : null;

  return {
    users: Array.isArray(data) ? data : [],
    loading: isLoading,
    error: normalizedError,
    usersLoadFailed: Boolean(normalizedError),
    refetch,
  };
}
