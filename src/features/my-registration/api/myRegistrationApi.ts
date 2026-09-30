import { httpClient } from "../../../shared/api/httpClient";
import type {
  CancelRegistrationRequest,
  RegistrationDocument,
  RegistrationView,
  RespondToInformationRequestRequest,
  SaveDraftRequest,
} from "../types/registration.types";

// Every route below is one of the real Nobo.Api.CustomerRegistration.CustomerRegistrationEndpoints
// routes (base "/api/registrations") -- the APPLICANT'S OWN persona, verified against source. It is
// a DIFFERENT route group from "/api/platform/registrations" (Support/reviewer) and from
// "/api/companies/{companyId}/profile/amendments" (company-owner amendments): no cross-persona reuse.
const BASE = "/api/registrations";

export async function createRegistrationDraft(payload: SaveDraftRequest = {}) {
  const response = await httpClient.post<RegistrationView>(`${BASE}/`, payload);
  return response.data;
}

// registrationId omitted -> the applicant's most recent request (GET /mine).
export async function getMyLatestRegistration() {
  const response = await httpClient.get<RegistrationView>(`${BASE}/mine`);
  return response.data;
}

export async function getMyRegistration(registrationId: string) {
  const response = await httpClient.get<RegistrationView>(`${BASE}/${registrationId}`);
  return response.data;
}

export async function updateRegistrationDraft(registrationId: string, payload: SaveDraftRequest) {
  const response = await httpClient.put<RegistrationView>(`${BASE}/${registrationId}/draft`, payload);
  return response.data;
}

export async function submitRegistration(registrationId: string) {
  const response = await httpClient.post<RegistrationView>(`${BASE}/${registrationId}/submit`, {});
  return response.data;
}

export async function cancelRegistration(registrationId: string, payload: CancelRegistrationRequest = {}) {
  const response = await httpClient.post<RegistrationView>(`${BASE}/${registrationId}/cancel`, payload);
  return response.data;
}

// POST .../reopen -- Cancelled -> Draft, same registration id, no body (ReopenRegistrationCommand
// carries only the id, exactly like submit). Verified against Nobo.Api.CustomerRegistration
// .CustomerRegistrationEndpoints.ReopenAsync / Nobo.Application.CustomerRegistration
// .ApplicantHandlers.ReopenRegistrationHandler.
export async function reopenRegistration(registrationId: string) {
  const response = await httpClient.post<RegistrationView>(`${BASE}/${registrationId}/reopen`, {});
  return response.data;
}

export async function respondToInformationRequest(
  registrationId: string,
  informationRequestId: string,
  payload: RespondToInformationRequestRequest,
) {
  const response = await httpClient.post<RegistrationView>(
    `${BASE}/${registrationId}/information-requests/${informationRequestId}/respond`,
    payload,
  );
  return response.data;
}

// ---------------------------------------------------------------------------------------- documents
//
// Applicant side supports Upload/List/Get/Download ONLY -- there is no Replace or Remove/Delete route
// for the applicant (Replace exists ONLY under /api/platform/registrations/.../replace, Support-only;
// verified in PlatformRegistrationEndpoints.cs). Uploading again simply adds another document row;
// nothing removes or supersedes an earlier one from this side.

export async function listMyRegistrationDocuments(registrationId: string) {
  const response = await httpClient.get<RegistrationDocument[]>(`${BASE}/${registrationId}/documents`);
  return response.data;
}

export async function getMyRegistrationDocument(registrationId: string, documentId: string) {
  const response = await httpClient.get<RegistrationDocument>(`${BASE}/${registrationId}/documents/${documentId}`);
  return response.data;
}

export async function downloadMyRegistrationDocument(registrationId: string, documentId: string) {
  const response = await httpClient.get(`${BASE}/${registrationId}/documents/${documentId}/content`, {
    responseType: "blob",
  });
  return response.data as Blob;
}

// Body per the real contract: text field `documentType` FIRST, optional `supersedesDocumentId`, file
// part LAST (multipart/form-data).
export async function uploadMyRegistrationDocument(registrationId: string, documentType: string, file: File) {
  const form = new FormData();
  form.append("documentType", documentType);
  form.append("file", file);
  const response = await httpClient.post<RegistrationDocument>(`${BASE}/${registrationId}/documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
