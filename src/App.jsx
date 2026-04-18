import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import Register from "./components/Register.jsx";
import KanbanBoard from "./pages/KanbanBoard.jsx";
import Profile from "./pages/Profile.jsx";
import { getSavedStartPath } from "./components/UserSetting/StartPage.jsx";

function RootRoute() {
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
      <Route path="/kanban" element={<KanbanBoard />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;
