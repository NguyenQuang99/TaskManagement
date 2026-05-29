import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "./app.js";
import { USERS_COLLECTION } from "./userService.js";

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
