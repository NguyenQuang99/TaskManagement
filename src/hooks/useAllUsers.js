import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../services/firebase.js";

/**
 * Tải toàn bộ user từ Firestore (`getAllUsers`).
 *
 * @returns {{
 *   users: Array<Record<string, unknown> & { id: string }>;
 *   loading: boolean;
 *   error: null | Error;
 *   refetch: () => Promise<unknown>;
 * }}
 */
export const allUsersQueryKeyRoot = ["allUsers"];

export function useAllUsers() {
  const { data, isLoading, error, refetch, isError } = useQuery({
    queryKey: allUsersQueryKeyRoot,
    queryFn: async () => {
      const list = await getAllUsers();
      return Array.isArray(list) ? list : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    users: data ?? [],
    loading: isLoading,
    error: isError ? (error instanceof Error ? error : new Error(String(error))) : null,
    refetch,
  };
}
