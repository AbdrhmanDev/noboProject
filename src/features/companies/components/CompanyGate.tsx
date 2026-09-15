import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ErrorState, LoadingState } from "../../../shared/components/ui";
import {
  buildInviteAcceptPath,
  getPendingInvitationToken,
} from "../../users-access/utils/pendingInvitation";
import { useCompany } from "../context/CompanyContext";
import { useCompanyPermissions, useMyCompanies } from "../hooks/useCompanies";
import { hasAnyUsableAccess } from "../hooks/useLandingRoute";
import { CompanyOnboarding } from "./CompanyOnboarding";
import { CompanySelector } from "./CompanySelector";
import { NoAccessState } from "./NoAccessState";

type CompanyGateProps = {
  children: ReactNode;
};

function CompanyGateShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-space grid min-h-screen place-items-center p-4 text-white">
      <div className="bg-stars absolute inset-0 pointer-events-none" />
      <div className="relative z-10 w-full max-w-3xl">{children}</div>
    </div>
  );
}

export function CompanyGate({ children }: CompanyGateProps) {
  const { currentCompanyId, isCompanyContextReady } = useCompany();
  const {
    data: companies,
    isLoading: companiesLoading,
    isError: companiesError,
  } = useMyCompanies();
  const permissionsQuery = useCompanyPermissions(currentCompanyId);

  if (companiesLoading || !isCompanyContextReady) {
    return (
      <CompanyGateShell>
        <LoadingState label="Preparing company context..." />
      </CompanyGateShell>
    );
  }

  if (companiesError) {
    return (
      <CompanyGateShell>
        <ErrorState
          title="Company context unavailable"
          message="Unable to load your companies."
        />
      </CompanyGateShell>
    );
  }

  if (!companies?.length) {
    // An invited user awaiting invitation acceptance must never be sent to "Create your Company"
    // (Section 1.6) -- a brand-new account with zero CompanyMemberships and a still-pending
    // invitation token belongs back on the invitation page, not in onboarding.
    const pendingInvitationToken = getPendingInvitationToken();
    if (pendingInvitationToken) {
      return <Navigate to={buildInviteAcceptPath(pendingInvitationToken)} replace />;
    }

    return (
      <CompanyGateShell>
        <CompanyOnboarding />
      </CompanyGateShell>
    );
  }

  if (!currentCompanyId) {
    return (
      <CompanyGateShell>
        <CompanySelector />
      </CompanyGateShell>
    );
  }

  if (permissionsQuery.isLoading) {
    return (
      <CompanyGateShell>
        <LoadingState label="Loading company profile..." />
      </CompanyGateShell>
    );
  }

  if (permissionsQuery.isError) {
    return (
      <CompanyGateShell>
        <ErrorState
          title="Permissions unavailable"
          message="Unable to load your effective company permissions."
        />
      </CompanyGateShell>
    );
  }

  // Section 7: an active CompanyMembership with zero usable permissions (not Owner, no roles
  // granting anything) is a real, distinct tenant state -- never onboarding, never a silent
  // half-rendered page. Applies globally (every route under this gate), not just Dashboard,
  // since nothing permission-gated would ever resolve for this user anyway.
  if (!hasAnyUsableAccess(permissionsQuery.data)) {
    return <NoAccessState />;
  }

  return children;
}
