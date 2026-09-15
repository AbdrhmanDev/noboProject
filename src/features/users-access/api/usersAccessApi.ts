import { httpClient } from "../../../shared/api/httpClient";
import type {
  AcceptInvitationResponse,
  AdminBranch,
  AssignMembershipRolesRequest,
  CompanyInvitation,
  CompanyInvitationPreview,
  CompanyMembership,
  CompanyRole,
  CreateInvitationRequest,
  CreateRoleRequest,
  InvitationMutationResponse,
  PagedInvitations,
  PagedMemberships,
  UpdateInvitationRequest,
  UpdateMembershipBranchAccessRequest,
  UpdateRoleRequest,
} from "../types/usersAccess.types";

export async function getCompanyMemberships(
  companyId: string,
  params: { status?: string; search?: string; pageNumber?: number; pageSize?: number },
) {
  const response = await httpClient.get<PagedMemberships>(`/api/companies/${companyId}/memberships`, {
    params,
  });
  return response.data;
}

export async function getCompanyMembership(companyId: string, membershipId: string) {
  const response = await httpClient.get<CompanyMembership>(
    `/api/companies/${companyId}/memberships/${membershipId}`,
  );
  return response.data;
}

export async function assignMembershipRoles(
  companyId: string,
  membershipId: string,
  payload: AssignMembershipRolesRequest,
) {
  const response = await httpClient.put(
    `/api/companies/${companyId}/memberships/${membershipId}/roles`,
    payload,
  );
  return response.data;
}

export async function updateMembershipBranchAccess(
  companyId: string,
  membershipId: string,
  payload: UpdateMembershipBranchAccessRequest,
) {
  const response = await httpClient.put(
    `/api/companies/${companyId}/memberships/${membershipId}/branch-access`,
    payload,
  );
  return response.data;
}

export async function changeMembershipStatus(
  companyId: string,
  membershipId: string,
  action: "suspend" | "activate" | "revoke",
) {
  const response = await httpClient.post(
    `/api/companies/${companyId}/memberships/${membershipId}/${action}`,
  );
  return response.data;
}

export async function getCompanyRoles(companyId: string) {
  const response = await httpClient.get<CompanyRole[]>(`/api/companies/${companyId}/roles`);
  return response.data;
}

export async function createCompanyRole(companyId: string, payload: CreateRoleRequest) {
  const response = await httpClient.post<CompanyRole>(`/api/companies/${companyId}/roles`, payload);
  return response.data;
}

export async function updateCompanyRole(companyId: string, roleId: string, payload: UpdateRoleRequest) {
  const response = await httpClient.put<CompanyRole>(
    `/api/companies/${companyId}/roles/${roleId}`,
    payload,
  );
  return response.data;
}

export async function getCompanyInvitations(
  companyId: string,
  params: { status?: string; search?: string; pageNumber?: number; pageSize?: number },
) {
  const response = await httpClient.get<PagedInvitations>(`/api/companies/${companyId}/invitations`, {
    params,
  });
  return response.data;
}

export async function getCompanyInvitation(companyId: string, invitationId: string) {
  const response = await httpClient.get<CompanyInvitation>(
    `/api/companies/${companyId}/invitations/${invitationId}`,
  );
  return response.data;
}

export async function createCompanyInvitation(companyId: string, payload: CreateInvitationRequest) {
  const response = await httpClient.post<InvitationMutationResponse>(
    `/api/companies/${companyId}/invitations`,
    payload,
  );
  return response.data;
}

export async function updateCompanyInvitation(
  companyId: string,
  invitationId: string,
  payload: UpdateInvitationRequest,
) {
  const response = await httpClient.put<InvitationMutationResponse>(
    `/api/companies/${companyId}/invitations/${invitationId}`,
    payload,
  );
  return response.data;
}

export async function resendCompanyInvitation(companyId: string, invitationId: string) {
  const response = await httpClient.post<InvitationMutationResponse>(
    `/api/companies/${companyId}/invitations/${invitationId}/resend`,
  );
  return response.data;
}

export async function cancelCompanyInvitation(companyId: string, invitationId: string) {
  const response = await httpClient.post<InvitationMutationResponse>(
    `/api/companies/${companyId}/invitations/${invitationId}/cancel`,
  );
  return response.data;
}

export async function previewCompanyInvitation(token: string) {
  const response = await httpClient.get<CompanyInvitationPreview>(
    `/api/companies/invitations/preview/${encodeURIComponent(token)}`,
  );
  return response.data;
}

export async function acceptCompanyInvitation(token: string) {
  const response = await httpClient.post<AcceptInvitationResponse>("/api/companies/invitations/accept", {
    token,
  });
  return response.data;
}

export async function getTenantAdminBranches(companyId: string) {
  const response = await httpClient.get<AdminBranch[]>(`/api/companies/${companyId}/admin/branches`);
  return response.data;
}
