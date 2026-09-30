// Mirrors, verified against real backend source (read-only):
//   Nobo.Api.CustomerRegistration.{RegistrationEndpointContracts,CustomerRegistrationEndpoints}
//   Nobo.Application.CustomerRegistration.{ApplicantHandlers,RegistrationContracts}
//   Nobo.Domain.CustomerRegistration.RegistrationEnums
// This is the APPLICANT'S OWN view of a registration -- forApplicant: true in
// RegistrationSupport.ToView, verified in source: identical to the platform reviewer's view except
// assignedReviewerUserId is always null (an applicant never learns who their reviewer is). Kept as a
// separate type copy from src/features/registrations (platform persona) and
// src/features/company-profile (company-owner amendment persona) on purpose -- three different
// personas/route groups reading the same wire shape, not one shared model.

export type RegistrationKind = "Initial" | "Amendment";
export type RegistrationStatus = "Draft" | "Submitted" | "UnderReview" | "NeedsMoreInformation" | "Approved" | "Rejected" | "Cancelled";
export type RegistrationFieldStatus = "Empty" | "Suggested" | "ReviewRequired" | "Confirmed" | "Corrected";
export type InformationRequestStatus = "Open" | "Responded" | "Closed";

export type RegistrationDocumentType = "CommercialRegistration" | "VatCertificate" | "NationalAddress" | "BankLetter" | "Identification" | "Other";
export type RegistrationDocumentReviewStatus = "Pending" | "Reviewed" | "Rejected";
export type RegistrationDocumentExtractionStatus = "NotRequested" | "Queued" | "InProgress" | "Completed" | "Failed" | "NotExtractable";

export type RegistrationField = {
  key: string;
  group: string;
  value: string | null;
  status: RegistrationFieldStatus;
  requiredForApproval: boolean;
  updatedAtUtc: string;
};

export type InformationRequest = {
  id: string;
  requestedFieldKey: string | null;
  requestedItem: string | null;
  message: string;
  status: InformationRequestStatus;
  createdAtUtc: string;
  responseMessage: string | null;
  respondedAtUtc: string | null;
};

// Nobo.Api.CustomerRegistration.ProposedBranchRequest -- the SAME shape both sent (create/update
// draft) and returned (on the registration view).
export type ProposedBranch = {
  name: string;
  code: string | null;
  phoneNumber: string | null;
  countryCode: string;
  city: string;
  district: string | null;
  street: string | null;
  buildingNumber: string | null;
  postalCode: string | null;
};

export type RegistrationView = {
  id: string;
  reference: string;
  kind: RegistrationKind;
  status: RegistrationStatus;
  applicantUserId: string;
  companyId: string | null;
  assignedReviewerUserId: null; // always null for the applicant's own view (verified in source)
  createdAtUtc: string;
  updatedAtUtc: string;
  submittedAtUtc: string | null;
  decidedAtUtc: string | null;
  decisionReason: string | null;
  fields: RegistrationField[];
  proposedBranches: ProposedBranch[];
  informationRequests: InformationRequest[];
  targetCompanyId: string | null;
  baseProfileVersionId: string | null;
};

// POST /api/registrations/ body -- Values keyed by the SAME field keys `fields[].key` already uses.
export type SaveDraftRequest = {
  values?: Record<string, string | null> | null;
  proposedBranches?: ProposedBranch[] | null;
};

export type RespondToInformationRequestRequest = {
  message: string;
  values?: Record<string, string | null> | null;
};

export type CancelRegistrationRequest = {
  reason?: string | null;
};

// Metadata only -- never the storage reference, a URL or content.
export type RegistrationDocument = {
  id: string;
  registrationId: string;
  documentType: RegistrationDocumentType;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  uploadedByUserId: string;
  uploadSource: "Customer" | "Support";
  uploadedAtUtc: string;
  reviewStatus: RegistrationDocumentReviewStatus;
  reviewedByUserId: string | null;
  reviewedAtUtc: string | null;
  reviewNote: string | null;
  supersedesDocumentId: string | null;
  isSuperseded: boolean;
  extractionStatus: RegistrationDocumentExtractionStatus;
};

export const REGISTRATION_DOCUMENT_TYPES: RegistrationDocumentType[] = [
  "CommercialRegistration",
  "VatCertificate",
  "NationalAddress",
  "BankLetter",
  "Identification",
  "Other",
];
