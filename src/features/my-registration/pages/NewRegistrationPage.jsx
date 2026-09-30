import { useState } from "react";
import { toast } from "sonner";
import { CircleCheck, FilePlus2, RotateCcw, Send, X } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { useI18n } from "../../../i18n/I18nContext";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { RegistrationStatusBadge } from "../components/RegistrationStatusBadges";
import { MyRegistrationDocumentsPanel } from "../components/MyRegistrationDocumentsPanel";
import { ProposedBranchesEditor } from "../components/ProposedBranchesEditor";
import { GROUP_LABEL, fieldLabel, groupFields } from "../utils/fieldLabels";
import {
  useCancelRegistration,
  useCreateRegistrationDraft,
  useMyLatestRegistration,
  useReopenRegistration,
  useRespondToInformationRequest,
  useSubmitRegistration,
  useUpdateRegistrationDraft,
} from "../hooks/useMyRegistration";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

// Only Draft/Submitted/UnderReview are cancellable (verified verbatim in
// Nobo.Domain.CustomerRegistration.RegistrationRequest.Cancel's own comment: "NeedsMoreInformation is
// not cancellable in this phase's state machine") -- never invented, never assumed symmetric.
const CANCELLABLE_STATUSES = new Set(["Draft", "Submitted", "UnderReview"]);

// Only Cancelled can be reopened -- the ONE transition RegistrationStateMachine.Allowed adds for
// Cancelled (Nobo.Domain.CustomerRegistration.RegistrationStateMachine: "Cancelled -> Draft, exposed
// ONLY through RegistrationRequest.Reopen"). Every other status (including Draft/UnderReview/Approved/
// Rejected) is refused by the backend with Registration.InvalidTransition -- never assumed reopenable.
const REOPENABLE_STATUSES = new Set(["Cancelled"]);

function StartScreen({ onCreate, isPending, error }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0c1424] p-6 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-blue-500/15 text-blue-300">
        <FilePlus2 size={26} />
      </div>
      <h2 className="text-lg font-black text-white">Start your company registration</h2>
      <p className="mt-2 text-sm text-slate-400">
        You have no registration yet. Starting one creates a draft you can fill in and submit for
        review.
      </p>
      {error && <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}
      <button
        type="button"
        disabled={isPending}
        onClick={onCreate}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Start registration"}
      </button>
    </div>
  );
}

function InformationRequestCard({ registrationId, request }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const respondMutation = useRespondToInformationRequest(registrationId);

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
      <div className="text-xs font-bold text-amber-100">
        {request.requestedFieldKey ? fieldLabel(request.requestedFieldKey) : request.requestedItem || "General"}
      </div>
      <p className="mt-1 text-xs text-amber-100/90">{request.message}</p>
      <div className="mt-1 text-[10px] text-amber-200/70">{formatDateTime(request.createdAtUtc)}</div>
      {request.status === "Open" ? (
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
      ) : (
        request.responseMessage && (
          <div className="mt-2 rounded-lg bg-black/20 p-2 text-[11px] text-slate-300">Your response: {request.responseMessage}</div>
        )
      )}
    </div>
  );
}

