import { useQuery } from "@tanstack/react-query";
import { getCurrentUserProfile } from "../services/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { currentUserProfileKey } from "../queryKeys.js";
import { mapFirebaseError } from "../utils/mapFirebaseError.js";

/**
 * Profile Firestore của user đang đăng nhập — cache TanStack Query.
 *
 * @returns {{
 *   user: null | (Record<string, unknown> & { id: string });
 *   loading: boolean;
 *   error: null | Error;
 *   errorMessage: null | string;
 *   refetch: () => Promise<unknown>;
 * }}
 */
export function useCurrentUserProfile() {
  const { uid: authUid, ready: authReady } = useAuth();

  const { data, isLoading, isFetching, error, refetch, isError } = useQuery({
    queryKey: currentUserProfileKey(authUid),
    queryFn: () => getCurrentUserProfile(),
    enabled: authReady && !!authUid,
    staleTime: 60 * 1000,
  });

  const normalizedError = isError
    ? error instanceof Error
      ? error
      : new Error(String(error))
    : null;

  return {
    user: data ?? null,
    loading: !authReady || (authReady && !!authUid && isLoading),
    error: normalizedError,
    errorMessage: normalizedError ? mapFirebaseError(normalizedError) : null,
    isRefetching: isFetching && !!authUid && !isLoading,
    refetch,
  };
}
