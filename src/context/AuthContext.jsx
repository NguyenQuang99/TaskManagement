import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => auth.currentUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      uid: user?.uid ?? "",
      isAuthenticated: Boolean(user),
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Firebase auth session — một listener `onAuthStateChanged` cho cả app.
 * @returns {{
 *   user: import("firebase/auth").User | null;
 *   ready: boolean;
 *   uid: string;
 *   isAuthenticated: boolean;
 * }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
