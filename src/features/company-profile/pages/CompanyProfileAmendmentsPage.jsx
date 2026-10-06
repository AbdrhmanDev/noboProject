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
      <main className="odoo-root space-y-3" dir="rtl">
        <PageHeader
          title="Profile Amendments"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.COMPANY_PROFILE)}
                className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
              >
                <ArrowRight size={14} /> Back to profile
              </button>
              <button
                type="button"
                onClick={() => amendmentsQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          }
        />

        <div className="rounded-xl border border-line bg-raised px-3 py-2 text-xs text-subtle">
          An amendment proposes changes to the company's APPROVED profile. It starts from the current
          approved version (its baseline); Support reviews and approves it before anything changes.
          Only the company owner can start or edit one.
        </div>

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company." />
        ) : !isOwner ? (
          <ErrorState title="Owner access required" message="Only the company owner can view or start amendments." />
        ) : (
          <div className="rounded-xl border border-line bg-surface p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-ink">Amendments</h2>
              <button
                type="button"
                disabled={hasOpenAmendment || createMutation.isPending}
                onClick={create}
                title={hasOpenAmendment ? "There is already an open amendment" : ""}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FilePlus2 size={14} /> {createMutation.isPending ? "Creating..." : "New amendment"}
              </button>
            </div>

            {error && <div className="mb-2 rounded-xl border border-danger bg-danger-soft p-2 text-sm text-danger">{error}</div>}

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
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-raised p-3 text-start hover:border-accent-line hover:bg-accent-soft"
                  >
                    <div>
                      <div className="text-sm font-bold text-ink">{amendment.reference}</div>
                      <div className="text-xs text-subtle">
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
