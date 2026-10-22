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
import { PROPOSED_BRANCH_FIELDS, isFilled } from "../utils/proposedBranchFields";
import "../registration.css";
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
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-6 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        <FilePlus2 size={26} />
      </div>
      <h2 className="text-lg font-black text-ink">Start your company registration</h2>
      <p className="mt-2 text-sm text-muted">
        You have no registration yet. Starting one creates a draft you can fill in and submit for
        review.
      </p>
      {error && <div className="mt-3 rounded-xl border border-danger bg-danger-soft p-2 text-xs text-danger">{error}</div>}
      <button
        type="button"
        disabled={isPending}
        onClick={onCreate}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="rounded-xl border border-warning bg-warning-soft p-3">
      <div className="text-xs font-bold text-warning">
        {request.requestedFieldKey ? fieldLabel(request.requestedFieldKey) : request.requestedItem || "General"}
      </div>
      <p className="mt-1 text-xs text-warning">{request.message}</p>
      <div className="mt-1 text-[10px] text-warning">{formatDateTime(request.createdAtUtc)}</div>
      {request.status === "Open" ? (
        <div className="mt-2 space-y-1.5">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            placeholder="Your response..."
            disabled={respondMutation.isPending}
            className="w-full rounded-lg border border-line bg-canvas px-2 py-1.5 text-xs text-ink outline-none disabled:opacity-50"
          />
          {error && <div className="text-[11px] text-danger">{error}</div>}
          <button
            type="button"
            disabled={respondMutation.isPending}
            onClick={respond}
            className="rounded-lg bg-accent px-2 py-1 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {respondMutation.isPending ? "Sending..." : "Send response"}
          </button>
        </div>
      ) : (
        request.responseMessage && (
          <div className="mt-2 rounded-lg bg-canvas p-2 text-[11px] text-muted">Your response: {request.responseMessage}</div>
        )
      )}
    </div>
  );
}

// The registration form is split into steps instead of one long scrolling page. Field groups are
// paired into screens that fit without scrolling (3 columns on wide screens); any group the backend
// sends that isn't listed here lands in an extra "Other" step, so no field is ever dropped.
const FIELD_STEPS = [
  { id: "identity", label: "Identity", groups: ["LegalIdentity", "Contacts"] },
  { id: "address", label: "Address", groups: ["RegisteredAddress"] },
  { id: "financial", label: "Financial", groups: ["Financial"] },
  { id: "representative", label: "Representative", groups: ["Representative"] },
];

function buildFieldSteps(fields) {
  const groups = groupFields(fields);
  const known = new Set(FIELD_STEPS.flatMap((step) => step.groups));
  const steps = FIELD_STEPS.map((step) => ({
    ...step,
    sections: step.groups.filter((group) => groups.has(group)).map((group) => ({ group, fields: groups.get(group) })),
  })).filter((step) => step.sections.length);
  const other = [...groups.keys()].filter((group) => !known.has(group));
  if (other.length) {
    steps.push({ id: "other", label: "Other", sections: other.map((group) => ({ group, fields: groups.get(group) })) });
  }
  return steps;
}

