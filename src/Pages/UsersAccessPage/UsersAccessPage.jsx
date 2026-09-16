import { useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Edit3,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { hasEffectivePermission, useCompanyEntitlements, useCompanyPermissions } from "../../features/companies/hooks/useCompanies";
import { USER_ACCESS_PERMISSIONS, getPermissionEntitlement } from "../../features/users-access/constants/permissionMetadata";
import {
  useAssignMembershipRoles,
  useCancelInvitation,
  useChangeMembershipStatus,
  useCompanyInvitations,
  useCompanyMemberships,
  useCompanyRoles,
  useCreateCompanyRole,
  useCreateInvitation,
  useResendInvitation,
  useTenantAdminBranches,
  useUpdateCompanyRole,
  useUpdateInvitation,
  useUpdateMembershipBranchAccess,
} from "../../features/users-access/hooks/useUsersAccess";

const USERS_VIEW = "Users.View";
const USERS_MANAGE = "Users.Manage";
const ROLES_VIEW = "Roles.View";
const ROLES_MANAGE = "Roles.Manage";
const EMPTY_ACCESS = { roleIds: [], branchAccessMode: "AllBranches", selectedBranchIds: [] };

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  if (status === "Active" || status === "Accepted") return "success";
  if (status === "Suspended" || status === "Pending") return "warning";
  if (status === "Revoked" || status === "Cancelled" || status === "Expired") return "danger";
  return "neutral";
}

function summarizeBranches(mode, branches) {
  if (mode === "AllBranches") return "All Branches";
  if (!branches?.length) return "No branches selected";
  return branches.map((branch) => branch.name).join(", ");
}

// Mirrors the backend's CompanyRoleGrantGuard exactly (RequireCanGrantRolesAsync /
// RequireCanGrantPermissionsAsync): a non-owner can only grant a role/permission that is a
// subset of their OWN effective permissions. This is UX only -- the backend re-checks the same
// rule on every mutation regardless -- but without it a non-owner Users.Manage/Roles.Manage
// holder could pick a role or permission they don't personally have, click Save, and get a
// confusing "Request failed" instead of understanding why upfront (Section 8/15 of the Tenant
// Users & Access task: "frontend must not imply that a role can grant permissions the current
// actor is not allowed to grant").
function canActorGrantPermission(actorPermissions, code) {
  if (actorPermissions?.isOwner) return true;
  return (actorPermissions?.permissions || []).includes(code);
}

function canActorGrantRole(actorPermissions, role) {
  if (actorPermissions?.isOwner) return true;
  return (role.permissions || []).every((code) => canActorGrantPermission(actorPermissions, code));
}

