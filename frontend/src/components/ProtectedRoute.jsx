import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { dashboardPathForRole } from "../auth/roles";

const FullPageMessage = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-center text-gray-600">
    <div role="status">{children}</div>
  </div>
);

// Renders children only for a server-verified user whose role is allowed.
// UX only: every API call is authorised again by the backend.
export default function ProtectedRoute({ roles, children }) {
  const location = useLocation();
  const { status, user, message, retry } = useAuth();

  if (status === "loading") {
    return <FullPageMessage>Checking your session…</FullPageMessage>;
  }

  if (status === "error") {
    return (
      <FullPageMessage>
        <p className="mb-4">{message}</p>
        <button onClick={retry} className="rounded bg-blue-600 px-4 py-2 text-white">
          Try again
        </button>
      </FullPageMessage>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return children;
}
