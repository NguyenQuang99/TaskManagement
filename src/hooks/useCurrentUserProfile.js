import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useQuery } from "@tanstack/react-query";
import { auth, getCurrentUserProfile } from "../services/firebase.js";

/**
 * Dùng với `invalidateQueries` sau mutation (cập nhật profile, v.v.).
 */
export const currentUserProfileQueryKeyRoot = ["currentUserProfile"];

/**
 * Profile Firestore của user đang đăng nhập — cache TanStack Query.
 *
 * @returns {{
 *   user: null | (Record<string, unknown> & { id: string });
 *   loading: boolean;
 *   error: null | Error;
 *   refetch: () => Promise<unknown>;
 * }}
 */
export function useCurrentUserProfile() {
  const [authUid, setAuthUid] = useState(() => auth.currentUser?.uid ?? "");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUid(u?.uid ?? "");
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const { data, isLoading, error, refetch, isError } = useQuery({
    queryKey: [...currentUserProfileQueryKeyRoot, authUid || "anonymous"],
    queryFn: () => getCurrentUserProfile(),
    enabled: authReady && !!authUid,
    staleTime: 60 * 1000,
  });

  return {
    user: data ?? null,
    loading: !authReady || (authReady && !!authUid && isLoading),
    error: isError ? (error instanceof Error ? error : new Error(String(error))) : null,
    refetch,
  };
}
