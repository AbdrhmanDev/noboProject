import type { ReactNode } from "react";
import { ErrorState, LoadingState } from "../../../shared/components/ui";
import { useCompany } from "../context/CompanyContext";
import { useCompanyPermissions, useMyCompanies } from "../hooks/useCompanies";
import { CompanyOnboarding } from "./CompanyOnboarding";
import { CompanySelector } from "./CompanySelector";

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

  return children;
}
