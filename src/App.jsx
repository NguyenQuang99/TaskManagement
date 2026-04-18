import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import Register from "./components/Register.jsx";
import KanbanBoard from "./pages/KanbanBoard.jsx";
import Profile from "./pages/Profile.jsx";
import ProtectedRoute, { AuthLoading } from "./components/ProtectedRoute.jsx";
import { getSavedStartPath } from "./components/UserSetting/StartPage.jsx";
import { useFirebaseAuth } from "./hooks/useFirebaseAuth.js";

function RootRoute() {
  const { user, ready } = useFirebaseAuth();

  if (!ready) {
    return <AuthLoading />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const path = getSavedStartPath();
  if (path === "/") {
    return <LoginPage />;
  }
  return <Navigate to={path} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/kanban"
        element={
          <ProtectedRoute>
            <KanbanBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
