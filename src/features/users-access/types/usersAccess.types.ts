import type { Branch } from "../../branches/types/branch.types";

export type MembershipStatus = "Active" | "Suspended" | "Revoked";
export type InvitationStatus = "Pending" | "Accepted" | "Cancelled" | "Expired";
export type BranchAccessMode = "AllBranches" | "SelectedBranches";
// null = no explicit restriction set yet -- behaviorally identical to "Branch" (unrestricted
// within the member's existing branch access), but kept distinct from "Branch" in the UI so an
// admin can tell no explicit choice has been recorded, rather than silently implying one was
// (Sales Order Visibility Scope, Users & Access wiring task).
export type SalesOrderVisibilityScope = "Own" | "Branch" | null;
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
  salesOrderVisibilityScope: SalesOrderVisibilityScope;
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

// Body key is `scope`, not `salesOrderVisibilityScope` -- matches the backend's
// SetCompanyMembershipSalesOrderVisibilityScopeRequest exactly.
export type UpdateMembershipSalesScopeRequest = {
  scope: SalesOrderVisibilityScope;
};

export type AssignMembershipRolesRequest = {
  roleIds: string[];
};

// Manager PIN. Request carries only the new PIN -- the backend endpoint accepts no "current PIN"
// field, so none is collected here either. The response never carries the PIN itself, only
// confirmation that it is now set (and when) -- this is the ONLY safe, server-confirmed signal the
// frontend ever has for "is a PIN set", since no GET endpoint exposes PIN status at all.
export type SetCompanyMembershipPinRequest = {
  pin: string;
};

export type CompanyMembershipPinResponse = {
  companyMembershipId: string;
  hasPinSet: boolean;
  pinSetAtUtc: string | null;
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
