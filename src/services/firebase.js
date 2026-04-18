import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updatePassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Thiếu biến môi trường Firebase. Tạo file .env từ .env.example và điền VITE_FIREBASE_*."
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/** Firestore collection; document id = Firebase Auth `uid`. */
const USERS_COLLECTION = "Users";

const TASKS_COLLECTION = "Tasks";

/** Số task tối đa mỗi lần query theo cột (phân trang). */
export const TASKS_PAGE_SIZE = 5;

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.addScope("email");
microsoftProvider.addScope("openid");
microsoftProvider.addScope("profile");
microsoftProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Đăng nhập bằng email + password (Firebase Auth).
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Đăng ký tài khoản bằng email + password (Firebase Auth).
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Đăng nhập bằng Google (popup).
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

/**
 * Đăng nhập bằng Microsoft (popup).
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function loginWithMicrosoft() {
  return signInWithPopup(auth, microsoftProvider);
}

/**
 * Đăng xuất user hiện tại (Firebase Auth).
 * @returns {Promise<void>}
 */
export async function logout() {
  return signOut(auth);
}

/**
 * Đổi mật khẩu cho user đang đăng nhập (Firebase Auth).
 * Chỉ áp dụng khi tài khoản có provider password. Nếu gặp lỗi “requires-recent-login”, dùng `reauthenticateAndUpdatePassword`.
 * @param {string} newPassword — tối thiểu 6 ký tự (mặc định Firebase)
 * @returns {Promise<void>}
 */
export async function updateCurrentUserPassword(newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error("updateCurrentUserPassword: no signed-in user");
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    throw new Error("updateCurrentUserPassword: newPassword must be at least 6 characters");
  }
  return updatePassword(user, newPassword);
}

/**
 * Xác thực lại bằng email + mật khẩu hiện tại, rồi đổi mật khẩu mới (tài khoản đăng nhập email/password).
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export async function reauthenticateAndUpdatePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error("reauthenticateAndUpdatePassword: no signed-in user or missing email");
  }
  if (typeof currentPassword !== "string" || !currentPassword) {
    throw new Error("reauthenticateAndUpdatePassword: currentPassword is required");
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return updateCurrentUserPassword(newPassword);
}

/**
 * Xoá profile `Users/{uid}` (best effort) rồi xoá user Firebase Auth hiện tại.
 * Thường cần phiên đăng nhập “gần đây”; nếu lỗi `auth/requires-recent-login`, dùng `reauthenticateAndDeleteCurrentUser`.
 * @returns {Promise<void>}
 */
export async function deleteCurrentUserAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error("deleteCurrentUserAccount: no signed-in user");
  const uid = user.uid;
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
  } catch (e) {
    console.warn("deleteCurrentUserAccount: Firestore profile delete failed", e);
  }
  return deleteUser(user);
}

/**
 * Xác thực lại bằng email + mật khẩu hiện tại, rồi xoá tài khoản (Firestore `Users` + Auth).
 * @param {string} currentPassword
 * @returns {Promise<void>}
 */
export async function reauthenticateAndDeleteCurrentUser(currentPassword) {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error("reauthenticateAndDeleteCurrentUser: no signed-in user or missing email");
  }
  if (typeof currentPassword !== "string" || !currentPassword) {
    throw new Error("reauthenticateAndDeleteCurrentUser: currentPassword is required");
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return deleteCurrentUserAccount();
}

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

export async function getTasksByColumn(columnId) {
  const q = query(collection(db, TASKS_COLLECTION), where("columnId", "==", columnId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Lấy task theo cột có giới hạn (mặc định 5) + phân trang bằng cursor.
 * Dùng `orderBy(documentId())` để mọi document đều có thứ tự ổn định (không bị loại khỏi kết quả
 * khi thiếu field `order` như với `orderBy("order")`).
 * Cần composite index Firestore: `columnId` (==) + `__name__` (document id).
 *
 * @param {string} columnId — vd `column_01`
 * @param {import("firebase/firestore").QueryDocumentSnapshot | null | undefined} cursor — document cuối của batch trước; `null` = trang đầu
 * @returns {Promise<{
 *   tasks: Array<Record<string, unknown> & { id: string }>;
 *   lastDoc: import("firebase/firestore").QueryDocumentSnapshot | null;
 *   hasMore: boolean;
 * }>}
 */
export async function getTasksByColumnPage(columnId, cursor = null) {
  if (!columnId) throw new Error("getTasksByColumnPage: columnId is required");

  const constraints = [
    where("columnId", "==", columnId),
    orderBy(documentId()),
    limit(TASKS_PAGE_SIZE),
  ];
  if (cursor) {
    constraints.splice(2, 0, startAfter(cursor));
  }

  const q = query(collection(db, TASKS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  const tasks = docs.map((d) => ({ id: d.id, ...d.data() }));
  const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
  const hasMore = docs.length === TASKS_PAGE_SIZE;

  return { tasks, lastDoc, hasMore };
}

/**
 * Tạo task mới trong `Tasks` (id document do Firestore tự sinh).
 * @param {{
 *   columnId: string;
 *   title: string;
 *   userId: string;
 *   description?: string;
 *   order?: string;
 *   status?: string;
 * }} data
 * @returns {Promise<string>} id document vừa tạo
 */
export async function createTask(data) {
  const {
    columnId = "column_01",
    title,
    userId,
    description = "",
    order = "0",
    status = "todo",
  } = data || {};
  if (!columnId) throw new Error("createTask: columnId is required");
  if (!title) throw new Error("createTask: title is required");
  if (!userId) throw new Error("createTask: userId is required");
  const ts = serverTimestamp();
  const ref = await addDoc(collection(db, "Tasks"), {
    columnId,
    title,
    userId,
    description,
    order,
    status,
    createdAt: ts,
    updatedAt: ts,
  });
  return ref.id;
}

/**
 * Cập nhật task trong collection `Tasks`.
 * @param {string} taskId — id document (vd: task_03)
 * @param {Partial<{
 *   columnId: string;
 *   description: string;
 *   order: string;
 *   status: string;
 *   title: string;
 *   userId: string;
 * }>} data — chỉ gửi field cần đổi; `updatedAt` luôn được set server-side
 * @returns {Promise<void>}
 */
export async function updateTask(taskId, data) {
  if (!taskId) throw new Error("updateTask: taskId is required");
  const ref = doc(db, "Tasks", taskId);
  const clean = Object.fromEntries(
    Object.entries(data || {}).filter(([, v]) => v !== undefined)
  );
  await updateDoc(ref, { ...clean, updatedAt: serverTimestamp() });
}

/**
 * Xóa task `Tasks/{taskId}`.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
export async function deleteTask(taskId) {
  if (!taskId) throw new Error("deleteTask: taskId is required");
  await deleteDoc(doc(db, "Tasks", taskId));
}
