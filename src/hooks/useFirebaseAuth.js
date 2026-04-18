import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase.js";

/**
 * Trạng thái đăng nhập Firebase (một lần resolve `onAuthStateChanged`).
 * @returns {{ user: import("firebase/auth").User | null; ready: boolean }}
 */
export function useFirebaseAuth() {
  const [user, setUser] = useState(() => auth.currentUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  return { user, ready };
}
