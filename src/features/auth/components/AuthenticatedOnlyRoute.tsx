import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../../utils/routes";
import { useAuth } from "../hooks/useAuth";
import { AuthBootState } from "./AuthBootState";

type AuthenticatedOnlyRouteProps = {
  children: ReactNode;
};

// Deliberately NOT the same as ProtectedRoute: ProtectedRoute also wraps every route in CompanyGate
// (-> BranchGate), which requires the user to already have a CompanyMembership -- but the applicant
// side of Customer Registration (P8.3) exists PRECISELY for a user who has none yet ("there is no
// company yet", per Nobo.Application.CustomerRegistration.ApplicantHandlers' own comment). Routing
// it through CompanyGate would make it unreachable for exactly the person it is for. This wrapper
// keeps the same authentication check ProtectedRoute uses, just without the company gate.
export function AuthenticatedOnlyRoute({ children }: AuthenticatedOnlyRouteProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "checking") return <AuthBootState />;

  if (status === "anonymous") {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