// Numbered step bar: done steps get a check, the current one is filled; every step is a button so
// the applicant can jump straight to any section.
function StepBar({ steps, current, onSelect, isComplete }) {
  return (
    <ol className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" aria-label="Registration steps">
      {steps.map((step, index) => {
        const isCurrent = index === current;
        const isDone = !isCurrent && (isComplete ? isComplete(index) : index < current);
        return (
          <li key={step.id} className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex w-full min-w-[7rem] items-center gap-2 rounded-xl px-2.5 py-2 text-start transition ${
                isCurrent ? "bg-accent-soft" : "hover:bg-hover"
              }`}
            >
              <span
                className={`pos-num grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${
                  isCurrent ? "bg-accent text-white" : isDone ? "bg-success-soft text-success" : "bg-inset text-muted"
                }`}
              >
                {isDone ? <CircleCheck size={15} /> : index + 1}
              </span>
              <span dir="auto" className={`truncate text-xs font-bold ${isCurrent ? "text-ink" : "text-muted"}`}>{step.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// One step's field groups: a small group heading over a 1 / 2 / 3-column grid of fields.
function FieldSections({ sections, renderField }) {
  return (
    <div className="space-y-5">
      {sections.map(({ group, fields }) => (
        <section key={group}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">{GROUP_LABEL[group] || group}</h3>
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{fields.map(renderField)}</div>
        </section>
      ))}
    </div>
  );
}

// The page frame shared by the draft wizard and the read-only view: the step bar on a tinted strip,
// the step's content, and an action footer on the same tint. It takes its content's own height --
// each step is small enough to fit on screen -- so neither the page nor the card ever scrolls.
function StepFrame({ steps, current, onSelect, isComplete, footer, children }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-surface)]">
      <div className="bg-raised px-3 pt-3 pb-2">
        <StepBar steps={steps} current={current} onSelect={onSelect} isComplete={isComplete} />
      </div>
      <div className="p-4 sm:p-6">{children}</div>
      {footer && <div className="bg-raised px-4 py-3">{footer}</div>}
    </div>
  );
}

const fieldInputClass =
  "mt-1.5 h-10 w-full rounded-lg bg-inset px-3 text-sm text-ink outline-none ring-1 ring-transparent transition placeholder:text-subtle hover:bg-hover focus:bg-canvas focus:ring-2 focus:ring-accent-line disabled:opacity-50";
const ghostButtonClass =
  "flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold text-ink transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40";

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
  const [step, setStep] = useState(0);
  // Turned on when the applicant tries to leave a step with empty fields: outlines them in red.
  const [showMissing, setShowMissing] = useState(false);

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

  const fieldSteps = buildFieldSteps(registration.fields);
  const steps = [
    ...fieldSteps,
    { id: "branches", label: "Branches" },
    { id: "documents", label: "Documents" },
  ];
  const current = steps[step];
  const isLast = step === steps.length - 1;

  // Every input of a step must be filled before moving past it. Field steps: all their fields.
  // Branches are optional (none is fine), but every field of each branch that was added must be
  // filled. The documents step has no inputs. Saving a draft is always allowed.
  const missingIn = (index) => {
    const target = steps[index];
    if (target.id === "branches") {
      return branches.reduce(
        (count, branch) => count + PROPOSED_BRANCH_FIELDS.filter(([key]) => !isFilled(branch[key])).length,
        0,
      );
    }
    if (target.id === "documents") return 0;
    return target.sections.reduce(
      (count, section) => count + section.fields.filter((field) => !isFilled(values[field.key])).length,
      0,
    );
  };
  const isComplete = (index) => missingIn(index) === 0;
  const firstIncomplete = steps.findIndex((_, index) => !isComplete(index));

  const blockOn = (index) => {
    const missing = missingIn(index);
    setStep(index);
    setShowMissing(true);
    setNotice("");
    setError(`Fill in every field in this step to continue (${missing} empty).`);
  };
  const goTo = (index) => {
    // Going back is always allowed; going forward only past complete steps.
    if (index > step) {
      const blocker = steps.findIndex((_, i) => i < index && !isComplete(i));
      if (blocker !== -1) return blockOn(blocker);
    }
    setShowMissing(false);
    setError("");
    setStep(index);
  };
  const next = () => goTo(step + 1);
  const requestSubmit = () => {
    if (firstIncomplete !== -1) return blockOn(firstIncomplete);
    setError("");
    setConfirmSubmit(true);
  };

  const renderField = (field) => (
    <label key={field.key} className="text-xs font-bold text-ink/80">
      {fieldLabel(field.key)}
      {field.requiredForApproval && <span className="text-warning"> *</span>}
      <input
        value={values[field.key] ?? ""}
        onChange={(event) => setValues((currentValues) => ({ ...currentValues, [field.key]: event.target.value }))}
        disabled={updateMutation.isPending}
        aria-invalid={showMissing && !isFilled(values[field.key])}
        className={`${fieldInputClass} ${showMissing && !isFilled(values[field.key]) ? "!ring-2 !ring-danger" : ""}`}
      />
    </label>
  );

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" disabled={step === 0} onClick={() => goTo(step - 1)} className={ghostButtonClass}>
          Back
        </button>
        <button type="button" disabled={updateMutation.isPending} onClick={save} className={ghostButtonClass}>
          {updateMutation.isPending ? "Saving..." : "Save draft"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmCancel(true)}
          className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold text-danger transition hover:bg-danger-soft"
        >
          <X size={15} /> Cancel registration
        </button>
      </div>
      {isLast ? (
        <button
          type="button"
          onClick={requestSubmit}
          className="flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white"
        >
          <Send size={15} /> Submit for review
        </button>
      ) : (
        <button
          type="button"
          onClick={next}
          className="flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white"
        >
          Next
        </button>
      )}
    </div>
  );

  return (
    <>
      {(notice || error) && (
        <div className={`rounded-xl px-3 py-2 text-xs ${error ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent"}`}>
          {error || notice}
        </div>
      )}

      <StepFrame
        steps={steps}
        current={step}
        onSelect={goTo}
        // A check only once this step AND every step before it is complete -- so optional / input-less
        // steps further on don't look done before the applicant gets there.
        isComplete={(index) => firstIncomplete === -1 || index < firstIncomplete}
        footer={footer}
      >
        {current.id === "branches" ? (
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-subtle">Proposed branches (optional)</h3>
            <ProposedBranchesEditor branches={branches} onChange={setBranches} disabled={updateMutation.isPending} showErrors={showMissing} />
          </section>
        ) : current.id === "documents" ? (
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-subtle">Documents</h3>
            <MyRegistrationDocumentsPanel registrationId={registration.id} canEdit />
          </section>
        ) : (
          <FieldSections sections={current.sections} renderField={renderField} />
        )}
      </StepFrame>

      {confirmSubmit && (
        <div className="rounded-2xl bg-accent-soft p-4">
          <p className="text-xs text-accent">
            This sends your current information to review, using exactly what is saved right now.
            You will not be able to edit it directly afterward.
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={submitMutation.isPending} onClick={submit} className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {submitMutation.isPending ? "Submitting..." : "Confirm submit"}
            </button>
            <button type="button" onClick={() => setConfirmSubmit(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:bg-hover">
              Cancel
            </button>
          </div>
        </div>
      )}
      {confirmCancel && (
        <div className="rounded-2xl bg-danger-soft p-4">
          <p className="text-xs text-danger">This ends this registration. This cannot be undone.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={cancelMutation.isPending} onClick={cancel} className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {cancelMutation.isPending ? "Cancelling..." : "Confirm cancel"}
            </button>
            <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:bg-hover">
              Keep it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ReadOnlyView({ registration }) {
  const { t } = useI18n();
  const cancelMutation = useCancelRegistration(registration.id);
  const reopenMutation = useReopenRegistration(registration.id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const canCancel = CANCELLABLE_STATUSES.has(registration.status);
  const canReopen = REOPENABLE_STATUSES.has(registration.status);
  const openRequests = registration.informationRequests.filter((request) => request.status === "Open");

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

  const steps = [...buildFieldSteps(registration.fields), { id: "documents", label: "Documents" }];
  const current = steps[step];

  const renderField = (field) => (
    <div key={field.key} className="rounded-lg bg-inset px-3 py-2">
      <div className="text-[10px] text-subtle">{fieldLabel(field.key)}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink">{field.value || "-"}</div>
    </div>
  );

  const footer = (canReopen || canCancel) && (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canReopen && (
        <button
          type="button"
          disabled={reopenMutation.isPending}
          onClick={() => setConfirmReopen(true)}
          className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold text-success transition hover:bg-success-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={15} /> {t("myRegistration.reopen.button")}
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          onClick={() => setConfirmCancel(true)}
          className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold text-danger transition hover:bg-danger-soft"
        >
          <X size={15} /> Cancel registration
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="flex items-start gap-3 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-surface)]">
        {registration.status === "Approved" && <CircleCheck size={22} className="mt-0.5 shrink-0 text-success" />}
        <div className="min-w-0">
          <p className="text-sm text-ink">
            {registration.status === "Submitted" && "Your registration was submitted and is waiting to be picked up for review."}
            {registration.status === "UnderReview" && "Your registration is currently under review."}
            {registration.status === "NeedsMoreInformation" && "Additional information is needed before review can continue -- see below."}
            {registration.status === "Approved" && "Your registration was approved."}
            {registration.status === "Rejected" && "Your registration was rejected."}
            {registration.status === "Cancelled" && "This registration was cancelled."}
          </p>
          {registration.decisionReason && <p className="mt-1 text-xs text-muted">Reviewer note: {registration.decisionReason}</p>}
        </div>
      </div>

      {error && <div className="rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger">{error}</div>}

      {openRequests.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-muted">Information requested</h2>
          {openRequests.map((request) => (
            <InformationRequestCard key={request.id} registrationId={registration.id} request={request} />
          ))}
        </div>
      )}

      <StepFrame steps={steps} current={step} onSelect={setStep} footer={footer || null}>
        {current.id === "documents" ? (
          <MyRegistrationDocumentsPanel
            registrationId={registration.id}
            canEdit={registration.status !== "Approved" && registration.status !== "Rejected" && registration.status !== "Cancelled"}
          />
        ) : (
          <FieldSections sections={current.sections} renderField={renderField} />
        )}
      </StepFrame>

      {confirmReopen && (
        <div className="rounded-2xl bg-success-soft p-4">
          <p className="text-xs font-bold text-success">{t("myRegistration.reopen.confirmTitle")}</p>
          <p className="mt-1 text-xs text-success">{t("myRegistration.reopen.confirmBody")}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={reopenMutation.isPending}
              onClick={reopen}
              className="rounded-xl bg-success px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reopenMutation.isPending ? t("myRegistration.reopen.pending") : t("myRegistration.reopen.confirmAction")}
            </button>
            <button
              type="button"
              disabled={reopenMutation.isPending}
              onClick={() => setConfirmReopen(false)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("myRegistration.reopen.cancelAction")}
            </button>
          </div>
        </div>
      )}
      {confirmCancel && (
        <div className="rounded-2xl bg-danger-soft p-4">
          <p className="text-xs text-danger">This ends this registration. This cannot be undone.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={cancelMutation.isPending} onClick={cancel} className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {cancelMutation.isPending ? "Cancelling..." : "Confirm cancel"}
            </button>
            <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:bg-hover">
              Keep it
            </button>
          </div>
        </div>
      )}
    </>
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
      {/* Wide and step-based: each step is short enough to fit on screen, so the page doesn't scroll. */}
      <main className="reg-page mx-auto flex w-full max-w-7xl flex-col gap-3" dir="rtl">
        <PageHeader title="My Registration" />

        {latestQuery.isLoading ? (
          <LoadingState label="Loading your registration..." />
        ) : latestQuery.isError ? (
          latestQuery.error?.code === "Registration.NotFound" ? (
            <div className="grid flex-1 place-items-center">
              <StartScreen onCreate={create} isPending={createMutation.isPending} error={createError} />
            </div>
          ) : (
            <ErrorState title="Unable to load your registration" message={getErrorMessage(latestQuery.error)} />
          )
        ) : !latestQuery.data ? (
          <EmptyState title="No registration" message="Something unexpected happened." />
        ) : (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-muted shadow-[var(--shadow-surface)]">
              <span className="pos-num font-bold text-ink">{latestQuery.data.reference}</span>
              <RegistrationStatusBadge status={latestQuery.data.status} />
              <span className="text-subtle">Created {formatDateTime(latestQuery.data.createdAtUtc)}</span>
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
