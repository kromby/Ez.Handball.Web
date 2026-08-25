import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loading } from "../components/StateViews";
import { useAuth } from "./useAuth";

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <Loading />;
  if (status === "anonymous") return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <Loading />;
  if (status === "anonymous") return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
