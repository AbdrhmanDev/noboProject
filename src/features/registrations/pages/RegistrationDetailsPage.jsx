import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CircleCheck, FileClock, MessageSquarePlus, UserCheck, XCircle } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { PlatformAccessGate } from "../../platform/components/PlatformAccessGate";
import { useCurrentPlatformAccess } from "../../platform/hooks/usePlatform";
import {
  PLATFORM_REGISTRATIONS_APPROVE,
  PLATFORM_REGISTRATIONS_DOWNLOAD_DOCUMENT,
  PLATFORM_REGISTRATIONS_EDIT,
  PLATFORM_REGISTRATIONS_REJECT,
  PLATFORM_REGISTRATIONS_REQUEST_INFORMATION,
  PLATFORM_REGISTRATIONS_REVIEW,
  PLATFORM_REGISTRATIONS_REVIEW_DOCUMENTS,
  PLATFORM_REGISTRATIONS_REVIEW_FIELDS,
  PLATFORM_REGISTRATIONS_TRIGGER_EXTRACTION,
  PLATFORM_REGISTRATIONS_UPLOAD_DOCUMENT,
  PLATFORM_REGISTRATIONS_VIEW,
  PLATFORM_REGISTRATIONS_VIEW_DOCUMENTS,
  PLATFORM_REGISTRATIONS_VIEW_EXTRACTIONS,
  PLATFORM_REGISTRATIONS_VIEW_HISTORY,
} from "../../platform/constants/platformPermissions";
import { ROUTES } from "../../../utils/routes";
import { RegistrationStatusBadge } from "../components/RegistrationBadges";
import { RegistrationDocumentsPanel } from "../components/RegistrationDocumentsPanel";
import { ExtractionPanel } from "../components/ExtractionPanel";
import { ConfirmActionDialog } from "../components/ConfirmActionDialog";
import { GROUP_LABEL, fieldLabel, groupFields } from "../utils/fieldLabels";
import {
  useApproveRegistration,
  useClaimRegistration,
  useConfirmRegistrationField,
  useEditRegistrationField,
  useRegistrationDetails,
  useRegistrationHistory,
  useRejectRegistration,
  useRequestRegistrationInformation,
} from "../hooks/useRegistrations";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function FieldEditor({ registrationId, field, canEdit, canReview }) {
  const editMutation = useEditRegistrationField(registrationId);
  const confirmMutation = useConfirmRegistrationField(registrationId);
  const [value, setValue] = useState(field.value ?? "");
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    try {
      await editMutation.mutateAsync({ fieldKey: field.key, payload: { value: value.trim() || null, reason: reason.trim() || null } });
      setEditing(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    }
  };

  const confirm = async () => {
    setError("");
    try {
      await confirmMutation.mutateAsync(field.key);
    } catch (confirmError) {
      setError(getErrorMessage(confirmError));
    }
  };

  return (
    <div className="rounded-lg border border-line bg-raised p-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-muted">
          {fieldLabel(field.key)}
          {field.requiredForApproval && <span className="text-warning"> *</span>}
        </span>
        <span className="text-xs text-subtle">{field.status}</span>
      </div>
      {!editing ? (
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-ink">{field.value || "-"}</span>
          <div className="flex shrink-0 gap-1.5">
            {canEdit && (
              <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-line px-2 py-0.5 text-xs font-bold text-ink hover:border-accent-line">
                Edit
              </button>
            )}
            {canReview && field.status !== "Confirmed" && field.value && (
              <button
                type="button"
                disabled={confirmMutation.isPending}
                onClick={confirm}
                className="rounded-lg border border-success px-2 py-0.5 text-xs font-bold text-success hover:bg-success-soft"
              >
                Confirm
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-1.5 space-y-1.5">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none"
          />
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason (optional)"
            className="h-9 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none"
          />
          <div className="flex gap-1.5">
            <button type="button" disabled={editMutation.isPending} onClick={save} className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-white disabled:opacity-50">
              {editMutation.isPending ? "..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-line px-2 py-1 text-xs font-bold text-muted">
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <div className="mt-1 text-xs text-danger">{error}</div>}
    </div>
  );
}

function RequestInformationForm({ registrationId, fields }) {
  const [fieldKey, setFieldKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const requestMutation = useRequestRegistrationInformation(registrationId);

  const submit = async () => {
    if (!message.trim()) {
      setError("A message is required.");
      return;
    }
    setError("");
    try {
      await requestMutation.mutateAsync({ items: [{ fieldKey: fieldKey || null, item: null, message: message.trim() }] });
      setMessage("");
      setFieldKey("");
      setOpen(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs font-bold text-ink hover:border-accent-line"
      >
        <MessageSquarePlus size={12} /> Request information
      </button>
    );
  }

  return (
    <div className="space-y-1.5 rounded-xl border border-line bg-raised p-2.5">
      <select value={fieldKey} onChange={(event) => setFieldKey(event.target.value)} className="h-9 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none">
        <option value="">General (not tied to one field)</option>
        {fields.map((field) => (
          <option key={field.key} value={field.key}>
            {fieldLabel(field.key)}
          </option>
        ))}
      </select>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={2}
        placeholder="What is missing or needs clarification?"
        className="w-full rounded-lg border border-line bg-canvas px-2 py-1.5 text-sm text-ink outline-none"
      />
      {error && <div className="text-xs text-danger">{error}</div>}
      <div className="flex gap-1.5">
        <button type="button" disabled={requestMutation.isPending} onClick={submit} className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-white disabled:opacity-50">
          {requestMutation.isPending ? "Sending..." : "Send request"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-line px-2 py-1 text-xs font-bold text-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}

function HistoryPanel({ registrationId, canView }) {
  const historyQuery = useRegistrationHistory(registrationId, canView);
  if (!canView) return null;
  return (
    <div className="space-y-2">
      {historyQuery.isLoading && <LoadingState label="Loading history..." />}
      {historyQuery.isError && <ErrorState title="Unable to load history" message={getErrorMessage(historyQuery.error)} />}
      {historyQuery.data && (historyQuery.data.events || []).length === 0 && (
        <EmptyState title="No history yet" message="No events have been recorded." />
      )}
      {historyQuery.data &&
        historyQuery.data.events.map((event) => (
          <div key={event.id} className="rounded-lg border border-line bg-raised p-2 text-xs text-muted">
            <span className="font-bold text-ink">{event.type}</span>
            {event.previousStatus && event.newStatus && (
              <span className="text-subtle"> ({event.previousStatus} → {event.newStatus})</span>
            )}
            <span className="ms-2 text-subtle">{formatDateTime(event.occurredAtUtc)}</span>
            {event.note && <div className="mt-0.5 text-muted">{event.note}</div>}
          </div>
        ))}
    </div>
  );
}

export function RegistrationDetailsPage() {
  const navigate = useNavigate();
  const { registrationId } = useParams();
  const accessQuery = useCurrentPlatformAccess();
  const permissionSet = new Set(accessQuery.data?.permissions || []);
  const permissions = {
    canEditFields: permissionSet.has(PLATFORM_REGISTRATIONS_EDIT),
    canReviewFields: permissionSet.has(PLATFORM_REGISTRATIONS_REVIEW_FIELDS),
    canRequestInformation: permissionSet.has(PLATFORM_REGISTRATIONS_REQUEST_INFORMATION),
    canApprove: permissionSet.has(PLATFORM_REGISTRATIONS_APPROVE),
    canReject: permissionSet.has(PLATFORM_REGISTRATIONS_REJECT),
    canClaim: permissionSet.has(PLATFORM_REGISTRATIONS_REVIEW),
    canViewHistory: permissionSet.has(PLATFORM_REGISTRATIONS_VIEW_HISTORY),
    canViewDocuments: permissionSet.has(PLATFORM_REGISTRATIONS_VIEW_DOCUMENTS),
    canUploadDocuments: permissionSet.has(PLATFORM_REGISTRATIONS_UPLOAD_DOCUMENT),
    canDownloadDocuments: permissionSet.has(PLATFORM_REGISTRATIONS_DOWNLOAD_DOCUMENT),
    canReviewDocuments: permissionSet.has(PLATFORM_REGISTRATIONS_REVIEW_DOCUMENTS),
    canTriggerExtraction: permissionSet.has(PLATFORM_REGISTRATIONS_TRIGGER_EXTRACTION),
    canViewExtractions: permissionSet.has(PLATFORM_REGISTRATIONS_VIEW_EXTRACTIONS),
  };

  const detailQuery = useRegistrationDetails(registrationId);
  const claimMutation = useClaimRegistration(registrationId);
  const approveMutation = useApproveRegistration(registrationId);
  const rejectMutation = useRejectRegistration(registrationId);

  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const registration = detailQuery.data;

  const claim = async () => {
    setError("");
    try {
      await claimMutation.mutateAsync();
      setNotice("Claimed.");
      window.setTimeout(() => setNotice(""), 2500);
    } catch (claimError) {
      setError(getErrorMessage(claimError));
    }
  };

  const approve = async () => {
    try {
      await approveMutation.mutateAsync({ note: null });
      setConfirmApprove(false);
      setNotice("Registration approved. The company was created.");
    } catch (approveError) {
      setError(getErrorMessage(approveError));
      setConfirmApprove(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) {
      setError("A reason is required to reject.");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ reason: rejectReason.trim() });
      setConfirmReject(false);
      setRejectReason("");
      setNotice("Registration rejected.");
    } catch (rejectError) {
      setError(getErrorMessage(rejectError));
      setConfirmReject(false);
    }
  };

  return (
    <AppLayout>
      <main className="odoo-root space-y-3" dir="rtl">
        <PageHeader
          title={registration ? registration.reference : "Registration"}
          actions={
            <button
              type="button"
              onClick={() => navigate(ROUTES.PLATFORM_REGISTRATIONS)}
              className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
            >
              <ArrowRight size={14} /> Back to queue
            </button>
          }
        />

        <PlatformAccessGate requiredPermission={PLATFORM_REGISTRATIONS_VIEW}>
          {detailQuery.isLoading ? (
            <LoadingState label="Loading registration..." />
          ) : detailQuery.isError ? (
            <ErrorState title="Unable to load registration" message={getErrorMessage(detailQuery.error)} />
          ) : !registration ? (
            <EmptyState title="Not found" message="This registration is not available." />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
                <RegistrationStatusBadge status={registration.status} />
                <span className="text-subtle">{registration.kind}</span>
                <span className="text-subtle">Created {formatDateTime(registration.createdAtUtc)}</span>
                {registration.submittedAtUtc && <span className="text-subtle">Submitted {formatDateTime(registration.submittedAtUtc)}</span>}
                {registration.decidedAtUtc && <span className="text-subtle">Decided {formatDateTime(registration.decidedAtUtc)}</span>}
                {!registration.assignedReviewerUserId && permissions.canClaim && registration.status !== "Draft" && (
                  <button
                    type="button"
                    disabled={claimMutation.isPending}
                    onClick={claim}
                    className="flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
                  >
                    <UserCheck size={12} /> {claimMutation.isPending ? "Claiming..." : "Claim"}
                  </button>
                )}
              </div>
              {registration.decisionReason && (
                <div className="rounded-xl border border-danger bg-danger-soft p-3 text-sm text-danger">
                  Decision reason: {registration.decisionReason}
                </div>
              )}
              {notice && <div className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">{notice}</div>}
              {error && <div className="rounded-xl border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
                  <h2 className="text-sm font-black text-ink">Registration fields</h2>
                  {[...groupFields(registration.fields).entries()].map(([group, fields]) => (
                    <div key={group}>
                      <div className="mb-1.5 text-sm font-bold text-muted">{GROUP_LABEL[group] || group}</div>
                      <div className="space-y-1.5">
                        {fields.map((field) => (
                          <FieldEditor
                            key={field.key}
                            registrationId={registrationId}
                            field={field}
                            canEdit={permissions.canEditFields}
                            canReview={permissions.canReviewFields}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {registration.proposedBranches.length > 0 && (
                    <div>
                      <div className="mb-1.5 text-sm font-bold text-muted">Proposed branches</div>
                      <div className="space-y-1">
                        {registration.proposedBranches.map((branch, index) => (
                          <div key={index} className="rounded-lg bg-raised p-2 text-sm text-muted">
                            {branch.name} — {branch.city}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-muted">Information requests</h3>
                      {permissions.canRequestInformation && registration.status !== "Approved" && registration.status !== "Rejected" && (
                        <RequestInformationForm registrationId={registrationId} fields={registration.fields} />
                      )}
                    </div>
                    {registration.informationRequests.length === 0 ? (
                      <p className="text-xs text-subtle">None yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {registration.informationRequests.map((request) => (
                          <div key={request.id} className="rounded-lg bg-raised p-2 text-xs text-muted">
                            <div className="font-bold text-ink">
                              {request.requestedFieldKey ? fieldLabel(request.requestedFieldKey) : "General"} · {request.status}
                            </div>
                            <div>{request.message}</div>
                            {request.responseMessage && <div className="mt-0.5 text-success">Response: {request.responseMessage}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="rounded-xl border border-line bg-surface p-4">
                    <h2 className="mb-3 text-sm font-black text-ink">Documents</h2>
                    <RegistrationDocumentsPanel
                      registrationId={registrationId}
                      permissions={permissions}
                      selectedDocumentId={selectedDocumentId}
                      onSelectDocument={setSelectedDocumentId}
                    />
                  </div>

                  <div className="rounded-xl border border-line bg-surface p-4">
                    <h2 className="mb-3 text-sm font-black text-ink">Extraction</h2>
                    <ExtractionPanel registrationId={registrationId} documentId={selectedDocumentId} permissions={permissions} />
                  </div>

                  {permissions.canViewHistory && (
                    <div className="rounded-xl border border-line bg-surface p-4">
                      <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
                        <FileClock size={15} /> History
                      </h2>
                      <HistoryPanel registrationId={registrationId} canView={permissions.canViewHistory} />
                    </div>
                  )}
                </section>
              </div>

              {registration.status === "UnderReview" && (permissions.canApprove || permissions.canReject) && (
                <div className="rounded-xl border border-line bg-surface p-4">
                  <h2 className="mb-2 text-sm font-black text-ink">Decision</h2>
                  {(() => {
                    const unconfirmed = registration.fields.filter((field) => field.requiredForApproval && field.status !== "Confirmed");
                    return unconfirmed.length > 0 ? (
                      <p className="mb-2 text-xs text-warning">
                        Not yet confirmed: {unconfirmed.map((field) => fieldLabel(field.key)).join(", ")} (the backend refuses approval until every
                        required field is confirmed).
                      </p>
                    ) : null;
                  })()}
                  <div className="flex flex-wrap gap-2">
                    {permissions.canApprove && (
                      <button
                        type="button"
                        onClick={() => setConfirmApprove(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-success px-3 py-2 text-sm font-bold text-white"
                      >
                        <CircleCheck size={14} /> Approve
                      </button>
                    )}
                    {permissions.canReject && (
                      <button
                        type="button"
                        onClick={() => setConfirmReject(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-danger px-3 py-2 text-sm font-bold text-danger hover:bg-danger-soft"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </PlatformAccessGate>

        {confirmApprove && (
          <ConfirmActionDialog
            title="Approve registration"
            message="This creates the Company from the confirmed data. This cannot be undone from this screen."
            confirmLabel="Approve"
            tone="default"
            isPending={approveMutation.isPending}
            onConfirm={approve}
            onClose={() => setConfirmApprove(false)}
          />
        )}
        {confirmReject && (
          <ConfirmActionDialog
            title="Reject registration"
            message="This ends the registration. A reason is required."
            confirmLabel="Reject"
            tone="danger"
            isPending={rejectMutation.isPending}
            onConfirm={reject}
            onClose={() => setConfirmReject(false)}
          >
            <input
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Rejection reason (required)"
              className="h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
            />
          </ConfirmActionDialog>
        )}
      </main>
    </AppLayout>
  );
}