function Dialog({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#08111f] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RolePicker({ roles, selectedIds, setSelectedIds, disabled, actorPermissions }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {roles.map((role) => {
        const grantable = canActorGrantRole(actorPermissions, role);
        return (
          <label
            key={role.roleId}
            className={`flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm ${grantable ? "text-slate-200" : "text-slate-500"}`}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(role.roleId)}
              disabled={disabled || !grantable}
              onChange={(event) => {
                setSelectedIds(
                  event.target.checked
                    ? [...selectedIds, role.roleId]
                    : selectedIds.filter((id) => id !== role.roleId),
                );
              }}
              className="mt-1"
            />
            <span>
              <span className={`font-bold ${grantable ? "text-white" : "text-slate-400"}`}>{role.name}</span>
              <span className="ms-2 text-xs text-slate-500">{role.code}</span>
              {role.isSystem && <span className="ms-2 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-200">System Role</span>}
              {!grantable && <span className="ms-2 text-[11px] text-amber-300">Requires permissions you don't have</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function BranchAccessPicker({ branches, mode, selectedIds, setMode, setSelectedIds, disabled, owner }) {
  if (owner) {
    return (
      <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm text-blue-100">
        Company Owners always have access to all branches.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {["AllBranches", "SelectedBranches"].map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => setMode(value)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold ${mode === value ? "border-blue-400/60 bg-blue-500/20 text-white" : "border-white/10 bg-white/[0.03] text-slate-300"}`}
          >
            {value === "AllBranches" ? "All Branches" : "Selected Branches"}
          </button>
        ))}
      </div>
      {mode === "SelectedBranches" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {branches.map((branch) => (
            <label key={branch.branchId} className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={selectedIds.includes(branch.branchId)}
                disabled={disabled}
                onChange={(event) =>
                  setSelectedIds(
                    event.target.checked
                      ? [...selectedIds, branch.branchId]
                      : selectedIds.filter((id) => id !== branch.branchId),
                  )
                }
              />
              <span>
                <span className="font-bold text-white">{branch.name}</span>
                <span className="ms-2 text-xs text-slate-500">{branch.code}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function AccessDialog({ title, member, roles, branches, initial, canSave, isOwner, actorPermissions, onSubmit, onClose, pending }) {
  const [roleIds, setRoleIds] = useState(initial.roleIds);
  const [branchAccessMode, setBranchAccessMode] = useState(initial.branchAccessMode);
  const [selectedBranchIds, setSelectedBranchIds] = useState(initial.selectedBranchIds);
  const [error, setError] = useState("");

  const submit = async () => {
    if (branchAccessMode === "SelectedBranches" && selectedBranchIds.length === 0) {
      setError("Select at least one branch.");
      return;
    }
    setError("");
    try {
      await onSubmit({ roleIds, branchAccessMode, selectedBranchIds });
    } catch (mutationError) {
      // The dialog is a full-screen overlay (Section 17: never "nothing happened") -- a failed
      // mutation must surface here, since the page's own ErrorState banner is hidden behind it.
      setError(getErrorMessage(mutationError));
    }
  };

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="space-y-5">
        {/* Section 13: a clean identity/status summary, not just an editable roles/branches form. */}
        {member && (
          <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-bold text-slate-500">Identity</div>
              <div className="font-bold text-white">{member.displayName}</div>
              <div className="text-xs text-slate-400">{member.email}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500">Status</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <StatusBadge tone={statusTone(member.status)}>{member.status}</StatusBadge>
                {member.isOwner && <StatusBadge tone="info">Owner</StatusBadge>}
              </div>
            </div>
          </section>
        )}
        <section>
          <h3 className="mb-2 text-sm font-black text-white">Roles</h3>
          <RolePicker roles={roles} selectedIds={roleIds} setSelectedIds={setRoleIds} disabled={!canSave || pending || isOwner} actorPermissions={actorPermissions} />
        </section>
        <section>
          <h3 className="mb-2 text-sm font-black text-white">Branch Access</h3>
          <BranchAccessPicker
            branches={branches}
            mode={branchAccessMode}
            selectedIds={selectedBranchIds}
            setMode={setBranchAccessMode}
            setSelectedIds={setSelectedBranchIds}
            disabled={!canSave || pending}
            owner={isOwner}
          />
        </section>
        {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
        {!canSave && <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">Manage permission is required.</div>}
        <button type="button" disabled={!canSave || pending} onClick={submit} className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:opacity-50">
          {pending ? "Saving..." : "Save access"}
        </button>
      </div>
    </Dialog>
  );
}

function InviteDialog({ roles, branches, canManage, actorPermissions, onSubmit, onClose, pending }) {
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState(EMPTY_ACCESS);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.trim()) return setError("Email is required.");
    if (access.branchAccessMode === "SelectedBranches" && access.selectedBranchIds.length === 0) return setError("Select at least one branch.");
    setError("");
    try {
      await onSubmit({ email: email.trim(), ...access });
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    }
  };

  return (
    <Dialog title="Invite User" onClose={onClose}>
      <div className="space-y-5">
        <label className="block text-xs font-bold text-slate-400">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400" />
        </label>
        <section>
          <h3 className="mb-2 text-sm font-black text-white">Roles</h3>
          <RolePicker roles={roles} selectedIds={access.roleIds} setSelectedIds={(ids) => setAccess((draft) => ({ ...draft, roleIds: ids }))} disabled={!canManage || pending} actorPermissions={actorPermissions} />
        </section>
        <section>
          <h3 className="mb-2 text-sm font-black text-white">Branch Access</h3>
          <BranchAccessPicker
            branches={branches}
            mode={access.branchAccessMode}
            selectedIds={access.selectedBranchIds}
            setMode={(mode) => setAccess((draft) => ({ ...draft, branchAccessMode: mode }))}
            setSelectedIds={(ids) => setAccess((draft) => ({ ...draft, selectedBranchIds: ids }))}
            disabled={!canManage || pending}
          />
        </section>
        {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
        <button type="button" disabled={!canManage || pending} onClick={submit} className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:opacity-50">
          {pending ? "Sending..." : "Send invitation"}
        </button>
      </div>
    </Dialog>
  );
}

function RoleDialog({ role, entitlements, canManage, actorPermissions, onSubmit, onClose, pending }) {
  const [name, setName] = useState(role?.name || "");
  const [code, setCode] = useState(role?.code || "");
  const [permissions, setPermissions] = useState(role?.permissions || []);
  const [error, setError] = useState("");
  const enabledEntitlements = new Set((entitlements?.entitlements || []).filter((item) => item.enabled).map((item) => item.code));

  const submit = async () => {
    setError("");
    try {
      await onSubmit({ code: code.trim(), name: name.trim(), permissions });
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    }
  };
  const grouped = USER_ACCESS_PERMISSIONS.reduce((accumulator, permission) => {
    const items = accumulator.get(permission.group) || [];
    items.push(permission);
    accumulator.set(permission.group, items);
    return accumulator;
  }, new Map());
  const isEdit = Boolean(role);

  return (
    <Dialog title={isEdit ? "Edit Custom Role" : "Create Custom Role"} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-400">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} disabled={!canManage || pending || role?.isSystem} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-50" />
          </label>
          <label className="text-xs font-bold text-slate-400">
            Code
            <input value={code} onChange={(event) => setCode(event.target.value)} disabled={!canManage || pending || isEdit} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-50" />
          </label>
        </div>
        {[...grouped.entries()].map(([group, items]) => (
          <section key={group} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <h3 className="mb-2 text-sm font-black text-white">{group}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((permission) => {
                const entitlement = getPermissionEntitlement(permission.code);
                const unavailable = entitlement && !enabledEntitlements.has(entitlement);
                const notGrantable = !canActorGrantPermission(actorPermissions, permission.code);
                return (
                  <label key={permission.code} className={`flex gap-2 text-sm ${unavailable || notGrantable ? "text-slate-500" : "text-slate-200"}`}>
                    <input
                      type="checkbox"
                      checked={permissions.includes(permission.code)}
                      disabled={!canManage || pending || role?.isSystem || unavailable || notGrantable}
                      onChange={(event) =>
                        setPermissions(
                          event.target.checked
                            ? [...permissions, permission.code]
                            : permissions.filter((value) => value !== permission.code),
                        )
                      }
                    />
                    <span>
                      {permission.label}
                      {unavailable && <span className="ms-2 text-[11px] text-amber-300">Unavailable</span>}
                      {!unavailable && notGrantable && <span className="ms-2 text-[11px] text-amber-300">You don't have this permission</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        {role?.isSystem && <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm text-blue-100">System roles are assignable and readable, but not editable.</div>}
        {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
        <button type="button" disabled={!canManage || pending || role?.isSystem} onClick={submit} className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:opacity-50">
          {pending ? "Saving..." : isEdit ? "Save role" : "Create role"}
        </button>
      </div>
    </Dialog>
  );
}

export default function UsersAccessPage() {
  const { currentCompanyId } = useCompany();
  const [tab, setTab] = useState("members");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatus, setMemberStatus] = useState("");
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState("");

  const permissionsQuery = useCompanyPermissions(currentCompanyId);
  const entitlementsQuery = useCompanyEntitlements(currentCompanyId);
  const canViewUsers = hasEffectivePermission(permissionsQuery.data, USERS_VIEW);
  const canManageUsers = hasEffectivePermission(permissionsQuery.data, USERS_MANAGE);
  const canViewRoles = hasEffectivePermission(permissionsQuery.data, ROLES_VIEW);
  const canManageRoles = hasEffectivePermission(permissionsQuery.data, ROLES_MANAGE);
  const canOpen = canViewUsers || canViewRoles || Boolean(permissionsQuery.data?.isOwner);

  const memberFilters = useMemo(() => ({ status: memberStatus || undefined, search: memberSearch.trim() || undefined, pageNumber: 1, pageSize: 50 }), [memberSearch, memberStatus]);
  const invitationFilters = useMemo(() => ({ status: inviteStatus || undefined, search: inviteSearch.trim() || undefined, pageNumber: 1, pageSize: 50 }), [inviteSearch, inviteStatus]);
  const membershipsQuery = useCompanyMemberships(currentCompanyId, memberFilters, canOpen && canViewUsers);
  const invitationsQuery = useCompanyInvitations(currentCompanyId, invitationFilters, canOpen && canViewUsers);
  const rolesQuery = useCompanyRoles(currentCompanyId, canOpen && canViewRoles);
  const branchesQuery = useTenantAdminBranches(currentCompanyId, canManageUsers);
  const createInvite = useCreateInvitation(currentCompanyId);
  const updateInvite = useUpdateInvitation(currentCompanyId);
  const resendInvite = useResendInvitation(currentCompanyId);
  const cancelInvite = useCancelInvitation(currentCompanyId);
  const assignRoles = useAssignMembershipRoles(currentCompanyId);
  const updateBranchAccess = useUpdateMembershipBranchAccess(currentCompanyId);
  const changeStatus = useChangeMembershipStatus(currentCompanyId);
  const createRole = useCreateCompanyRole(currentCompanyId);
  const updateRole = useUpdateCompanyRole(currentCompanyId);
  const roles = rolesQuery.data || [];
  const branches = branchesQuery.data || [];
  const filteredRoles = roles.filter((role) => `${role.name} ${role.code}`.toLowerCase().includes(roleSearch.trim().toLowerCase()));

  // Section 17 ("avoid nothing happened UX"): actions triggered directly from a list row (no
  // modal to show an inline error in) must still surface a failure somewhere visible -- the
  // in-dialog mutations (invite/access/role) handle their own error display instead (see each
  // Dialog's local `error` state), since this banner sits behind the modal overlay.
  const showError = [
    membershipsQuery,
    invitationsQuery,
    rolesQuery,
    branchesQuery,
    changeStatus,
    resendInvite,
    cancelInvite,
  ].find((query) => query.isError)?.error;

  const submitAccess = async (membership, payload) => {
    await assignRoles.mutateAsync({ membershipId: membership.membershipId, payload: { roleIds: payload.roleIds } });
    await updateBranchAccess.mutateAsync({ membershipId: membership.membershipId, payload: { branchAccessMode: payload.branchAccessMode, selectedBranchIds: payload.selectedBranchIds } });
    setDialog(null);
    setNotice("Member access updated.");
  };

  const tabs = [
    { key: "members", label: "Members", visible: canViewUsers },
    { key: "invitations", label: "Invitations", visible: canViewUsers },
    { key: "roles", label: "Roles", visible: canViewRoles },
  ].filter((item) => item.visible);

  if (!currentCompanyId) return <AppLayout><EmptyState title="Select a company" message="Choose a company before managing tenant access." /></AppLayout>;
  if (permissionsQuery.isLoading) return <AppLayout><LoadingState label="Checking access..." /></AppLayout>;
  if (!canOpen) return <AppLayout><EmptyState title="Users & Access is unavailable" message="Users.View or Roles.View is required." /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="Users & Access"
        actions={
          <>
            {canManageUsers && <button onClick={() => setDialog({ type: "invite" })} className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white"><UserPlus size={15} />Invite User</button>}
            {canManageRoles && <button onClick={() => setDialog({ type: "role" })} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black text-white"><ShieldCheck size={15} />Create Role</button>}
          </>
        }
      />
      <p className="mb-4 text-sm text-slate-400">Manage members, roles, permissions, and branch access.</p>
      {notice && <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{notice}</div>}
      {showError && <ErrorState title="Users & Access failed" message={getErrorMessage(showError)} />}

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`rounded-xl border px-4 py-2 text-sm font-bold ${tab === item.key ? "border-blue-400/60 bg-blue-500/20 text-white" : "border-white/10 bg-white/[0.03] text-slate-300"}`}>{item.label}</button>
        ))}
      </div>

      {tab === "members" && canViewUsers && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="flex h-10 min-w-[240px] items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-slate-400"><Search size={15} /><input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search name or email" className="w-full bg-transparent text-sm text-white outline-none" /></div>
            <select value={memberStatus} onChange={(e) => setMemberStatus(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#0b1424] px-3 text-sm text-white"><option value="">All statuses</option><option>Active</option><option>Suspended</option><option>Revoked</option></select>
          </div>
          {membershipsQuery.isLoading ? <LoadingState label="Loading members..." /> : membershipsQuery.data?.items.length ? (
            <div className="overflow-hidden rounded-xl border border-white/10">
              {membershipsQuery.data.items.map((member) => (
                <div key={member.membershipId} className="grid gap-3 border-b border-white/10 bg-[#0b1424]/80 p-4 last:border-b-0 lg:grid-cols-[1.4fr_.8fr_1fr_1fr_auto]">
                  <div><div className="font-black text-white">{member.displayName}</div><div className="text-xs text-slate-400">{member.email}</div></div>
                  <div className="flex flex-wrap gap-2"><StatusBadge tone={statusTone(member.status)}>{member.status}</StatusBadge>{member.isOwner && <StatusBadge tone="info">Owner</StatusBadge>}</div>
                  <div className="text-sm text-slate-300">{member.roles.map((role) => role.name).join(", ") || "No roles"}</div>
                  <div className="text-sm text-slate-300">{summarizeBranches(member.branchAccessMode, member.selectedBranches)}</div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setDialog({ type: "member", member })} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white"><Edit3 size={14} /></button>
                    {/* Owners are not blanket-excluded here (Section 2/15): the backend only
                        rejects Suspend/Revoke on the LAST active owner
                        (CompanyMembership.LastOwnerCannotBeSuspended/Revoked) -- a co-owner in a
                        multi-owner company can legitimately be suspended/revoked by another
                        owner/authorized admin. Attempting it on the sole owner still fails
                        cleanly via the backend error surfaced by `showError` above; nothing here
                        assumes the outcome. */}
                    {canManageUsers && member.status === "Active" && <button onClick={() => window.confirm(member.isOwner ? "Suspend this Company Owner? This is only possible if another active owner exists. Temporary access block; history is preserved." : "Suspend this member? Temporary access block; history is preserved.") && changeStatus.mutate({ membershipId: member.membershipId, action: "suspend" })} className="rounded-lg border border-amber-400/20 px-3 py-2 text-xs font-bold text-amber-100"><Ban size={14} /></button>}
                    {canManageUsers && member.status === "Suspended" && <button onClick={() => changeStatus.mutate({ membershipId: member.membershipId, action: "activate" })} className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs font-bold text-emerald-100"><CheckCircle2 size={14} /></button>}
                    {canManageUsers && member.status !== "Revoked" && <button onClick={() => window.confirm(member.isOwner ? "Revoke this Company Owner? This is only possible if another active owner exists. Future company access is removed; historical records remain." : "Revoke this member? Future company access is removed; historical records remain.") && changeStatus.mutate({ membershipId: member.membershipId, action: "revoke" })} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-bold text-red-100"><XCircle size={14} /></button>}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No members found" message="No company memberships match the current filters." />}
        </section>
      )}

      {tab === "invitations" && canViewUsers && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="flex h-10 min-w-[240px] items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-slate-400"><Search size={15} /><input value={inviteSearch} onChange={(e) => setInviteSearch(e.target.value)} placeholder="Search email" className="w-full bg-transparent text-sm text-white outline-none" /></div>
            <select value={inviteStatus} onChange={(e) => setInviteStatus(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#0b1424] px-3 text-sm text-white"><option value="">All statuses</option><option>Pending</option><option>Accepted</option><option>Cancelled</option><option>Expired</option></select>
          </div>
          {invitationsQuery.isLoading ? <LoadingState label="Loading invitations..." /> : invitationsQuery.data?.items.length ? (
            <div className="grid gap-3">
              {invitationsQuery.data.items.map((invite) => (
                <div key={invite.invitationId} className="rounded-xl border border-white/10 bg-[#0b1424]/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><div className="font-black text-white">{invite.email}</div><div className="text-xs text-slate-500">Invited {formatDateTime(invite.createdAtUtc)} · Expires {formatDateTime(invite.expiresAtUtc)}</div></div>
                    <StatusBadge tone={statusTone(invite.effectiveStatus)}>{invite.effectiveStatus}</StatusBadge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2"><div>Roles: {invite.roles.map((role) => role.name).join(", ") || "No roles"}</div><div>Branches: {summarizeBranches(invite.branchAccessMode, invite.selectedBranches)}</div></div>
                  {invite.effectiveStatus === "Pending" && canManageUsers && <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setDialog({ type: "invitation", invitation: invite })} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white"><Edit3 size={14} /></button><button onClick={async () => { try { const result = await resendInvite.mutateAsync(invite.invitationId); setNotice(result.emailSent ? "Invitation resent." : "Invitation updated, but email delivery was not confirmed."); } catch { /* surfaced via showError above (resendInvite.isError) */ } }} className="rounded-lg border border-blue-400/20 px-3 py-2 text-xs font-bold text-blue-100"><RefreshCw size={14} /></button><button onClick={() => window.confirm("Cancel this invitation? This invalidates the link and does not affect memberships.") && cancelInvite.mutate(invite.invitationId)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-bold text-red-100"><XCircle size={14} /></button></div>}
                </div>
              ))}
            </div>
          ) : <EmptyState title="No invitations found" message="No invitations match the current filters." />}
        </section>
      )}

      {tab === "roles" && canViewRoles && (
        <section className="space-y-3">
          <div className="flex h-10 max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-slate-400"><Search size={15} /><input value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} placeholder="Search roles" className="w-full bg-transparent text-sm text-white outline-none" /></div>
          {rolesQuery.isLoading ? <LoadingState label="Loading roles..." /> : filteredRoles.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredRoles.map((role) => (
                <button key={role.roleId} type="button" onClick={() => !role.isSystem && canManageRoles && setDialog({ type: "role", role })} className="rounded-xl border border-white/10 bg-[#0b1424]/80 p-4 text-start transition hover:border-blue-400/40">
                  <div className="flex items-start justify-between gap-3"><div><div className="font-black text-white">{role.name}</div><div className="text-xs text-slate-500">{role.code}</div></div><div className="flex gap-2">{role.isSystem && <StatusBadge tone="info">System Role</StatusBadge>}<StatusBadge tone={statusTone(role.status)}>{role.status}</StatusBadge></div></div>
                  <div className="mt-3 text-sm text-slate-300">{role.permissions.length} permissions</div>
                  {role.isSystem && <div className="mt-2 text-xs text-slate-500">Assignable and readable; not editable.</div>}
                </button>
              ))}
            </div>
          ) : <EmptyState title="No roles found" message="No roles match the current search." />}
        </section>
      )}

      {dialog?.type === "invite" && <InviteDialog roles={roles} branches={branches} canManage={canManageUsers} actorPermissions={permissionsQuery.data} pending={createInvite.isPending} onClose={() => setDialog(null)} onSubmit={async (payload) => { const result = await createInvite.mutateAsync(payload); setDialog(null); setNotice(result.emailSent ? "Invitation sent." : "Invitation created, but email delivery was not confirmed."); }} />}
      {dialog?.type === "member" && <AccessDialog title={`Manage ${dialog.member.displayName}`} member={dialog.member} roles={roles} branches={branches} canSave={canManageUsers} isOwner={dialog.member.isOwner} actorPermissions={permissionsQuery.data} pending={assignRoles.isPending || updateBranchAccess.isPending} initial={{ roleIds: dialog.member.roles.map((role) => role.roleId), branchAccessMode: dialog.member.branchAccessMode, selectedBranchIds: dialog.member.selectedBranches.map((branch) => branch.branchId) }} onClose={() => setDialog(null)} onSubmit={(payload) => submitAccess(dialog.member, payload)} />}
      {dialog?.type === "invitation" && <AccessDialog title={`Edit invitation ${dialog.invitation.email}`} roles={roles} branches={branches} canSave={canManageUsers} actorPermissions={permissionsQuery.data} pending={updateInvite.isPending} initial={{ roleIds: dialog.invitation.roles.map((role) => role.roleId), branchAccessMode: dialog.invitation.branchAccessMode, selectedBranchIds: dialog.invitation.selectedBranches.map((branch) => branch.branchId) }} onClose={() => setDialog(null)} onSubmit={async (payload) => { await updateInvite.mutateAsync({ invitationId: dialog.invitation.invitationId, payload }); setDialog(null); setNotice("Invitation access updated."); }} />}
      {dialog?.type === "role" && <RoleDialog role={dialog.role} entitlements={entitlementsQuery.data} canManage={canManageRoles} actorPermissions={permissionsQuery.data} pending={createRole.isPending || updateRole.isPending} onClose={() => setDialog(null)} onSubmit={async (payload) => { if (dialog.role) await updateRole.mutateAsync({ roleId: dialog.role.roleId, payload: { name: payload.name, status: dialog.role.status, permissions: payload.permissions } }); else await createRole.mutateAsync(payload); setDialog(null); setNotice(dialog.role ? "Role updated." : "Role created."); }} />}
    </AppLayout>
  );
}
