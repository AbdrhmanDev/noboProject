import { useRef, useState } from "react";
import { Download, FileUp, RefreshCcw, ShieldCheck, ShieldX } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { downloadRegistrationDocument } from "../api/registrationsApi";
import {
  useRegistrationDocuments,
  useRejectRegistrationDocument,
  useReplaceRegistrationDocument,
  useReviewRegistrationDocument,
  useUploadRegistrationDocument,
} from "../hooks/useRegistrations";
import { DocumentExtractionStatusBadge, DocumentReviewStatusBadge } from "./RegistrationBadges";
import { DOCUMENT_TYPES } from "../utils/fieldLabels";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function triggerBrowserDownload(registrationId, doc) {
  const blob = await downloadRegistrationDocument(registrationId, doc.id);
  const url = window.URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = doc.fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

// Documents section: list, upload (Support), review/reject, replace, and download-as-attachment.
// There is no preview endpoint (only .../content, streamed as an attachment) -- so "preview" is
// intentionally NOT offered, only Download (see the implementation report's gap list).
export function RegistrationDocumentsPanel({
  registrationId,
  permissions,
  selectedDocumentId,
  onSelectDocument,
}) {
  const documentsQuery = useRegistrationDocuments(registrationId, permissions.canViewDocuments);
  const uploadMutation = useUploadRegistrationDocument(registrationId);
  const reviewMutation = useReviewRegistrationDocument(registrationId);
  const rejectMutation = useRejectRegistrationDocument(registrationId);
  const replaceMutation = useReplaceRegistrationDocument(registrationId);

  const [uploadType, setUploadType] = useState(DOCUMENT_TYPES[0]);
  const [error, setError] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const [replacingId, setReplacingId] = useState(null);

  if (!permissions.canViewDocuments) return null;

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      await uploadMutation.mutateAsync({ documentType: uploadType, file });
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    }
  };

  const replace = async (documentId, file) => {
    setError("");
    try {
      await replaceMutation.mutateAsync({ documentId, file });
    } catch (replaceError) {
      setError(getErrorMessage(replaceError));
    } finally {
      setReplacingId(null);
    }
  };

  const review = async (documentId) => {
    setError("");
    try {
      await reviewMutation.mutateAsync({ documentId, payload: { note: null } });
    } catch (reviewError) {
      setError(getErrorMessage(reviewError));
    }
  };

  const reject = async (documentId) => {
    if (!rejectReason.trim()) {
      setError("A reason is required to reject a document.");
      return;
    }
    setError("");
    try {
      await rejectMutation.mutateAsync({ documentId, payload: { reason: rejectReason.trim() } });
      setRejectingId(null);
      setRejectReason("");
    } catch (rejectError) {
      setError(getErrorMessage(rejectError));
    }
  };

  const download = async (doc) => {
    setError("");
    setDownloadingId(doc.id);
    try {
      await triggerBrowserDownload(registrationId, doc);
    } catch (downloadError) {
      setError(getErrorMessage(downloadError));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {permissions.canUploadDocuments && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-raised p-2">
          <select
            value={uploadType}
            onChange={(event) => setUploadType(event.target.value)}
            className="h-9 rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input ref={fileInputRef} type="file" className="hidden" onChange={upload} />
          <button
            type="button"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileUp size={13} /> {uploadMutation.isPending ? "Uploading..." : "Upload document"}
          </button>
        </div>
      )}

      {error && <div className="rounded-xl border border-danger bg-danger-soft p-2 text-sm text-danger">{error}</div>}

      {documentsQuery.isLoading && <LoadingState label="Loading documents..." />}
      {documentsQuery.isError && (
        <ErrorState title="Unable to load documents" message={getErrorMessage(documentsQuery.error)} />
      )}
      {!documentsQuery.isLoading && !documentsQuery.isError && (documentsQuery.data || []).length === 0 && (
        <EmptyState title="No documents" message="No documents have been uploaded yet." />
      )}
      {!documentsQuery.isLoading && !documentsQuery.isError && (documentsQuery.data || []).length > 0 && (
        <div className="space-y-2">
          {documentsQuery.data.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
                selectedDocumentId === doc.id ? "border-accent-line bg-accent-soft" : "border-line bg-raised hover:border-accent-line"
              } ${doc.isSuperseded ? "opacity-50" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-bold text-ink">{doc.fileName}</div>
                  <div className="mt-0.5 text-xs text-subtle">
                    {doc.documentType} · {formatSize(doc.sizeBytes)} · {doc.uploadSource} · {formatDateTime(doc.uploadedAtUtc)}
                    {doc.isSuperseded && " · superseded"}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  <DocumentReviewStatusBadge status={doc.reviewStatus} />
                  <DocumentExtractionStatusBadge status={doc.extractionStatus} />
                </div>
              </div>
              {doc.reviewNote && <div className="mt-1 text-xs text-subtle">Note: {doc.reviewNote}</div>}

              <div className="mt-2 flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}>
                {permissions.canDownloadDocuments && (
                  <button
                    type="button"
                    disabled={downloadingId === doc.id}
                    onClick={() => download(doc)}
                    className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 font-bold text-ink hover:border-accent-line"
                  >
                    <Download size={11} /> {downloadingId === doc.id ? "..." : "Download"}
                  </button>
                )}
                {permissions.canReviewDocuments && doc.reviewStatus === "Pending" && (
                  <>
                    <button
                      type="button"
                      disabled={reviewMutation.isPending}
                      onClick={() => review(doc.id)}
                      className="flex items-center gap-1 rounded-lg border border-success px-2 py-1 font-bold text-success hover:bg-success-soft"
                    >
                      <ShieldCheck size={11} /> Mark reviewed
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingId(doc.id)}
                      className="flex items-center gap-1 rounded-lg border border-danger px-2 py-1 font-bold text-danger hover:bg-danger-soft"
                    >
                      <ShieldX size={11} /> Reject
                    </button>
                  </>
                )}
                {permissions.canUploadDocuments && !doc.isSuperseded && (
                  <>
                    <input
                      ref={replacingId === doc.id ? replaceInputRef : undefined}
                      type="file"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) replace(doc.id, file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={replaceMutation.isPending}
                      onClick={() => {
                        setReplacingId(doc.id);
                        window.setTimeout(() => replaceInputRef.current?.click(), 0);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 font-bold text-ink hover:border-accent-line"
                    >
                      <RefreshCcw size={11} /> Replace
                    </button>
                  </>
                )}
              </div>

              {rejectingId === doc.id && (
                <div className="mt-2 space-y-1.5" onClick={(event) => event.stopPropagation()}>
                  <input
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Rejection reason (required)"
                    className="h-9 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={rejectMutation.isPending}
                      onClick={() => reject(doc.id)}
                      className="rounded-lg bg-danger px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {rejectMutation.isPending ? "..." : "Confirm reject"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      className="rounded-lg border border-line px-2 py-1 text-xs font-bold text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
