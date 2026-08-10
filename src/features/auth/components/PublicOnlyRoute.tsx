import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "../../../utils/routes";
import { useAuth } from "../hooks/useAuth";
import { AuthBootState } from "./AuthBootState";

type PublicOnlyRouteProps = {
  children: ReactNode;
};

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { status } = useAuth();

  if (status === "checking") return <AuthBootState />;

  if (status === "authenticated") {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
}
