import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../../utils/routes";
import { BranchGate } from "../../branches/components/BranchGate";
import { CompanyGate } from "../../companies/components/CompanyGate";
import { useAuth } from "../hooks/useAuth";
import { AuthBootState } from "./AuthBootState";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "checking") return <AuthBootState />;

  if (status === "anonymous") {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return (
    <CompanyGate>
      <BranchGate>{children}</BranchGate>
    </CompanyGate>
  );
}
