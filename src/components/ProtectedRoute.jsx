import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
      Đang tải…
    </div>
  );
}

/**
 * Chỉ render children khi đã đăng nhập; nếu không thì redirect về trang login.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, ready } = useAuth();

  if (!ready) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
