/** @type {Record<string, string>} */
const FIREBASE_ERROR_MESSAGES = {
  // Auth
  "auth/invalid-email": "Invalid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found for this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/invalid-login-credentials": "Invalid email or password.",
  "auth/email-already-in-use": "This email is already registered.",
  "auth/weak-password": "Password is too weak (min. 6 characters).",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/operation-not-allowed": "This sign-in method is not enabled.",
  "auth/popup-closed-by-user": "Sign-in popup was closed.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/internal-error": "Authentication error. Try again.",
  "auth/requires-recent-login": "Please sign in again to continue.",

  // Firestore / client
  "permission-denied": "You do not have permission to do this.",
  "unauthenticated": "Please sign in to continue.",
  "not-found": "The requested data was not found.",
  "unavailable": "Service unavailable. Try again shortly.",
  "failed-precondition": "Database is not ready yet. Try again in a moment.",
  "resource-exhausted": "Too many requests. Try again later.",
  "cancelled": "Request was cancelled.",
  "deadline-exceeded": "Request timed out. Try again.",
  "already-exists": "This item already exists.",
  "aborted": "Operation was aborted. Try again.",
};

export const DEFAULT_FIREBASE_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

/**
 * @param {unknown} err
 * @returns {string | null}
 */
export function getFirebaseErrorCode(err) {
  if (err == null || typeof err !== "object") return null;
  const code = /** @type {{ code?: unknown }} */ (err).code;
  return typeof code === "string" && code.trim() !== "" ? code.trim() : null;
}

/**
 * Map `FirebaseError.code` (or Firestore client codes) to a short English message.
 *
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function mapFirebaseError(err, fallback = DEFAULT_FIREBASE_ERROR_MESSAGE) {
  const code = getFirebaseErrorCode(err);
  if (code && FIREBASE_ERROR_MESSAGES[code]) {
    return FIREBASE_ERROR_MESSAGES[code];
  }
  return fallback;
}
