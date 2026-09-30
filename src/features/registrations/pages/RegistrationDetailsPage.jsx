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
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-slate-300">
          {fieldLabel(field.key)}
          {field.requiredForApproval && <span className="text-amber-300"> *</span>}
        </span>
        <span className="text-[10px] text-slate-500">{field.status}</span>
      </div>
      {!editing ? (
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-slate-100">{field.value || "-"}</span>
          <div className="flex shrink-0 gap-1.5">
            {canEdit && (
              <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-200 hover:border-blue-400/40">
                Edit
              </button>
            )}
            {canReview && field.status !== "Confirmed" && field.value && (
              <button
                type="button"
                disabled={confirmMutation.isPending}
                onClick={confirm}
                className="rounded-lg border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/10"
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
            className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-white outline-none"
          />
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason (optional)"
            className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-white outline-none"
          />
          <div className="flex gap-1.5">
            <button type="button" disabled={editMutation.isPending} onClick={save} className="rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-50">
              {editMutation.isPending ? "..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300">
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <div className="mt-1 text-[10px] text-red-300">{error}</div>}
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
        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-200 hover:border-blue-400/40"
      >
        <MessageSquarePlus size={12} /> Request information
      </button>
    );
  }

  return (
    <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
      <select value={fieldKey} onChange={(event) => setFieldKey(event.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-white outline-none">
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
        className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-white outline-none"
      />
      {error && <div className="text-[11px] text-red-300">{error}</div>}
      <div className="flex gap-1.5">
        <button type="button" disabled={requestMutation.isPending} onClick={submit} className="rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-50">
          {requestMutation.isPending ? "Sending..." : "Send request"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300">
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
          <div key={event.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-2 text-[11px] text-slate-300">
            <span className="font-bold text-white">{event.type}</span>
            {event.previousStatus && event.newStatus && (
              <span className="text-slate-500"> ({event.previousStatus} → {event.newStatus})</span>
            )}
            <span className="ms-2 text-slate-500">{formatDateTime(event.occurredAtUtc)}</span>
            {event.note && <div className="mt-0.5 text-slate-400">{event.note}</div>}
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
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title={registration ? registration.reference : "Registration"}
          actions={
            <button
              type="button"
              onClick={() => navigate(ROUTES.PLATFORM_REGISTRATIONS)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
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
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-300">
                <RegistrationStatusBadge status={registration.status} />
                <span className="text-slate-500">{registration.kind}</span>
                <span className="text-slate-500">Created {formatDateTime(registration.createdAtUtc)}</span>
                {registration.submittedAtUtc && <span className="text-slate-500">Submitted {formatDateTime(registration.submittedAtUtc)}</span>}
                {registration.decidedAtUtc && <span className="text-slate-500">Decided {formatDateTime(registration.decidedAtUtc)}</span>}
                {!registration.assignedReviewerUserId && permissions.canClaim && registration.status !== "Draft" && (
                  <button
                    type="button"
                    disabled={claimMutation.isPending}
                    onClick={claim}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-50"
                  >
                    <UserCheck size={12} /> {claimMutation.isPending ? "Claiming..." : "Claim"}
                  </button>
                )}
              </div>
              {registration.decisionReason && (
                <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
                  Decision reason: {registration.decisionReason}
                </div>
              )}
              {notice && <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">{notice}</div>}
              {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="space-y-3 rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                  <h2 className="text-sm font-black text-white">Registration fields</h2>
                  {[...groupFields(registration.fields).entries()].map(([group, fields]) => (
                    <div key={group}>
                      <div className="mb-1.5 text-xs font-bold text-slate-400">{GROUP_LABEL[group] || group}</div>
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
                      <div className="mb-1.5 text-xs font-bold text-slate-400">Proposed branches</div>
                      <div className="space-y-1">
                        {registration.proposedBranches.map((branch, index) => (
                          <div key={index} className="rounded-lg bg-white/[0.02] p-2 text-xs text-slate-300">
                            {branch.name} — {branch.city}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-400">Information requests</h3>
                      {permissions.canRequestInformation && registration.status !== "Approved" && registration.status !== "Rejected" && (
                        <RequestInformationForm registrationId={registrationId} fields={registration.fields} />
                      )}
                    </div>
                    {registration.informationRequests.length === 0 ? (
                      <p className="text-[11px] text-slate-500">None yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {registration.informationRequests.map((request) => (
                          <div key={request.id} className="rounded-lg bg-white/[0.02] p-2 text-[11px] text-slate-300">
                            <div className="font-bold text-slate-200">
                              {request.requestedFieldKey ? fieldLabel(request.requestedFieldKey) : "General"} · {request.status}
                            </div>
                            <div>{request.message}</div>
                            {request.responseMessage && <div className="mt-0.5 text-emerald-300">Response: {request.responseMessage}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                    <h2 className="mb-3 text-sm font-black text-white">Documents</h2>
                    <RegistrationDocumentsPanel
                      registrationId={registrationId}
                      permissions={permissions}
                      selectedDocumentId={selectedDocumentId}
                      onSelectDocument={setSelectedDocumentId}
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                    <h2 className="mb-3 text-sm font-black text-white">Extraction</h2>
                    <ExtractionPanel registrationId={registrationId} documentId={selectedDocumentId} permissions={permissions} />
                  </div>

                  {permissions.canViewHistory && (
                    <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                      <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-white">
                        <FileClock size={15} /> History
                      </h2>
                      <HistoryPanel registrationId={registrationId} canView={permissions.canViewHistory} />
                    </div>
                  )}
                </section>
              </div>

              {registration.status === "UnderReview" && (permissions.canApprove || permissions.canReject) && (
                <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                  <h2 className="mb-2 text-sm font-black text-white">Decision</h2>
                  {(() => {
                    const unconfirmed = registration.fields.filter((field) => field.requiredForApproval && field.status !== "Confirmed");
                    return unconfirmed.length > 0 ? (
                      <p className="mb-2 text-[11px] text-amber-300">
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
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        <CircleCheck size={14} /> Approve
                      </button>
                    )}
                    {permissions.canReject && (
                      <button
                        type="button"
                        onClick={() => setConfirmReject(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-red-400/30 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10"
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
              className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
            />
          </ConfirmActionDialog>
        )}
      </main>
    </AppLayout>
  );
}
