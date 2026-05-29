import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./app.js";

const TASKS_COLLECTION = "Tasks";

/** Số task tối đa mỗi lần query theo cột (phân trang). */
export const TASKS_PAGE_SIZE = 5;

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
