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
    <div className="rounded-xl border border-warning bg-warning-soft p-3">
      <div className="flex items-start gap-2">
        <MessageSquareWarning size={16} className="mt-0.5 shrink-0 text-warning" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-warning">
            {request.requestedFieldKey ? fieldLabel(request.requestedFieldKey) : request.requestedItem || "General"}
          </div>
          <p className="mt-1 text-sm text-warning/90">{request.message}</p>
          <div className="mt-1 text-xs text-warning">
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
            className="w-full rounded-lg border border-line bg-canvas px-2 py-1.5 text-sm text-ink outline-none disabled:opacity-50"
          />
          {error && <div className="text-xs text-danger">{error}</div>}
          <button
            type="button"
            disabled={respondMutation.isPending}
            onClick={respond}
            className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {respondMutation.isPending ? "Sending..." : "Send response"}
          </button>
        </div>
      )}
      {request.status !== "Open" && request.responseMessage && (
        <div className="mt-2 rounded-lg bg-canvas p-2 text-xs text-muted">
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
      <main className="odoo-root space-y-3" dir="rtl">
        <PageHeader
          title={amendment.reference}
          actions={
            <button
              type="button"
              onClick={() => navigate(ROUTES.COMPANY_PROFILE_AMENDMENTS)}
              className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
            >
              <ArrowRight size={14} /> Back
            </button>
          }
        />

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
          <RegistrationStatusBadge status={registration.status} />
          <span className="text-subtle">Based on approved v{amendment.baseProfileVersionNumber}</span>
          <span className="text-subtle">Created {formatDateTime(registration.createdAtUtc)}</span>
          {registration.submittedAtUtc && <span className="text-subtle">Submitted {formatDateTime(registration.submittedAtUtc)}</span>}
          {registration.decidedAtUtc && <span className="text-subtle">Decided {formatDateTime(registration.decidedAtUtc)}</span>}
        </div>
        {registration.decisionReason && (
          <div className="rounded-xl border border-danger bg-danger-soft p-3 text-sm text-danger">
            Reviewer note: {registration.decisionReason}
          </div>
        )}

        {notice && <div className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">{notice}</div>}
        {error && <div className="rounded-xl border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}

        {registration.informationRequests.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-muted">Information requests</h2>
            {registration.informationRequests.map((request) => (
              <InformationRequestCard key={request.id} registration={registration} request={request} companyId={currentCompanyId} />
            ))}
          </div>
        )}

        <div className="rounded-xl border border-line bg-surface p-4">
          {!isDraft && (
            <div className="mb-3 rounded-xl border border-line bg-raised p-2 text-xs text-subtle">
              Read-only: fields can only be edited while the amendment is Draft (currently {registration.status}).
            </div>
          )}
          <div className="space-y-4">
            {[...groups.entries()].map(([group, fields]) => (
              <div key={group}>
                <div className="mb-2 text-sm font-bold text-muted">{GROUP_LABEL[group] || group}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {fields.map((field) => (
                    <label key={field.key} className="text-sm font-semibold text-muted">
                      <span className="flex items-center gap-1.5">
                        {fieldLabel(field.key)}
                        {field.requiredForApproval && " *"}
                      </span>
                      <input
                        value={values[field.key] ?? ""}
                        onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                        disabled={!isDraft}
                        className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
                      />
                      <span className="mt-0.5 block text-xs font-normal text-subtle">{field.status}</span>
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
                  className="flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-4 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={14} /> {updateMutation.isPending ? "Saving..." : "Save draft"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={submit}
                  className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex h-10 items-center gap-2 rounded-xl border border-danger px-4 text-sm font-bold text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
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
