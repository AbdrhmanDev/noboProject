// Mirrors, verified against real backend source (read-only):
//   Nobo.Api.CustomerRegistration.{RegistrationEndpointContracts,PlatformRegistrationEndpoints}
//   Nobo.Domain.CustomerRegistration.{RegistrationEnums,RegistrationDocument}
//   Nobo.Domain.CustomerRegistration.Extraction.{ExtractionModels}
//   Nobo.Application.CustomerRegistration.Extraction.ExtractedValueReviewHandlers (ExtractedValueReviewDecision)
// This is the SUPPORT/platform persona's view of a registration -- broader than the company-side
// amendment view in src/features/company-profile (which only ever sees its own company's amendment).
// The two features intentionally keep separate type copies of the same wire shapes: they serve
// different personas/route groups and this avoids a cross-feature coupling neither needs.

export type RegistrationKind = "Initial" | "Amendment";
export type RegistrationStatus = "Draft" | "Submitted" | "UnderReview" | "NeedsMoreInformation" | "Approved" | "Rejected" | "Cancelled";
export type RegistrationFieldStatus = "Empty" | "Suggested" | "ReviewRequired" | "Confirmed" | "Corrected";
export type InformationRequestStatus = "Open" | "Responded" | "Closed";

// Nobo.Domain.CustomerRegistration.RegistrationDocumentType
export type RegistrationDocumentType = "CommercialRegistration" | "VatCertificate" | "NationalAddress" | "BankLetter" | "Identification" | "Other";
export type RegistrationDocumentUploadSource = "Customer" | "Support";
export type RegistrationDocumentReviewStatus = "Pending" | "Reviewed" | "Rejected";
export type RegistrationDocumentExtractionStatus = "NotRequested" | "Queued" | "InProgress" | "Completed" | "Failed" | "NotExtractable";

// Nobo.Domain.CustomerRegistration.Extraction.RegistrationExtractionRunStatus
export type ExtractionRunStatus = "Pending" | "Running" | "Succeeded" | "Failed" | "Cancelled";
// Nobo.Application.CustomerRegistration.Extraction.ExtractedValueReviewDecision
export type ExtractedValueReviewDecision = "Pending" | "Confirmed" | "Corrected" | "Rejected";
// Nobo.Domain.CustomerRegistration.Extraction.ExtractionFailureCategory -- a COARSE, safe category
// only; never a provider message, never document content (verified by the domain's own comment).
export type ExtractionFailureCategory =
  | "NotConfigured"
  | "UnsupportedFormat"
  | "OcrNotConfigured"
  | "ReadFailed"
  | "StorageUnavailable"
  | "ExtractorFailed"
  | "Internal";

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

