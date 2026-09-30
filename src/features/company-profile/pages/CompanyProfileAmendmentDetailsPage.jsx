import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, MessageSquareWarning, Save, Send, X } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useCompany } from "../../companies/context/CompanyContext";
import { useCompanyPermissions } from "../../companies/hooks/useCompanies";
import { ROUTES } from "../../../utils/routes";
import { RegistrationStatusBadge } from "../components/RegistrationStatusBadge";
import { fieldLabel } from "../utils/fieldLabels";
import {
  useAmendmentDetail,
  useCancelAmendment,
  useRespondToInformationRequest,
  useSubmitAmendment,
  useUpdateAmendmentDraft,
} from "../hooks/useAmendments";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

const GROUP_LABEL = {
  LegalIdentity: "Legal identity",
  RegisteredAddress: "Registered address",
  Financial: "Financial",
  Representative: "Representative",
  Contacts: "Contacts",
};

function groupFields(fields) {
  const groups = new Map();
  for (const field of fields) {
    if (!groups.has(field.group)) groups.set(field.group, []);
    groups.get(field.group).push(field);
  }
  return groups;
}

function InformationRequestCard({ registration, request, companyId }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const respondMutation = useRespondToInformationRequest(companyId, registration.id);

  const respond = async () => {
    if (!message.trim()) {
      setError("A message is required.");
      return;
    }
    setError("");
    try {
      await respondMutation.mutateAsync({ informationRequestId: request.id, payload: { message: message.trim() } });
      setMessage("");
    } catch (respondError) {
      setError(getErrorMessage(respondError));
    }
  };

  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
      <div className="flex items-start gap-2">
        <MessageSquareWarning size={16} className="mt-0.5 shrink-0 text-amber-300" />
        <div className="min-w-0">
          <div className="text-xs font-bold text-amber-100">
            {request.requestedFieldKey ? fieldLabel(request.requestedFieldKey) : request.requestedItem || "General"}
          </div>
          <p className="mt-1 text-xs text-amber-100/90">{request.message}</p>
          <div className="mt-1 text-[10px] text-amber-200/70">
            {request.status} · {formatDateTime(request.createdAtUtc)}
          </div>
        </div>
      </div>
      {request.status === "Open" && (
        <div className="mt-2 space-y-1.5">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            placeholder="Your response..."
            disabled={respondMutation.isPending}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-white outline-none disabled:opacity-50"
          />
          {error && <div className="text-[11px] text-red-300">{error}</div>}
          <button
            type="button"
            disabled={respondMutation.isPending}
            onClick={respond}
            className="rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {respondMutation.isPending ? "Sending..." : "Send response"}
          </button>
        </div>
      )}
      {request.status !== "Open" && request.responseMessage && (
        <div className="mt-2 rounded-lg bg-black/20 p-2 text-[11px] text-slate-300">
          Your response: {request.responseMessage}
        </div>
      )}
    </div>
  );
}

