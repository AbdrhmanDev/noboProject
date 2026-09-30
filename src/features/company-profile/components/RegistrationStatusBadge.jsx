import { StatusBadge } from "../../../shared/components/ui";

// Nobo.Domain.CustomerRegistration.RegistrationStatus, verbatim -- no status is invented, renamed or
// merged with another.
const TONE = {
  Draft: "neutral",
  Submitted: "info",
  UnderReview: "info",
  NeedsMoreInformation: "warning",
  Approved: "success",
  Rejected: "danger",
  Cancelled: "neutral",
};

export function RegistrationStatusBadge({ status }) {
  return <StatusBadge tone={TONE[status] || "neutral"}>{status}</StatusBadge>;
}
