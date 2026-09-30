import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FilePlus2, RefreshCw } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useCompany } from "../../companies/context/CompanyContext";
import { useCompanyPermissions } from "../../companies/hooks/useCompanies";
import { ROUTES, companyProfileAmendmentDetailsPath } from "../../../utils/routes";
import { useAmendments, useCreateAmendment } from "../hooks/useAmendments";
import { RegistrationStatusBadge } from "../components/RegistrationStatusBadge";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

const OPEN_STATUSES = ["Draft", "Submitted", "UnderReview", "NeedsMoreInformation"];

export function CompanyProfileAmendmentsPage() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const permissionsQuery = useCompanyPermissions(currentCompanyId);
  const isOwner = Boolean(permissionsQuery.data?.isOwner);

  const amendmentsQuery = useAmendments(currentCompanyId, isOwner);
  const createMutation = useCreateAmendment(currentCompanyId);
  const [error, setError] = useState("");

  const hasOpenAmendment = (amendmentsQuery.data || []).some((amendment) => OPEN_STATUSES.includes(amendment.status));

  const create = async () => {
    setError("");
    try {
      const created = await createMutation.mutateAsync();
      navigate(companyProfileAmendmentDetailsPath(created.id));
    } catch (createError) {
      setError(getErrorMessage(createError));
    }
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title="Profile Amendments"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.COMPANY_PROFILE)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <ArrowRight size={14} /> Back to profile
              </button>
              <button
                type="button"
                onClick={() => amendmentsQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          }
        />

        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
          An amendment proposes changes to the company's APPROVED profile. It starts from the current
          approved version (its baseline); Support reviews and approves it before anything changes.
          Only the company owner can start or edit one.
        </div>

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company." />
        ) : !isOwner ? (
          <ErrorState title="Owner access required" message="Only the company owner can view or start amendments." />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-white">Amendments</h2>
              <button
                type="button"
                disabled={hasOpenAmendment || createMutation.isPending}
                onClick={create}
                title={hasOpenAmendment ? "There is already an open amendment" : ""}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FilePlus2 size={14} /> {createMutation.isPending ? "Creating..." : "New amendment"}
              </button>
            </div>

            {error && <div className="mb-2 rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}

            {amendmentsQuery.isLoading && <LoadingState label="Loading amendments..." />}
            {amendmentsQuery.isError && (
              <ErrorState title="Unable to load amendments" message={getErrorMessage(amendmentsQuery.error)} />
            )}
            {!amendmentsQuery.isLoading && !amendmentsQuery.isError && (amendmentsQuery.data || []).length === 0 && (
              <EmptyState title="No amendments yet" message="Start one to propose a change to the approved profile." />
            )}
            {!amendmentsQuery.isLoading && !amendmentsQuery.isError && (amendmentsQuery.data || []).length > 0 && (
              <div className="space-y-2">
                {amendmentsQuery.data.map((amendment) => (
                  <button
                    type="button"
                    key={amendment.id}
                    onClick={() => navigate(companyProfileAmendmentDetailsPath(amendment.id))}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0d1728] p-3 text-start hover:border-blue-400/40 hover:bg-blue-500/10"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{amendment.reference}</div>
                      <div className="text-[11px] text-slate-500">
                        Based on approved v{amendment.baseProfileVersionNumber} · created {formatDateTime(amendment.createdAtUtc)}
                      </div>
                    </div>
                    <RegistrationStatusBadge status={amendment.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
