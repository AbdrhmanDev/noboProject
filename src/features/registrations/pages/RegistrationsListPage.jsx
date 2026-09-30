import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { PlatformAccessGate } from "../../platform/components/PlatformAccessGate";
import { PLATFORM_REGISTRATIONS_VIEW } from "../../platform/constants/platformPermissions";
import { platformRegistrationDetailsPath } from "../../../utils/routes";
import { useRegistrations } from "../hooks/useRegistrations";
import { RegistrationStatusBadge } from "../components/RegistrationBadges";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

const STATUSES = ["Draft", "Submitted", "UnderReview", "NeedsMoreInformation", "Approved", "Rejected", "Cancelled"];
const KINDS = ["Initial", "Amendment"];
const PAGE_SIZE = 25; // well under REGISTRATION_LIST_MAX_PAGE_SIZE (the real backend limit)

function RegistrationsTable() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(1);

  const filters = { status: status || undefined, kind: kind || undefined, page, pageSize: PAGE_SIZE };
  const registrationsQuery = useRegistrations(filters);
  const rows = registrationsQuery.data || [];
  // The list endpoint returns no total count (verified in ListRegistrationsHandler source) -- "next"
  // is only offered when a full page came back, never a real page-count. This is the honest limit,
  // not a client-side guess.
  const hasNextPage = rows.length === PAGE_SIZE;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
        >
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={kind}
          onChange={(event) => {
            setKind(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
        >
          <option value="">All kinds</option>
          {KINDS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => registrationsQuery.refetch()}
          className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-bold text-slate-100"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {registrationsQuery.isLoading && <LoadingState label="Loading registrations..." />}
      {registrationsQuery.isError && (
        <ErrorState title="Unable to load registrations" message={getErrorMessage(registrationsQuery.error)} />
      )}
      {!registrationsQuery.isLoading && !registrationsQuery.isError && rows.length === 0 && (
        <EmptyState title="No registrations found" message="No registrations match the current filters." />
      )}
      {!registrationsQuery.isLoading && !registrationsQuery.isError && rows.length > 0 && (
        <>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-start text-slate-500">
                <th className="pb-2 font-medium">Reference</th>
                <th className="pb-2 font-medium">Kind</th>
                <th className="pb-2 font-medium">Applicant / legal name</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Submitted</th>
                <th className="pb-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((registration) => (
                <tr
                  key={registration.id}
                  onClick={() => navigate(platformRegistrationDetailsPath(registration.id))}
                  className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                >
                  <td className="py-2.5 font-bold text-white">{registration.reference}</td>
                  <td className="py-2.5 text-slate-300">{registration.kind}</td>
                  <td className="py-2.5 text-slate-300">{registration.legalName || "-"}</td>
                  <td className="py-2.5">
                    <RegistrationStatusBadge status={registration.status} />
                  </td>
                  <td className="py-2.5 text-slate-400">
                    {registration.submittedAtUtc ? formatDateTime(registration.submittedAtUtc) : "-"}
                  </td>
                  <td className="py-2.5 text-slate-400">{formatDateTime(registration.updatedAtUtc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={13} /> Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => setPage((value) => value + 1)}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronLeft size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function RegistrationsListPage() {
  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader title="Registration Requests" />
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
          The Support work queue for customer registrations and profile amendments. Company owners
          manage their own amendments from Company Profile; this screen is for the review persona.
        </div>
        <PlatformAccessGate requiredPermission={PLATFORM_REGISTRATIONS_VIEW}>
          <RegistrationsTable />
        </PlatformAccessGate>
      </main>
    </AppLayout>
  );
}
