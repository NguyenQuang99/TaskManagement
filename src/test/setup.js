import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({ name: "[DEFAULT]" })),
}));

vi.mock("firebase/auth", () => {
  const authInstance = { currentUser: null };
  return {
    getAuth: vi.fn(() => authInstance),
    onAuthStateChanged: vi.fn((_auth, callback) => {
      queueMicrotask(() => callback(null));
      return vi.fn();
    }),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    signInWithPopup: vi.fn(),
    updatePassword: vi.fn(),
    deleteUser: vi.fn(),
    GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {
      this.addScope = vi.fn();
    }),
    OAuthProvider: vi.fn(function OAuthProvider() {
      this.addScope = vi.fn();
      this.setCustomParameters = vi.fn();
    }),
    EmailAuthProvider: {
      credential: vi.fn(),
    },
    reauthenticateWithCredential: vi.fn(),
  };
});

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(async () => ({ docs: [] })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  serverTimestamp: vi.fn(),
  documentId: vi.fn(),
}));