export type RegistrationProposedBranch = {
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

// GET /api/platform/registrations/{id} -- RegistrationResponse.
export type RegistrationView = {
  id: string;
  reference: string;
  kind: RegistrationKind;
  status: RegistrationStatus;
  applicantUserId: string;
  companyId: string | null;
  assignedReviewerUserId: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  submittedAtUtc: string | null;
  decidedAtUtc: string | null;
  decisionReason: string | null;
  fields: RegistrationField[];
  proposedBranches: RegistrationProposedBranch[];
  informationRequests: InformationRequest[];
  targetCompanyId: string | null;
  baseProfileVersionId: string | null;
};

// GET /api/platform/registrations (the work queue) -- RegistrationSummaryResponse. No total count is
// returned (see the implementation report's gap list) -- callers page blind (next/previous only).
export type RegistrationSummary = {
  id: string;
  reference: string;
  kind: RegistrationKind;
  status: RegistrationStatus;
  applicantUserId: string;
  assignedReviewerUserId: string | null;
  legalName: string | null;
  companyId: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  submittedAtUtc: string | null;
};

export type RegistrationListFilters = {
  status?: RegistrationStatus | "";
  kind?: RegistrationKind | "";
  page?: number;
  pageSize?: number;
};

// Mirrors ListRegistrationsHandler.MaxPageSize exactly (verified in source) -- a real backend
// constraint (400 Registration.InvalidPaging above it), not a frontend-invented limit.
export const REGISTRATION_LIST_MAX_PAGE_SIZE = 100;

export type EditFieldRequest = { value: string | null; reason: string | null };

export type InformationItemRequest = { fieldKey: string | null; item: string | null; message: string };
export type RequestInformationRequest = { items: InformationItemRequest[] };

export type ApproveRegistrationRequest = { note: string | null };
export type RejectRegistrationRequest = { reason: string };

export type ApproveRegistrationResult = {
  registrationId: string;
  companyId: string;
  profileVersionId: string;
  profileVersionNumber: number;
  ownerMembershipId: string | null;
};

// GET /api/platform/registrations/{id}/history -- Platform.Registrations.ViewHistory only. There is
// no company-side equivalent (see the implementation report).
export type RegistrationEvent = {
  id: string;
  type: string;
  previousStatus: string | null;
  newStatus: string | null;
  actorUserId: string | null;
  actorKind: "Applicant" | "Support" | "System";
  occurredAtUtc: string;
  note: string | null;
  fieldKey: string | null;
  revisionId: string | null;
  informationRequestId: string | null;
  companyId: string | null;
  documentId: string | null;
  extractedValueId: string | null;
};

export type RegistrationRevision = {
  id: string;
  fieldKey: string;
  value: string | null;
  replacedValue: string | null;
  origin: "CustomerSubmitted" | "Extracted" | "SupportEntered" | "SupportCorrected" | "Baseline";
  sourceDocumentId: string | null;
  extractionRunId: string | null;
  sourceLocator: string | null;
  actorUserId: string | null;
  occurredAtUtc: string;
  reason: string | null;
  resultingStatus: RegistrationFieldStatus;
  extractedValueId: string | null;
};

export type RegistrationHistory = {
  events: RegistrationEvent[];
  revisions: RegistrationRevision[];
};

// ---------------------------------------------------------------------------------------- documents

export type ReviewDocumentRequest = { note: string | null };
export type RejectDocumentRequest = { reason: string };

// Metadata only -- never the storage reference, a URL or content (verified: the backend's own
// comment on RegistrationDocumentResponse says so explicitly).
export type RegistrationDocument = {
  id: string;
  registrationId: string;
  documentType: RegistrationDocumentType;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  uploadedByUserId: string;
  uploadSource: RegistrationDocumentUploadSource;
  uploadedAtUtc: string;
  reviewStatus: RegistrationDocumentReviewStatus;
  reviewedByUserId: string | null;
  reviewedAtUtc: string | null;
  reviewNote: string | null;
  supersedesDocumentId: string | null;
  isSuperseded: boolean;
  extractionStatus: RegistrationDocumentExtractionStatus;
};

// ---------------------------------------------------------------------------------------- extraction

export type TriggerExtractionRequest = { force?: boolean };

export type ExtractionRun = {
  id: string;
  registrationId: string;
  documentId: string;
  providerName: string;
  providerVersion: string;
  schemaVersion: string;
  contentSource: string | null;
  status: ExtractionRunStatus;
  requestedByUserId: string;
  createdAtUtc: string;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  durationMs: number | null;
  failureCategory: ExtractionFailureCategory | null;
  failureCode: string | null;
  valueCount: number;
  problemCount: number;
};

export type TriggerExtractionResponse = {
  run: ExtractionRun;
  reused: boolean;
  extractionStatus: RegistrationDocumentExtractionStatus;
};

export type ExtractionLocator = {
  kind: string;
  page: number | null;
  line: number | null;
  sheet: string | null;
  cell: string | null;
  range: string | null;
  paragraph: number | null;
  table: number | null;
  row: number | null;
  column: number | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
};

export type ExtractedValue = {
  id: string;
  extractionRunId: string;
  fieldKey: string;
  rawText: string;
  normalizedValue: string | null;
  confidence: number;
  locator: ExtractionLocator | null;
  warnings: string[];
  createdAtUtc: string;
  reviewDecision: ExtractedValueReviewDecision;
};

export type CorrectExtractedValueRequest = { value: string | null; reason: string | null };
export type RejectExtractedValueRequest = { reason: string | null };

export type ExtractedValueReviewResult = {
  extractedValueId: string;
  extractionRunId: string;
  documentId: string;
  decision: ExtractedValueReviewDecision;
  field: RegistrationField;
  revisionId: string | null;
  confirmedRevisionId: string | null;
};
