import { useState } from "react";
import { CircleCheck, Pencil, PlayCircle, XCircle } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import {
  useConfirmExtractedValue,
  useCorrectExtractedValue,
  useExtractedValues,
  useExtractionRuns,
  useRejectExtractedValue,
  useTriggerExtraction,
} from "../hooks/useRegistrations";
import { ExtractedValueDecisionBadge, ExtractionRunStatusBadge } from "./RegistrationBadges";
import { fieldLabel } from "../utils/fieldLabels";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function ExtractedValueRow({ registrationId, documentId, runId, value, canReview }) {
  const confirmMutation = useConfirmExtractedValue(registrationId, documentId, runId);
  const correctMutation = useCorrectExtractedValue(registrationId, documentId, runId);
  const rejectMutation = useRejectExtractedValue(registrationId, documentId, runId);
  const [correcting, setCorrecting] = useState(false);
  const [correctedValue, setCorrectedValue] = useState(value.normalizedValue ?? value.rawText);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Mirrors the backend's OWN transition rules exactly (ExtractedValueReviewHandlers, read from
  // source): Confirm/Reject only from Pending; Correct from Pending/Confirmed/Corrected, never
  // Rejected. Disabling here is a UX courtesy only -- the backend re-enforces this regardless.
  const canConfirm = value.reviewDecision === "Pending";
  const canReject = value.reviewDecision === "Pending";
  const canCorrect = value.reviewDecision !== "Rejected";

  const confirm = async () => {
    setError("");
    try {
      await confirmMutation.mutateAsync(value.id);
    } catch (confirmError) {
      setError(getErrorMessage(confirmError));
    }
  };

  const correct = async () => {
    if (!correctedValue.trim() || !reason.trim()) {
      setError("A corrected value and a reason are both required.");
      return;
    }
    setError("");
    try {
      await correctMutation.mutateAsync({ valueId: value.id, payload: { value: correctedValue.trim(), reason: reason.trim() } });
      setCorrecting(false);
      setReason("");
    } catch (correctError) {
      setError(getErrorMessage(correctError));
    }
  };

  const reject = async () => {
    if (!reason.trim()) {
      setError("A reason is required to reject a suggestion.");
      return;
    }
    setError("");
    try {
      await rejectMutation.mutateAsync({ valueId: value.id, payload: { reason: reason.trim() } });
    } catch (rejectError) {
      setError(getErrorMessage(rejectError));
    }
  };

  return (
    <div className="rounded-xl border border-line bg-raised p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-bold text-ink">{fieldLabel(value.fieldKey)}</div>
          <div className="mt-0.5 text-muted">
            Suggested: <span className="font-mono text-ink">{value.normalizedValue ?? value.rawText}</span>
          </div>
          <div className="mt-0.5 text-xs text-subtle">
            Confidence {(Number(value.confidence) * 100).toFixed(0)}% · {formatDateTime(value.createdAtUtc)}
          </div>
          {value.warnings.length > 0 && (
            <div className="mt-1 text-xs text-warning">{value.warnings.join(", ")}</div>
          )}
        </div>
        <ExtractedValueDecisionBadge decision={value.reviewDecision} />
      </div>

      {canReview && (canConfirm || canCorrect || canReject) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {canConfirm && (
            <button
              type="button"
              disabled={confirmMutation.isPending}
              onClick={confirm}
              className="flex items-center gap-1 rounded-lg border border-success px-2 py-1 font-bold text-success hover:bg-success-soft"
            >
              <CircleCheck size={11} /> Confirm as-is
            </button>
          )}
          {canCorrect && (
            <button
              type="button"
              onClick={() => setCorrecting(correcting === true ? false : true)}
              className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 font-bold text-ink hover:border-accent-line"
            >
              <Pencil size={11} /> Correct
            </button>
          )}
          {canReject && (
            <button
              type="button"
              disabled={rejectMutation.isPending}
              onClick={() => setCorrecting("reject")}
              className="flex items-center gap-1 rounded-lg border border-danger px-2 py-1 font-bold text-danger hover:bg-danger-soft"
            >
              <XCircle size={11} /> Reject
            </button>
          )}
        </div>
      )}

      {correcting === "reject" && (
        <div className="mt-2 space-y-1.5">
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Rejection reason (required)"
            className="h-9 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={rejectMutation.isPending}
              onClick={reject}
              className="rounded-lg bg-danger px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
            >
              {rejectMutation.isPending ? "..." : "Confirm reject"}
            </button>
            <button type="button" onClick={() => setCorrecting(false)} className="rounded-lg border border-line px-2 py-1 text-xs font-bold text-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      {correcting === true && (
        <div className="mt-2 space-y-1.5">
          <input
            value={correctedValue}
            onChange={(event) => setCorrectedValue(event.target.value)}
            placeholder="Corrected value"
            className="h-9 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none"
          />
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason (required)"
            className="h-9 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={correctMutation.isPending}
              onClick={correct}
              className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
            >
              {correctMutation.isPending ? "..." : "Save correction"}
            </button>
            <button type="button" onClick={() => setCorrecting(false)} className="rounded-lg border border-line px-2 py-1 text-xs font-bold text-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <div className="mt-2 text-xs text-danger">{error}</div>}
    </div>
  );
}

// Extraction is scoped to ONE selected document. Runs poll automatically while Pending/Running (the
// backend's durable worker moves them; this only re-reads state) and stop once terminal.
export function ExtractionPanel({ registrationId, documentId, permissions }) {
  const [selectedRunId, setSelectedRunId] = useState(null);
  const runsQuery = useExtractionRuns(registrationId, documentId, permissions.canViewExtractions);
  const triggerMutation = useTriggerExtraction(registrationId, documentId);
  const valuesQuery = useExtractedValues(registrationId, documentId, selectedRunId, Boolean(selectedRunId));
  const [error, setError] = useState("");

  if (!documentId) {
    return <EmptyState title="Select a document" message="Choose a document above to see its extraction runs." />;
  }
  if (!permissions.canViewExtractions) return null;

  const trigger = async (force) => {
    setError("");
    try {
      const result = await triggerMutation.mutateAsync({ force });
      setSelectedRunId(result.run.id);
    } catch (triggerError) {
      setError(getErrorMessage(triggerError));
    }
  };

  const runs = runsQuery.data || [];

  return (
    <div className="space-y-3">
      {permissions.canTriggerExtraction && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={triggerMutation.isPending}
            onClick={() => trigger(false)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlayCircle size={13} /> {triggerMutation.isPending ? "Queuing..." : "Run extraction"}
          </button>
          {runs.length > 0 && (
            <button
              type="button"
              disabled={triggerMutation.isPending}
              onClick={() => trigger(true)}
              title="Starts a new run even if an identical one already exists"
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-ink hover:border-accent-line"
            >
              Force new run
            </button>
          )}
        </div>
      )}
      {error && <div className="rounded-xl border border-danger bg-danger-soft p-2 text-sm text-danger">{error}</div>}

      {runsQuery.isLoading && <LoadingState label="Loading extraction runs..." />}
      {runsQuery.isError && <ErrorState title="Unable to load extraction runs" message={getErrorMessage(runsQuery.error)} />}
      {!runsQuery.isLoading && !runsQuery.isError && runs.length === 0 && (
        <EmptyState title="No extraction runs yet" message="Run extraction to get suggested field values from this document." />
      )}
      {!runsQuery.isLoading && !runsQuery.isError && runs.length > 0 && (
        <div className="space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              onClick={() => setSelectedRunId(run.id)}
              className={`cursor-pointer rounded-xl border p-2.5 text-sm transition ${
                selectedRunId === run.id ? "border-accent-line bg-accent-soft" : "border-line bg-raised hover:border-accent-line"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-ink">{run.providerName}</span>{" "}
                  <span className="text-subtle">v{run.providerVersion}</span>
                  <span className="ms-2 text-xs text-subtle">{formatDateTime(run.createdAtUtc)}</span>
                </div>
                <ExtractionRunStatusBadge status={run.status} />
              </div>
              {run.status === "Failed" && run.failureCategory && (
                <div className="mt-1 text-xs text-danger">
                  Failure: {run.failureCategory} {run.failureCode ? `(${run.failureCode})` : ""}
                </div>
              )}
              {run.status === "Succeeded" && (
                <div className="mt-1 text-xs text-subtle">
                  {run.valueCount} suggestion(s), {run.problemCount} problem(s)
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedRunId && (
        <div className="space-y-2 border-t border-line pt-3">
          <h3 className="text-sm font-bold text-muted">Suggested values</h3>
          {valuesQuery.isLoading && <LoadingState label="Loading suggested values..." />}
          {valuesQuery.isError && <ErrorState title="Unable to load suggested values" message={getErrorMessage(valuesQuery.error)} />}
          {!valuesQuery.isLoading && !valuesQuery.isError && (valuesQuery.data || []).length === 0 && (
            <EmptyState title="No suggestions" message="This run produced no suggested values." />
          )}
          {(valuesQuery.data || []).map((value) => (
            <ExtractedValueRow
              key={value.id}
              registrationId={registrationId}
              documentId={documentId}
              runId={selectedRunId}
              value={value}
              canReview={permissions.canReviewFields}
            />
          ))}
        </div>
      )}
    </div>
  );
}