function DraftForm({ registration }) {
  const updateMutation = useUpdateRegistrationDraft(registration.id);
  const submitMutation = useSubmitRegistration(registration.id);
  const cancelMutation = useCancelRegistration(registration.id);

  const [values, setValues] = useState(() => Object.fromEntries(registration.fields.map((field) => [field.key, field.value ?? ""])));
  const [branches, setBranches] = useState(() => registration.proposedBranches.map((branch) => ({ ...branch })));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const save = async () => {
    setError("");
    try {
      await updateMutation.mutateAsync({ values, proposedBranches: branches });
      setNotice("Draft saved.");
      window.setTimeout(() => setNotice(""), 3000);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    }
  };

  const submit = async () => {
    setError("");
    try {
      // Submit takes no body (SubmitRegistrationCommand carries only the id) -- it reviews exactly
      // what is ALREADY persisted. Saving the current local edits first (the same real draft-update
      // call the Save button uses) ensures "submit" genuinely reflects what is on screen, instead of
      // silently discarding unsaved changes.
      await updateMutation.mutateAsync({ values, proposedBranches: branches });
      await submitMutation.mutateAsync();
      setConfirmSubmit(false);
      setNotice("Submitted for review.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
      setConfirmSubmit(false);
    }
  };

  const cancel = async () => {
    try {
      await cancelMutation.mutateAsync({});
      setConfirmCancel(false);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
      setConfirmCancel(false);
    }
  };

  const groups = groupFields(registration.fields);

  return (
    <div className="space-y-4">
      {notice && <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">{notice}</div>}
      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}

      <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
        <h2 className="mb-3 text-sm font-black text-white">Applicant / company information</h2>
        <div className="space-y-4">
          {[...groups.entries()].map(([group, fields]) => (
            <div key={group}>
              <div className="mb-1.5 text-xs font-bold text-slate-400">{GROUP_LABEL[group] || group}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {fields.map((field) => (
                  <label key={field.key} className="text-xs font-semibold text-slate-400">
                    {fieldLabel(field.key)}
                    {field.requiredForApproval && <span className="text-amber-300"> *</span>}
                    <input
                      value={values[field.key] ?? ""}
                      onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                      disabled={updateMutation.isPending}
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
        <h2 className="mb-3 text-sm font-black text-white">Proposed branches (optional)</h2>
        <ProposedBranchesEditor branches={branches} onChange={setBranches} disabled={updateMutation.isPending} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
        <h2 className="mb-3 text-sm font-black text-white">Documents</h2>
        <MyRegistrationDocumentsPanel registrationId={registration.id} canEdit />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={updateMutation.isPending}
          onClick={save}
          className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving..." : "Save draft"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmSubmit(true)}
          className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
        >
          <Send size={15} /> Submit for review
        </button>
        <button
          type="button"
          onClick={() => setConfirmCancel(true)}
          className="flex h-11 items-center gap-2 rounded-xl border border-red-400/30 px-4 text-sm font-bold text-red-300 hover:bg-red-500/10"
        >
          <X size={15} /> Cancel registration
        </button>
      </div>

      {confirmSubmit && (
        <div className="rounded-2xl border border-blue-400/25 bg-blue-500/10 p-4">
          <p className="text-xs text-blue-100">
            This sends your current information to review, using exactly what is saved right now.
            You will not be able to edit it directly afterward.
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={submitMutation.isPending} onClick={submit} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {submitMutation.isPending ? "Submitting..." : "Confirm submit"}
            </button>
            <button type="button" onClick={() => setConfirmSubmit(false)} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300">
              Cancel
            </button>
          </div>
        </div>
      )}
      {confirmCancel && (
        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
          <p className="text-xs text-red-100">This ends this registration. This cannot be undone.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={cancelMutation.isPending} onClick={cancel} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {cancelMutation.isPending ? "Cancelling..." : "Confirm cancel"}
            </button>
            <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300">
              Keep it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadOnlyView({ registration }) {
  const { t } = useI18n();
  const cancelMutation = useCancelRegistration(registration.id);
  const reopenMutation = useReopenRegistration(registration.id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [error, setError] = useState("");
  const groups = groupFields(registration.fields);
  const canCancel = CANCELLABLE_STATUSES.has(registration.status);
  const canReopen = REOPENABLE_STATUSES.has(registration.status);

  const cancel = async () => {
    try {
      await cancelMutation.mutateAsync({});
      setConfirmCancel(false);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
      setConfirmCancel(false);
    }
  };

  // The confirm dialog's own onClick already disables while reopenMutation.isPending, but a mutation
  // in flight is the authoritative guard against a duplicate submission (a second click while pending
  // is a no-op here regardless of how it was triggered).
  const reopen = async () => {
    if (reopenMutation.isPending) return;
    setError("");
    try {
      await reopenMutation.mutateAsync();
      setConfirmReopen(false);
      toast.success(t("myRegistration.reopen.success"));
    } catch (reopenError) {
      setConfirmReopen(false);
      // Registration.ReopenConflict (a lost optimistic-concurrency race) gets its own message; every
      // other backend error (e.g. Registration.InvalidTransition if the status changed underneath us)
      // falls back to the real backend message -- never an invented code or generic text.
      setError(reopenError?.code === "Registration.ReopenConflict" ? t("myRegistration.reopen.error.conflict") : getErrorMessage(reopenError));
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4 text-center">
        {registration.status === "Approved" ? (
          <CircleCheck size={32} className="mx-auto mb-2 text-emerald-400" />
        ) : null}
        <p className="text-sm text-slate-300">
          {registration.status === "Submitted" && "Your registration was submitted and is waiting to be picked up for review."}
          {registration.status === "UnderReview" && "Your registration is currently under review."}
          {registration.status === "NeedsMoreInformation" && "Additional information is needed before review can continue -- see below."}
          {registration.status === "Approved" && "Your registration was approved."}
          {registration.status === "Rejected" && "Your registration was rejected."}
          {registration.status === "Cancelled" && "This registration was cancelled."}
        </p>
        {registration.decisionReason && <p className="mt-2 text-xs text-slate-400">Reviewer note: {registration.decisionReason}</p>}
      </div>

      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}

      {registration.informationRequests.some((request) => request.status === "Open") && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400">Information requested</h2>
          {registration.informationRequests
            .filter((request) => request.status === "Open")
            .map((request) => (
              <InformationRequestCard key={request.id} registrationId={registration.id} request={request} />
            ))}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
        <h2 className="mb-3 text-sm font-black text-white">Submitted information (read-only)</h2>
        <div className="space-y-4">
          {[...groups.entries()].map(([group, fields]) => (
            <div key={group}>
              <div className="mb-1.5 text-xs font-bold text-slate-400">{GROUP_LABEL[group] || group}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key} className="rounded-lg bg-white/[0.025] px-3 py-2">
                    <div className="text-[10px] text-slate-500">{fieldLabel(field.key)}</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-100">{field.value || "-"}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
        <h2 className="mb-3 text-sm font-black text-white">Documents</h2>
        <MyRegistrationDocumentsPanel registrationId={registration.id} canEdit={registration.status !== "Approved" && registration.status !== "Rejected" && registration.status !== "Cancelled"} />
      </div>

      {canReopen && (
        <div>
          <button
            type="button"
            disabled={reopenMutation.isPending}
            onClick={() => setConfirmReopen(true)}
            className="flex h-11 items-center gap-2 rounded-xl border border-emerald-400/30 px-4 text-sm font-bold text-emerald-300 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={15} /> {t("myRegistration.reopen.button")}
          </button>
          {confirmReopen && (
            <div className="mt-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
              <p className="text-xs font-bold text-emerald-100">{t("myRegistration.reopen.confirmTitle")}</p>
              <p className="mt-1 text-xs text-emerald-100/90">{t("myRegistration.reopen.confirmBody")}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={reopenMutation.isPending}
                  onClick={reopen}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reopenMutation.isPending ? t("myRegistration.reopen.pending") : t("myRegistration.reopen.confirmAction")}
                </button>
                <button
                  type="button"
                  disabled={reopenMutation.isPending}
                  onClick={() => setConfirmReopen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("myRegistration.reopen.cancelAction")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {canCancel && (
        <div>
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="flex h-11 items-center gap-2 rounded-xl border border-red-400/30 px-4 text-sm font-bold text-red-300 hover:bg-red-500/10"
          >
            <X size={15} /> Cancel registration
          </button>
          {confirmCancel && (
            <div className="mt-2 rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
              <p className="text-xs text-red-100">This ends this registration. This cannot be undone.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={cancelMutation.isPending} onClick={cancel} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                  {cancelMutation.isPending ? "Cancelling..." : "Confirm cancel"}
                </button>
                <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300">
                  Keep it
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NewRegistrationPage() {
  const latestQuery = useMyLatestRegistration();
  const createMutation = useCreateRegistrationDraft();
  const [createError, setCreateError] = useState("");

  const create = async () => {
    setCreateError("");
    try {
      await createMutation.mutateAsync({});
    } catch (error) {
      setCreateError(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <main className="mx-auto max-w-3xl space-y-4" dir="rtl">
        <PageHeader title="My Registration" />

        {latestQuery.isLoading ? (
          <LoadingState label="Loading your registration..." />
        ) : latestQuery.isError ? (
          latestQuery.error?.code === "Registration.NotFound" ? (
            <StartScreen onCreate={create} isPending={createMutation.isPending} error={createError} />
          ) : (
            <ErrorState title="Unable to load your registration" message={getErrorMessage(latestQuery.error)} />
          )
        ) : !latestQuery.data ? (
          <EmptyState title="No registration" message="Something unexpected happened." />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-300">
              <span className="font-bold text-white">{latestQuery.data.reference}</span>
              <RegistrationStatusBadge status={latestQuery.data.status} />
              <span className="text-slate-500">Created {formatDateTime(latestQuery.data.createdAtUtc)}</span>
            </div>
            {latestQuery.data.status === "Draft" ? (
              <DraftForm registration={latestQuery.data} />
            ) : (
              <ReadOnlyView registration={latestQuery.data} />
            )}
          </>
        )}
      </main>
    </AppLayout>
  );
}
