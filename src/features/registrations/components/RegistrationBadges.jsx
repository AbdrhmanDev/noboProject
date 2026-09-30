import { StatusBadge } from "../../../shared/components/ui";

// Every tone map below covers the REAL, verbatim backend enum values only (Nobo.Domain source) --
// no status is renamed, merged or invented.

const REGISTRATION_STATUS_TONE = {
  Draft: "neutral",
  Submitted: "info",
  UnderReview: "info",
  NeedsMoreInformation: "warning",
  Approved: "success",
  Rejected: "danger",
  Cancelled: "neutral",
};

export function RegistrationStatusBadge({ status }) {
  return <StatusBadge tone={REGISTRATION_STATUS_TONE[status] || "neutral"}>{status}</StatusBadge>;
}

const DOCUMENT_REVIEW_TONE = { Pending: "warning", Reviewed: "success", Rejected: "danger" };

export function DocumentReviewStatusBadge({ status }) {
  return <StatusBadge tone={DOCUMENT_REVIEW_TONE[status] || "neutral"}>{status}</StatusBadge>;
}

const DOCUMENT_EXTRACTION_TONE = {
  NotRequested: "neutral",
  Queued: "info",
  InProgress: "info",
  Completed: "success",
  Failed: "danger",
  NotExtractable: "neutral",
};

export function DocumentExtractionStatusBadge({ status }) {
  return <StatusBadge tone={DOCUMENT_EXTRACTION_TONE[status] || "neutral"}>{status}</StatusBadge>;
}

const RUN_STATUS_TONE = { Pending: "info", Running: "info", Succeeded: "success", Failed: "danger", Cancelled: "neutral" };

export function ExtractionRunStatusBadge({ status }) {
  return <StatusBadge tone={RUN_STATUS_TONE[status] || "neutral"}>{status}</StatusBadge>;
}

// Pending is deliberately shown as "warning", never "success" -- an extraction suggestion is NEVER
// verified until a person decides (see the domain's own comment: "extraction is only ever a
// suggestion"). Only Confirmed/Corrected (a person's explicit decision) is "success".
const REVIEW_DECISION_TONE = { Pending: "warning", Confirmed: "success", Corrected: "success", Rejected: "danger" };

export function ExtractedValueDecisionBadge({ decision }) {
  return <StatusBadge tone={REVIEW_DECISION_TONE[decision] || "neutral"}>{decision}</StatusBadge>;
}