export function CompanyProfileAmendmentDetailsPage() {
  const navigate = useNavigate();
  const { registrationId } = useParams();
  const { currentCompanyId } = useCompany();
  const permissionsQuery = useCompanyPermissions(currentCompanyId);
  const isOwner = Boolean(permissionsQuery.data?.isOwner);

  const detailQuery = useAmendmentDetail(currentCompanyId, registrationId, isOwner);
  const updateMutation = useUpdateAmendmentDraft(currentCompanyId, registrationId);
  const submitMutation = useSubmitAmendment(currentCompanyId, registrationId);
  const cancelMutation = useCancelAmendment(currentCompanyId, registrationId);

  const [values, setValues] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const registration = detailQuery.data?.registration;
  const amendment = detailQuery.data?.amendment;

  if (values === null && registration) {
    // Seed the editable values once, straight from the loaded registration -- render-time state
    // adjustment, not an effect (this repo's own react-hooks/set-state-in-effect convention).
    setValues(Object.fromEntries(registration.fields.map((field) => [field.key, field.value ?? ""])));
  }

  if (!currentCompanyId) return <AppLayout><EmptyState title="Company required" message="Select a company." /></AppLayout>;
  if (!isOwner) {
    return (
      <AppLayout>
        <ErrorState title="Owner access required" message="Only the company owner can view or edit amendments." />
      </AppLayout>
    );
  }
  if (detailQuery.isLoading || !registration || values === null) {
    return (
      <AppLayout>
        <LoadingState label="Loading amendment..." />
      </AppLayout>
    );
  }
  if (detailQuery.isError) {
    return (
      <AppLayout>
        <ErrorState title="Unable to load amendment" message={getErrorMessage(detailQuery.error)} />
      </AppLayout>
    );
  }

  const isDraft = registration.status === "Draft";
  const isPending = updateMutation.isPending || submitMutation.isPending || cancelMutation.isPending;

  const save = async () => {
    setError("");
    try {
      await updateMutation.mutateAsync({ values });
      setNotice("Draft saved.");
      window.setTimeout(() => setNotice(""), 3000);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    }
  };

  const submit = async () => {
    setError("");
    try {
      await submitMutation.mutateAsync();
      setNotice("Amendment submitted for review.");
      window.setTimeout(() => setNotice(""), 3000);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  };

  const cancel = async () => {
    setError("");
    try {
      await cancelMutation.mutateAsync();
      setNotice("Amendment cancelled.");
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    }
  };

  const groups = groupFields(registration.fields);
  const canCancel = !["Approved", "Rejected", "Cancelled"].includes(registration.status);

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title={amendment.reference}
          actions={
            <button
              type="button"
              onClick={() => navigate(ROUTES.COMPANY_PROFILE_AMENDMENTS)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
            >
              <ArrowRight size={14} /> Back
            </button>
          }
        />

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-300">
          <RegistrationStatusBadge status={registration.status} />
          <span className="text-slate-500">Based on approved v{amendment.baseProfileVersionNumber}</span>
          <span className="text-slate-500">Created {formatDateTime(registration.createdAtUtc)}</span>
          {registration.submittedAtUtc && <span className="text-slate-500">Submitted {formatDateTime(registration.submittedAtUtc)}</span>}
          {registration.decidedAtUtc && <span className="text-slate-500">Decided {formatDateTime(registration.decidedAtUtc)}</span>}
        </div>
        {registration.decisionReason && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
            Reviewer note: {registration.decisionReason}
          </div>
        )}

        {notice && <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">{notice}</div>}
        {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}

        {registration.informationRequests.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-400">Information requests</h2>
            {registration.informationRequests.map((request) => (
              <InformationRequestCard key={request.id} registration={registration} request={request} companyId={currentCompanyId} />
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
          {!isDraft && (
            <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.02] p-2 text-[11px] text-slate-500">
              Read-only: fields can only be edited while the amendment is Draft (currently {registration.status}).
            </div>
          )}
          <div className="space-y-4">
            {[...groups.entries()].map(([group, fields]) => (
              <div key={group}>
                <div className="mb-2 text-xs font-bold text-slate-400">{GROUP_LABEL[group] || group}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {fields.map((field) => (
                    <label key={field.key} className="text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        {fieldLabel(field.key)}
                        {field.requiredForApproval && " *"}
                      </span>
                      <input
                        value={values[field.key] ?? ""}
                        onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                        disabled={!isDraft}
                        className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
                      />
                      <span className="mt-0.5 block text-[10px] font-normal text-slate-500">{field.status}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {isDraft && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={save}
                  className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={14} /> {updateMutation.isPending ? "Saving..." : "Save draft"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={submit}
                  className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={14} /> {submitMutation.isPending ? "Submitting..." : "Submit for review"}
                </button>
              </>
            )}
            {canCancel && (
              <button
                type="button"
                disabled={isPending}
                onClick={cancel}
                className="flex h-10 items-center gap-2 rounded-xl border border-red-400/30 px-4 text-xs font-bold text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={14} /> {cancelMutation.isPending ? "Cancelling..." : "Cancel amendment"}
              </button>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
