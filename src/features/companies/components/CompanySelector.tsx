import { Building2 } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import {
  getCompanyDisplayName,
  isCompanyEnterable,
  useCompany,
} from "../context/CompanyContext";
import { useMyCompanies } from "../hooks/useCompanies";

export function CompanySelector() {
  const { selectCompany } = useCompany();
  const { data: companies, isLoading, isError } = useMyCompanies();

  if (isLoading) return <LoadingState label="Loading companies..." />;
  if (isError) {
    return (
      <ErrorState
        title="Unable to load companies"
        message="Please refresh or sign in again."
      />
    );
  }

  if (!companies?.length) {
    return (
      <EmptyState
        title="No companies found"
        message="Your account is not linked to an available company."
      />
    );
  }

  const hasEnterableCompany = companies.some(isCompanyEnterable);

  return (
    <div className="panel w-full max-w-3xl rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="brand-text text-xl font-black">Select Company</h1>
          <p className="text-xs text-gray-400">
            {hasEnterableCompany
              ? "Choose an active company membership."
              : "No active company membership is currently available."}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {companies.map((company) => {
          const enterable = isCompanyEnterable(company);

          return (
            <button
              key={company.companyId}
              type="button"
              disabled={!enterable}
              onClick={() => selectCompany(company.companyId)}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-start transition hover:border-blue-400/45 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-white">{getCompanyDisplayName(company)}</div>
                  <div className="mt-1 text-xs text-gray-400">
                    {company.businessSectorName}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <span
                    className={`rounded-full px-2 py-1 ${
                      company.companyStatus === "Active"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    Company {company.companyStatus}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 ${
                      company.membershipStatus === "Active"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    Membership {company.membershipStatus}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
