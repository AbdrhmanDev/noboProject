// Mirrors, verified against real backend source (read-only):
//   Nobo.Api.Companies.CompanyProfileEndpoints (AmendmentResponse / AmendmentDetailResponse)
//   Nobo.Api.CustomerRegistration.{RegistrationEndpointContracts,CustomerRegistrationEndpoints}
//   Nobo.Domain.CustomerRegistration.RegistrationEnums (the actual status/kind/field-status values)
//
// An amendment IS a RegistrationRequest of Kind = "Amendment" (P8.5.3): its own edit/submit/cancel/
// respond actions reuse the SAME generic /api/registrations/{id}/... routes as any other
// registration. There is no separate "amendment update" endpoint.

// Nobo.Domain.CustomerRegistration.RegistrationKind
export type RegistrationKind = "Initial" | "Amendment";

// Nobo.Domain.CustomerRegistration.RegistrationStatus
export type RegistrationStatus = "Draft" | "Submitted" | "UnderReview" | "NeedsMoreInformation" | "Approved" | "Rejected" | "Cancelled";

// Nobo.Domain.CustomerRegistration.RegistrationFieldStatus
export type RegistrationFieldStatus = "Empty" | "Suggested" | "ReviewRequired" | "Confirmed" | "Corrected";

// Nobo.Domain.CustomerRegistration.InformationRequestStatus
export type InformationRequestStatus = "Open" | "Responded" | "Closed";

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

// The SAME proposed-branch shape the registration draft accepts/returns (Nobo.Api.CustomerRegistration.ProposedBranchRequest) --
// read-only display here; amendments do not change proposed branches through this UI.
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

// The FULL registration view (RegistrationResponse) -- what GET /api/registrations/{id} and the
// amendment detail's own Registration both return.
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
  // The approved profile VERSION this amendment started from (Nobo.Domain, BaseProfileVersionId).
  // Null for an Initial registration (there is no prior version to amend from).
  baseProfileVersionId: string | null;
};

// Nobo.Api.Companies.CompanyProfileEndpoints.AmendmentResponse
export type AmendmentSummary = {
  id: string;
  reference: string;
  kind: RegistrationKind;
  status: RegistrationStatus;
  targetCompanyId: string;
  baseProfileVersionNumber: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  submittedAtUtc: string | null;
  decidedAtUtc: string | null;
};

export type AmendmentDetail = {
  amendment: AmendmentSummary;
  registration: RegistrationView;
};

// PUT /api/registrations/{id}/draft body -- values keyed by the registration's OWN field keys
// (Dictionary<string,string?> on the backend). Never invented keys; only ones already present on
// the registration's own `fields` list are ever sent back.
export type SaveDraftRequest = {
  values?: Record<string, string | null> | null;
};

export type RespondToInformationRequestRequest = {
  message: string;
  values?: Record<string, string | null> | null;
};

export type CancelRegistrationRequest = {
  reason?: string | null;
};
