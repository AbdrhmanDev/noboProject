import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { companyQueryKeys } from "../../companies/hooks/useCompanies";
import {
  acceptCompanyInvitation,
  assignMembershipRoles,
  cancelCompanyInvitation,
  changeMembershipStatus,
  createCompanyInvitation,
  createCompanyRole,
  getCompanyInvitation,
  getCompanyInvitations,
  getCompanyMembership,
  getCompanyMemberships,
  getCompanyRoles,
  getTenantAdminBranches,
  previewCompanyInvitation,
  resendCompanyInvitation,
  updateCompanyInvitation,
  updateCompanyRole,
  updateMembershipBranchAccess,
} from "../api/usersAccessApi";
import type {
  AssignMembershipRolesRequest,
  CreateInvitationRequest,
  CreateRoleRequest,
  UpdateInvitationRequest,
  UpdateMembershipBranchAccessRequest,
  UpdateRoleRequest,
} from "../types/usersAccess.types";

export const usersAccessQueryKeys = {
  all: ["users-access"] as const,
  memberships: (companyId: string, filters: unknown) =>
    ["users-access", companyId, "memberships", filters] as const,
  membership: (companyId: string, membershipId: string) =>
    ["users-access", companyId, "memberships", membershipId] as const,
  roles: (companyId: string) => ["users-access", companyId, "roles"] as const,
  invitations: (companyId: string, filters: unknown) =>
    ["users-access", companyId, "invitations", filters] as const,
  invitation: (companyId: string, invitationId: string) =>
    ["users-access", companyId, "invitations", invitationId] as const,
  adminBranches: (companyId: string) => ["users-access", companyId, "admin-branches"] as const,
  invitationPreview: (token: string) => ["users-access", "invitation-preview", token] as const,
};

function invalidateCompanyAccess(queryClient: ReturnType<typeof useQueryClient>, companyId: string) {
  queryClient.invalidateQueries({ queryKey: usersAccessQueryKeys.all });
  queryClient.invalidateQueries({ queryKey: companyQueryKeys.permissions(companyId) });
  queryClient.invalidateQueries({ queryKey: companyQueryKeys.mine });
}

export function useCompanyMemberships(companyId: string | null | undefined, filters: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: usersAccessQueryKeys.memberships(companyId || "", filters),
    queryFn: () => getCompanyMemberships(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCompanyMembership(companyId: string | null | undefined, membershipId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: usersAccessQueryKeys.membership(companyId || "", membershipId || ""),
    queryFn: () => getCompanyMembership(companyId as string, membershipId as string),
    enabled: Boolean(companyId && membershipId) && enabled,
  });
}

export function useCompanyRoles(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: usersAccessQueryKeys.roles(companyId || ""),
    queryFn: () => getCompanyRoles(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCompanyInvitations(companyId: string | null | undefined, filters: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: usersAccessQueryKeys.invitations(companyId || "", filters),
    queryFn: () => getCompanyInvitations(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCompanyInvitation(companyId: string | null | undefined, invitationId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: usersAccessQueryKeys.invitation(companyId || "", invitationId || ""),
    queryFn: () => getCompanyInvitation(companyId as string, invitationId as string),
    enabled: Boolean(companyId && invitationId) && enabled,
  });
}

export function useTenantAdminBranches(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: usersAccessQueryKeys.adminBranches(companyId || ""),
    queryFn: () => getTenantAdminBranches(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCreateInvitation(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvitationRequest) => createCompanyInvitation(companyId as string, payload),
    onSuccess: () => invalidateCompanyAccess(queryClient, companyId as string),
  });
}

export function useUpdateInvitation(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invitationId, payload }: { invitationId: string; payload: UpdateInvitationRequest }) =>
      updateCompanyInvitation(companyId as string, invitationId, payload),
    onSuccess: () => invalidateCompanyAccess(queryClient, companyId as string),
  });
}

export function useResendInvitation(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => resendCompanyInvitation(companyId as string, invitationId),
    onSuccess: () => invalidateCompanyAccess(queryClient, companyId as string),
  });
}

export function useCancelInvitation(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => cancelCompanyInvitation(companyId as string, invitationId),
    onSuccess: () => invalidateCompanyAccess(queryClient, companyId as string),
  });
}

export function useAssignMembershipRoles(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, payload }: { membershipId: string; payload: AssignMembershipRolesRequest }) =>
      assignMembershipRoles(companyId as string, membershipId, payload),
    onSuccess: () => invalidateCompanyAccess(queryClient, companyId as string),
  });
}

export function useUpdateMembershipBranchAccess(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, payload }: { membershipId: string; payload: UpdateMembershipBranchAccessRequest }) =>
      updateMembershipBranchAccess(companyId as string, membershipId, payload),
    onSuccess: () => invalidateCompanyAccess(queryClient, companyId as string),
  });
}

export function useChangeMembershipStatus(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, action }: { membershipId: string; action: "suspend" | "activate" | "revoke" }) =>
      changeMembershipStatus(companyId as string, membershipId, action),
    onSuccess: () => invalidateCompanyAccess(queryClient, companyId as string),
  });
}

export function useCreateCompanyRole(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoleRequest) => createCompanyRole(companyId as string, payload),
    onSuccess: () => invalidateCompanyAccess(queryClient, companyId as string),
  });
}

export function useUpdateCompanyRole(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: UpdateRoleRequest }) =>
      updateCompanyRole(companyId as string, roleId, payload),
    onSuccess: () => invalidateCompanyAccess(queryClient, companyId as string),
  });
}

export function usePreviewInvitation(token: string | null | undefined) {
  return useQuery({
    queryKey: usersAccessQueryKeys.invitationPreview(token || ""),
    queryFn: () => previewCompanyInvitation(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptCompanyInvitation,
    onSuccess: (result) => {
      invalidateCompanyAccess(queryClient, result.companyId);
    },
  });
}
