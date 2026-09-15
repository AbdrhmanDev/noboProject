import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "../../../utils/routes";
import { LoadingState } from "../../../shared/components/ui";
import { useCompany } from "../context/CompanyContext";
import { useLandingRoute } from "../hooks/useLandingRoute";

type LandingRouteResolverProps = {
  children: ReactNode;
};

// Mounted at ROUTES.DASHBOARD only (Section 3): this is the one centralized place a user's
// permission/entitlement set is turned into a default landing route, rather than duplicating that
// decision in Login.jsx, CompanyGate, or the sidebar. Login (after a plain sign-in, invitation
// acceptance's "Enter NOBO" button, and CompanySelector's implicit fallthrough) all just navigate
// to ROUTES.DASHBOARD; this component then redirects a narrow single-module user (e.g. a
// POS-only Cashier) straight to their one relevant surface, or renders Dashboard itself for
// Owners/broad-access members. A user who directly types a specific module URL is untouched by
// this -- it only ever fires for the Dashboard route itself.
export function LandingRouteResolver({ children }: LandingRouteResolverProps) {
  const { currentCompanyId } = useCompany();
  const { route, isLoading } = useLandingRoute(currentCompanyId);

  if (isLoading) {
    return (
      <div className="bg-space grid min-h-screen place-items-center p-4 text-white">
        <LoadingState label="Loading your workspace..." />
      </div>
    );
  }

  // isError is deliberately not special-cased: resolveLandingRoute already returns
  // ROUTES.DASHBOARD when its queries have no data, which is exactly the right fallback here too.
  return route === ROUTES.DASHBOARD ? children : <Navigate to={route} replace />;
}
