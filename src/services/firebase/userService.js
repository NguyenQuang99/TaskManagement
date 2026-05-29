import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./app.js";

/** Firestore collection; document id = Firebase Auth `uid`. */
export const USERS_COLLECTION = "Users";

/**
 * Lấy profile trong Firestore theo `uid` (trùng id document trong `Users`).
 * @param {string} uid
 * @returns {Promise<null | Record<string, unknown> & { id: string }>}
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Lấy thông tin user đang đăng nhập từ Firestore (`Users/{currentUser.uid}`).
 * Trả về `null` nếu chưa đăng nhập hoặc chưa có document.
 * @returns {Promise<null | Record<string, unknown> & { id: string }>}
 */
export async function getCurrentUserProfile() {
  const u = auth.currentUser;
  if (!u?.uid) return null;
  return getUserProfile(u.uid);
}

/**
 * Lấy toàn bộ user trong collection `Users` (Email, FullName, UserName, avatar, updatedAt, …).
 * @returns {Promise<Array<Record<string, unknown> & { id: string }>>}
 */
export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Cập nhật document `Users/{uid}` — các field khớp Firestore: Email, FullName, UserName, avatar, updatedAt.
 * @param {string} uid — id document (thường là Firebase Auth uid)
 * @param {Partial<{
 *   Email: string;
 *   FullName: string;
 *   UserName: string;
 *   avatar: string;
 * }>} data — chỉ gửi field cần đổi; `updatedAt` luôn được set server-side
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, data) {
  if (!uid) throw new Error("updateUserProfile: uid is required");
  const ref = doc(db, USERS_COLLECTION, uid);
  const clean = Object.fromEntries(
    Object.entries(data || {}).filter(([, v]) => v !== undefined)
  );
  await updateDoc(ref, { ...clean, updatedAt: serverTimestamp() });
}

/**
 * Cập nhật profile của user đang đăng nhập (`Users/{currentUser.uid}`).
 * @param {Partial<{
 *   Email: string;
 *   FullName: string;
 *   UserName: string;
 *   avatar: string;
 * }>} data
 * @returns {Promise<void>}
 */
export async function updateCurrentUserProfile(data) {
  const u = auth.currentUser;
  if (!u?.uid) throw new Error("updateCurrentUserProfile: no signed-in user");
  return updateUserProfile(u.uid, data);
}
