import { StatusBadge } from "../../../shared/components/ui";

// Every tone map covers the REAL, verbatim backend enum values only -- no status is renamed, merged
// or invented (see src/features/registrations/components/RegistrationBadges.jsx for the identical
// platform-side badges; this is the applicant-persona's own copy).

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

const FIELD_STATUS_TONE = { Empty: "neutral", Suggested: "warning", ReviewRequired: "info", Confirmed: "success", Corrected: "success" };

export function FieldStatusBadge({ status }) {
  return <StatusBadge tone={FIELD_STATUS_TONE[status] || "neutral"}>{status}</StatusBadge>;
}
