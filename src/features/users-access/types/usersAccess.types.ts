import type { Branch } from "../../branches/types/branch.types";

export type MembershipStatus = "Active" | "Suspended" | "Revoked";
export type InvitationStatus = "Pending" | "Accepted" | "Cancelled" | "Expired";
export type BranchAccessMode = "AllBranches" | "SelectedBranches";
export type RoleStatus = "Active" | "Suspended";

export type RoleSummary = {
  roleId: string;
  code: string;
  name: string;
  status: RoleStatus | string;
};

export type SelectedBranchSummary = {
  branchId: string;
  code: string;
  name: string;
  status: string;
};

export type CompanyMembership = {
  membershipId: string;
  companyId: string;
  userId: string;
  displayName: string;
  email: string;
  isOwner: boolean;
  status: MembershipStatus;
  branchAccessMode: BranchAccessMode;
  createdAtUtc: string;
  roles: RoleSummary[];
  selectedBranches: SelectedBranchSummary[];
};

export type PagedMemberships = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: CompanyMembership[];
};

export type CompanyRole = {
  roleId: string;
  companyId: string;
  code: string;
  name: string;
  isSystem: boolean;
  status: RoleStatus | string;
  createdAtUtc: string;
  permissions: string[];
};

export type CompanyInvitation = {
  invitationId: string;
  companyId: string;
  email: string;
  status: InvitationStatus;
  effectiveStatus: InvitationStatus;
  branchAccessMode: BranchAccessMode;
  invitedByUserId: string;
  invitedByDisplayName: string;
  invitedByEmail: string;
  createdAtUtc: string;
  expiresAtUtc: string;
  acceptedAtUtc: string | null;
  cancelledAtUtc: string | null;
  roles: RoleSummary[];
  selectedBranches: SelectedBranchSummary[];
};

export type PagedInvitations = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: CompanyInvitation[];
};

export type InvitationMutationResponse = {
  invitationId: string;
  companyId: string;
  email: string;
  status: InvitationStatus;
  effectiveStatus: InvitationStatus;
  branchAccessMode: BranchAccessMode;
  createdAtUtc: string;
  expiresAtUtc: string;
  acceptedAtUtc: string | null;
  cancelledAtUtc: string | null;
  roleIds: string[];
  selectedBranchIds: string[];
  invitationUrl: string | null;
  emailSent: boolean;
};

export type CreateInvitationRequest = {
  email: string;
  roleIds: string[];
  branchAccessMode: BranchAccessMode;
  selectedBranchIds: string[];
};

export type UpdateInvitationRequest = {
  roleIds: string[];
  branchAccessMode: BranchAccessMode;
  selectedBranchIds: string[];
};

export type UpdateMembershipBranchAccessRequest = {
  branchAccessMode: BranchAccessMode;
  selectedBranchIds: string[];
};

export type AssignMembershipRolesRequest = {
  roleIds: string[];
};

export type CreateRoleRequest = {
  code: string;
  name: string;
  permissions: string[];
};

export type UpdateRoleRequest = {
  name: string;
  status: string;
  permissions: string[];
};

export type AcceptInvitationResponse = {
  invitationId: string;
  companyId: string;
  membershipId: string;
  membershipStatus: string;
  branchAccessMode: BranchAccessMode;
  roleIds: string[];
  selectedBranchIds: string[];
  wasAlreadyAccepted: boolean;
};

export type AdminBranch = Branch;

// Anonymous-safe preview shown on the invitation-acceptance page before the visitor has
// registered or logged in -- deliberately minimal (no inviter identity, no role permission codes,
// no branch codes/status), matching what the backend's PreviewCompanyInvitationHandler returns.
export type CompanyInvitationPreview = {
  invitationId: string;
  companyId: string;
  companyName: string;
  email: string;
  status: InvitationStatus | string;
  effectiveStatus: InvitationStatus | string;
  branchAccessMode: BranchAccessMode;
  expiresAtUtc: string;
  roleNames: string[];
  selectedBranchNames: string[];
};
