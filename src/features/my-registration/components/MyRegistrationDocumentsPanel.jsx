import { useRef, useState } from "react";
import { Download, FileUp } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { downloadMyRegistrationDocument } from "../api/myRegistrationApi";
import { useMyRegistrationDocuments, useUploadMyRegistrationDocument } from "../hooks/useMyRegistration";
import { DocumentReviewStatusBadge, DocumentExtractionStatusBadge } from "./RegistrationStatusBadges";
import { REGISTRATION_DOCUMENT_TYPES } from "../types/registration.types";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function triggerBrowserDownload(registrationId, doc) {
  const blob = await downloadMyRegistrationDocument(registrationId, doc.id);
  const url = window.URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = doc.fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

// Applicant side supports Upload/List/Download ONLY -- there is no Replace or Remove/Delete route for
// the applicant (verified: those exist only under the Support/platform route group). Uploading again
// simply adds a new document row; nothing here removes or supersedes an earlier upload.
export function MyRegistrationDocumentsPanel({ registrationId, canEdit }) {
  const documentsQuery = useMyRegistrationDocuments(registrationId);
  const uploadMutation = useUploadMyRegistrationDocument(registrationId);
  const [uploadType, setUploadType] = useState(REGISTRATION_DOCUMENT_TYPES[0]);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const fileInputRef = useRef(null);

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
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2">
          <select
            value={uploadType}
            onChange={(event) => setUploadType(event.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-white outline-none"
          >
            {REGISTRATION_DOCUMENT_TYPES.map((type) => (
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
            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileUp size={13} /> {uploadMutation.isPending ? "Uploading..." : "Upload document"}
          </button>
        </div>
      )}

      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}

      {documentsQuery.isLoading && <LoadingState label="Loading documents..." />}
      {documentsQuery.isError && <ErrorState title="Unable to load documents" message={getErrorMessage(documentsQuery.error)} />}
      {!documentsQuery.isLoading && !documentsQuery.isError && (documentsQuery.data || []).length === 0 && (
        <EmptyState title="No documents yet" message="Upload the documents your application needs." />
      )}
      {!documentsQuery.isLoading && !documentsQuery.isError && (documentsQuery.data || []).length > 0 && (
        <div className="space-y-2">
          {documentsQuery.data.map((doc) => (
            <div key={doc.id} className={`rounded-xl border border-white/10 bg-[#0d1728] p-3 text-xs ${doc.isSuperseded ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-bold text-white">{doc.fileName}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {doc.documentType} · {formatSize(doc.sizeBytes)} · {formatDateTime(doc.uploadedAtUtc)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  <DocumentReviewStatusBadge status={doc.reviewStatus} />
                  <DocumentExtractionStatusBadge status={doc.extractionStatus} />
                </div>
              </div>
              {doc.reviewNote && <div className="mt-1 text-[10px] text-slate-500">Reviewer note: {doc.reviewNote}</div>}
              <div className="mt-2">
                <button
                  type="button"
                  disabled={downloadingId === doc.id}
                  onClick={() => download(doc)}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-200 hover:border-blue-400/40"
                >
                  <Download size={11} /> {downloadingId === doc.id ? "..." : "Download"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
