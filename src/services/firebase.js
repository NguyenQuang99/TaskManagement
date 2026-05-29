/** Barrel re-export — giữ import `../services/firebase.js` không đổi. */
export { app, auth, db } from "./firebase/app.js";

export {
  login,
  register,
  loginWithGoogle,
  loginWithMicrosoft,
  logout,
  updateCurrentUserPassword,
  reauthenticateAndUpdatePassword,
  deleteCurrentUserAccount,
  reauthenticateAndDeleteCurrentUser,
} from "./firebase/authService.js";

export {
  getUserProfile,
  getCurrentUserProfile,
  getAllUsers,
  updateUserProfile,
  updateCurrentUserProfile,
} from "./firebase/userService.js";

export {
  TASKS_PAGE_SIZE,
  getTasksByColumn,
  getTasksByColumnPage,
  createTask,
  updateTask,
  deleteTask,
} from "./firebase/taskService.js";
