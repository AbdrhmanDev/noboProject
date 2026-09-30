import { httpClient } from "../../../shared/api/httpClient";
import type {
  AmendmentDetail,
  AmendmentSummary,
  CancelRegistrationRequest,
  RegistrationView,
  RespondToInformationRequestRequest,
  SaveDraftRequest,
} from "../types/amendment.types";

// Company-scoped amendment routes (Nobo.Api.Companies.CompanyProfileEndpoints): create/list/get only.
// Company owner only (backend-enforced by membership, not a permission string -- see the type file's
// own comment); this app mirrors that by checking the caller's EffectivePermissions.isOwner, never a
// permission constant that does not exist.

export async function listAmendments(companyId: string) {
  const response = await httpClient.get<AmendmentSummary[]>(`/api/companies/${companyId}/profile/amendments`);
  return response.data;
}

export async function createAmendment(companyId: string) {
  const response = await httpClient.post<AmendmentSummary>(`/api/companies/${companyId}/profile/amendments`, {});
  return response.data;
}

export async function getAmendment(companyId: string, registrationId: string) {
  const response = await httpClient.get<AmendmentDetail>(`/api/companies/${companyId}/profile/amendments/${registrationId}`);
  return response.data;
}

// Generic registration routes (Nobo.Api.CustomerRegistration.CustomerRegistrationEndpoints):
// an amendment's own id IS a registration id, so editing/submitting/cancelling/responding all go
// through these SAME routes -- there is no amendment-specific write endpoint.

export async function updateRegistrationDraft(registrationId: string, payload: SaveDraftRequest) {
  const response = await httpClient.put<RegistrationView>(`/api/registrations/${registrationId}/draft`, payload);
  return response.data;
}

export async function submitRegistration(registrationId: string) {
  const response = await httpClient.post<RegistrationView>(`/api/registrations/${registrationId}/submit`, {});
  return response.data;
}

export async function cancelRegistration(registrationId: string, payload: CancelRegistrationRequest = {}) {
  const response = await httpClient.post<RegistrationView>(`/api/registrations/${registrationId}/cancel`, payload);
  return response.data;
}

export async function respondToInformationRequest(
  registrationId: string,
  informationRequestId: string,
  payload: RespondToInformationRequestRequest,
) {
  const response = await httpClient.post<RegistrationView>(
    `/api/registrations/${registrationId}/information-requests/${informationRequestId}/respond`,
    payload,
  );
  return response.data;
}
