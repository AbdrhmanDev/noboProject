import { httpClient } from "../../../shared/api/httpClient";
import type {
  ApproveRegistrationRequest,
  ApproveRegistrationResult,
  CorrectExtractedValueRequest,
  EditFieldRequest,
  ExtractedValueReviewResult,
  ExtractionRun,
  ExtractedValue,
  RegistrationDocument,
  RegistrationHistory,
  RegistrationListFilters,
  RegistrationSummary,
  RegistrationView,
  RejectDocumentRequest,
  RejectExtractedValueRequest,
  RejectRegistrationRequest,
  RequestInformationRequest,
  ReviewDocumentRequest,
  TriggerExtractionRequest,
  TriggerExtractionResponse,
} from "../types/registration.types";

// Every route below is one of the real Nobo.Api.CustomerRegistration.PlatformRegistrationEndpoints
// routes -- no route, verb or body shape is invented; see that file (read-only) for the exact match.
const BASE = "/api/platform/registrations";

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export async function listRegistrations(filters: RegistrationListFilters = {}) {
  const response = await httpClient.get<RegistrationSummary[]>(`${BASE}/`, { params: compactParams(filters) });
  return response.data;
}

export async function getRegistration(registrationId: string) {
  const response = await httpClient.get<RegistrationView>(`${BASE}/${registrationId}`);
  return response.data;
}

export async function claimRegistration(registrationId: string) {
  const response = await httpClient.post<RegistrationView>(`${BASE}/${registrationId}/claim`, {});
  return response.data;
}

export async function editRegistrationField(registrationId: string, fieldKey: string, payload: EditFieldRequest) {
  const response = await httpClient.put<RegistrationView>(
    `${BASE}/${registrationId}/fields/${encodeURIComponent(fieldKey)}`,
    payload,
  );
  return response.data;
}

export async function confirmRegistrationField(registrationId: string, fieldKey: string) {
  const response = await httpClient.post<RegistrationView>(
    `${BASE}/${registrationId}/fields/${encodeURIComponent(fieldKey)}/confirm`,
    {},
  );
  return response.data;
}

export async function requestRegistrationInformation(registrationId: string, payload: RequestInformationRequest) {
  const response = await httpClient.post<RegistrationView>(`${BASE}/${registrationId}/information-requests`, payload);
  return response.data;
}

export async function approveRegistration(registrationId: string, payload: ApproveRegistrationRequest) {
  const response = await httpClient.post<ApproveRegistrationResult>(`${BASE}/${registrationId}/approve`, payload);
  return response.data;
}

export async function rejectRegistration(registrationId: string, payload: RejectRegistrationRequest) {
  const response = await httpClient.post<RegistrationView>(`${BASE}/${registrationId}/reject`, payload);
  return response.data;
}

export async function getRegistrationHistory(registrationId: string) {
  const response = await httpClient.get<RegistrationHistory>(`${BASE}/${registrationId}/history`);
  return response.data;
}

// ---------------------------------------------------------------------------------------- documents

export async function listRegistrationDocuments(registrationId: string) {
  const response = await httpClient.get<RegistrationDocument[]>(`${BASE}/${registrationId}/documents`);
  return response.data;
}

export async function getRegistrationDocument(registrationId: string, documentId: string) {
  const response = await httpClient.get<RegistrationDocument>(`${BASE}/${registrationId}/documents/${documentId}`);
  return response.data;
}

// Streams the stored original as an attachment (never a URL) -- the caller triggers a browser save
// from the returned Blob. There is no preview endpoint (see the implementation report's gap list).
export async function downloadRegistrationDocument(registrationId: string, documentId: string) {
  const response = await httpClient.get(`${BASE}/${registrationId}/documents/${documentId}/content`, {
    responseType: "blob",
  });
  return response.data as Blob;
}

export async function reviewRegistrationDocument(registrationId: string, documentId: string, payload: ReviewDocumentRequest) {
  const response = await httpClient.post<RegistrationDocument>(
    `${BASE}/${registrationId}/documents/${documentId}/review`,
    payload,
  );
  return response.data;
}

export async function rejectRegistrationDocument(registrationId: string, documentId: string, payload: RejectDocumentRequest) {
  const response = await httpClient.post<RegistrationDocument>(
    `${BASE}/${registrationId}/documents/${documentId}/reject`,
    payload,
  );
  return response.data;
}

// Body per the real contract: text field `documentType` FIRST, file part LAST (multipart/form-data).
export async function uploadRegistrationDocument(registrationId: string, documentType: string, file: File) {
  const form = new FormData();
  form.append("documentType", documentType);
  form.append("file", file);
  const response = await httpClient.post<RegistrationDocument>(`${BASE}/${registrationId}/documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// Creates a NEW document that supersedes this one (file part only) -- the old row/file stay as history.
export async function replaceRegistrationDocument(registrationId: string, documentId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await httpClient.post<RegistrationDocument>(
    `${BASE}/${registrationId}/documents/${documentId}/replace`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

// ---------------------------------------------------------------------------------------- extraction

export async function triggerExtraction(registrationId: string, documentId: string, payload: TriggerExtractionRequest = {}) {
  const response = await httpClient.post<TriggerExtractionResponse>(
    `${BASE}/${registrationId}/documents/${documentId}/extract`,
    payload,
  );
  return response.data;
}

export async function listExtractionRuns(registrationId: string, documentId: string) {
  const response = await httpClient.get<ExtractionRun[]>(`${BASE}/${registrationId}/documents/${documentId}/extractions`);
  return response.data;
}

export async function getExtractionRun(registrationId: string, documentId: string, runId: string) {
  const response = await httpClient.get<ExtractionRun>(
    `${BASE}/${registrationId}/documents/${documentId}/extractions/${runId}`,
  );
  return response.data;
}

export async function getExtractedValues(registrationId: string, documentId: string, runId: string) {
  const response = await httpClient.get<ExtractedValue[]>(
    `${BASE}/${registrationId}/documents/${documentId}/extractions/${runId}/values`,
  );
  return response.data;
}

function valueUrl(registrationId: string, documentId: string, runId: string, valueId: string) {
  return `${BASE}/${registrationId}/documents/${documentId}/extractions/${runId}/values/${valueId}`;
}

export async function confirmExtractedValue(registrationId: string, documentId: string, runId: string, valueId: string) {
  const response = await httpClient.post<ExtractedValueReviewResult>(`${valueUrl(registrationId, documentId, runId, valueId)}/confirm`, {});
  return response.data;
}

export async function correctExtractedValue(
  registrationId: string,
  documentId: string,
  runId: string,
  valueId: string,
  payload: CorrectExtractedValueRequest,
) {
  const response = await httpClient.post<ExtractedValueReviewResult>(
    `${valueUrl(registrationId, documentId, runId, valueId)}/correct`,
    payload,
  );
  return response.data;
}

export async function rejectExtractedValue(
  registrationId: string,
  documentId: string,
  runId: string,
  valueId: string,
  payload: RejectExtractedValueRequest,
) {
  const response = await httpClient.post<ExtractedValueReviewResult>(
    `${valueUrl(registrationId, documentId, runId, valueId)}/reject`,
    payload,
  );
  return response.data;
}
