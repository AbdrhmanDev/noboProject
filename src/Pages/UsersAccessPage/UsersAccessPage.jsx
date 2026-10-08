import { useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Edit3,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  XCircle,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useCompany } from "../../features/companies/context/CompanyContext";
import {
  hasEffectivePermission,
  useCompanyEntitlements,
  useCompanyPermissions,
} from "../../features/companies/hooks/useCompanies";
import {
  USER_ACCESS_PERMISSIONS,
  getPermissionEntitlement,
} from "../../features/users-access/constants/permissionMetadata";
import {
  useAssignMembershipRoles,
  useCancelInvitation,
  useChangeMembershipStatus,
  useCompanyInvitations,
  useCompanyMemberships,
  useCompanyRoles,
  useCreateCompanyRole,
  useCreateInvitation,
  useCreateMemberDirectly,
  useResendInvitation,
  useResetMemberPassword,
  useTenantAdminBranches,
  useUpdateCompanyRole,
  useUpdateInvitation,
  useUpdateMembershipBranchAccess,
  useUpdateMembershipSalesScope,
} from "../../features/users-access/hooks/useUsersAccess";
import { ManagerPinForm } from "../../features/users-access/components/ManagerPinForm";

const USERS_VIEW = "Users.View";
const USERS_MANAGE = "Users.Manage";
const ROLES_VIEW = "Roles.View";
const ROLES_MANAGE = "Roles.Manage";
const EMPTY_ACCESS = {
  roleIds: [],
  branchAccessMode: "AllBranches",
  selectedBranchIds: [],
};

function getErrorMessage(error, t) {
  return error?.message || t("usersAccess.common.requestFailed");
}

function statusTone(status) {
  if (status === "Active" || status === "Accepted") return "success";
  if (status === "Suspended" || status === "Pending") return "warning";
  if (status === "Revoked" || status === "Cancelled" || status === "Expired")
    return "danger";
  return "neutral";
}

const STATUS_LABEL_KEYS = {
  Active: "usersAccess.status.active",
  Suspended: "usersAccess.status.suspended",
  Revoked: "usersAccess.status.revoked",
  Pending: "usersAccess.status.pending",
  Accepted: "usersAccess.status.accepted",
  Cancelled: "usersAccess.status.cancelled",
  Expired: "usersAccess.status.expired",
};

function statusLabel(status, t) {
  const key = STATUS_LABEL_KEYS[status];
  return key ? t(key) : status;
}

function summarizeBranches(t, mode, branches) {
  if (mode === "AllBranches") return t("usersAccess.branchAccess.allBranches");
  if (!branches?.length) return t("usersAccess.branchAccess.noneSelected");
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
  return (role.permissions || []).every((code) =>
    canActorGrantPermission(actorPermissions, code),
  );
}

function Dialog({ title, children, onClose }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-3 py-2 text-sm font-bold text-ink"
          >
            {t("usersAccess.dialog.close")}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RolePicker({
  roles,
  selectedIds,
  setSelectedIds,
  disabled,
  actorPermissions,
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {roles.map((role) => {
        const grantable = canActorGrantRole(actorPermissions, role);
        return (
          <label
            key={role.roleId}
            className={`flex items-start gap-2 rounded-xl border border-line bg-raised p-3 text-sm ${grantable ? "text-ink" : "text-subtle"}`}
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
              <span
                className={`font-bold ${grantable ? "text-ink" : "text-muted"}`}
              >
                {role.name}
              </span>
              <span className="ms-2 text-sm text-subtle">{role.code}</span>
              {role.isSystem && (
                <span className="ms-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
                  {t("usersAccess.role.systemRoleBadge")}
                </span>
              )}
              {!grantable && (
                <span className="ms-2 text-xs text-warning">
                  {t("usersAccess.role.notGrantable")}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function BranchAccessPicker({
  branches,
  mode,
  selectedIds,
  setMode,
  setSelectedIds,
  disabled,
  owner,
}) {
  const { t } = useI18n();
  if (owner) {
    return (
      <div className="rounded-xl border border-accent-line bg-accent-soft p-3 text-sm text-accent">
        {t("usersAccess.branchAccess.ownerNotice")}
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
            className={`rounded-xl border px-3 py-2 text-sm font-bold ${mode === value ? "border-accent-line bg-accent-soft text-ink" : "border-line bg-raised text-muted"}`}
          >
            {value === "AllBranches"
              ? t("usersAccess.branchAccess.allBranches")
              : t("usersAccess.branchAccess.selectedBranches")}
          </button>
        ))}
      </div>
      {mode === "SelectedBranches" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {branches.map((branch) => (
            <label
              key={branch.branchId}
              className="flex gap-2 rounded-xl border border-line bg-raised p-3 text-sm text-ink"
            >
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
                <span className="font-bold text-ink">{branch.name}</span>
                <span className="ms-2 text-sm text-subtle">
                  {branch.code}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Mirrors BranchAccessPicker's exact pattern (segmented toggle buttons for a mutually-exclusive
// membership-level choice, owner short-circuit to a read-only info banner) -- Sales Order
// Visibility Scope is the same shape of setting (CompanyMembership-level, backend-authoritative,
// two real values), so it gets the same interaction/visual treatment for consistency.
function SalesScopePicker({ scope, setScope, disabled, owner }) {
  const { t } = useI18n();

  if (owner) {
    return (
      <div className="rounded-xl border border-accent-line bg-accent-soft p-3 text-sm text-accent">
        {t("usersAccess.salesScope.ownerNotice")}
      </div>
    );
  }

  const options = [
    {
      value: "Own",
      labelKey: "usersAccess.salesScope.ownOption",
      descriptionKey: "usersAccess.salesScope.ownDescription",
    },
    {
      value: "Branch",
      labelKey: "usersAccess.salesScope.branchOption",
      descriptionKey: "usersAccess.salesScope.branchDescription",
    },
  ];

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => setScope(option.value)}
          className={`block w-full rounded-xl border p-3 text-start text-sm font-bold ${scope === option.value ? "border-accent-line bg-accent-soft text-ink" : "border-line bg-raised text-muted"}`}
        >
          <div>{t(option.labelKey)}</div>
          <div className="mt-0.5 text-xs font-normal text-muted">
            {t(option.descriptionKey)}
          </div>
        </button>
      ))}
    </div>
  );
}

// Derives which USER_ACCESS_PERMISSIONS groups a member's actual assigned roles grant --
// cross-referencing the member's role ids against the full CompanyRole list (each of which
// already carries its own `permissions` array), mirroring the exact same union-of-role-
// permissions logic the backend's GetEffectivePermissionsAsync uses. Never invents a permission
// group; a group only appears here if the member genuinely holds at least one of its permissions.
function summarizeMemberAccess(member, allRoles) {
  if (member.isOwner) {
    return { isOwner: true, groups: [] };
  }

  const memberRoleIds = new Set(member.roles.map((role) => role.roleId));
  const grantedCodes = new Set();
  for (const role of allRoles) {
    if (!memberRoleIds.has(role.roleId)) continue;
    for (const code of role.permissions || []) grantedCodes.add(code);
  }

  const groups = [];
  for (const permission of USER_ACCESS_PERMISSIONS) {
    if (grantedCodes.has(permission.code) && !groups.includes(permission.group)) {
      groups.push(permission.group);
    }
  }

  return { isOwner: false, groups };
}

function salesScopeSummaryLabel(t, scope) {
  if (scope === "Own") return t("usersAccess.salesScope.ownOption");
  if (scope === "Branch") return t("usersAccess.salesScope.branchOption");
  return t("usersAccess.salesScope.unrestrictedLabel");
}

// Phase 5 of the Cashier Real Identity task: a clean, grouped, read-only access summary --
// never a raw technical permission-string dump, reusing the existing permissionMetadata groups
// and the existing Branch Access/Sales Scope summarizers already used elsewhere on this page.
function MemberAccessSummary({ member, roles: allRoles }) {
  const { t } = useI18n();
  const { isOwner, groups } = summarizeMemberAccess(member, allRoles);

  return (
    <section className="rounded-xl border border-line bg-raised p-3">
      <h3 className="mb-2 text-sm font-black text-ink">{t("usersAccess.accessSummary.title")}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs font-bold text-subtle">{t("usersAccess.accessSummary.role")}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {member.roles.length === 0 && !isOwner && (
              <span className="text-sm text-subtle">{t("usersAccess.accessSummary.noRoles")}</span>
            )}
            {member.roles.map((role) => (
              <span key={role.roleId} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
                {role.name}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-subtle">{t("usersAccess.accessSummary.permissions")}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {isOwner && (
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">
                {t("usersAccess.accessSummary.ownerFullAccess")}
              </span>
            )}
            {!isOwner && groups.length === 0 && (
              <span className="text-sm text-subtle">{t("usersAccess.accessSummary.noPermissions")}</span>
            )}
            {!isOwner &&
              groups.map((group) => (
                <span key={group} className="rounded-full bg-inset px-2 py-0.5 text-xs font-bold text-ink">
                  {group}
                </span>
              ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-subtle">{t("usersAccess.accessSummary.branchAccess")}</div>
          <div className="mt-1 text-sm text-muted">
            {summarizeBranches(t, member.branchAccessMode, member.selectedBranches)}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-subtle">{t("usersAccess.accessSummary.salesHistory")}</div>
          <div className="mt-1 text-sm text-muted">
            {isOwner
              ? t("usersAccess.accessSummary.ownerFullAccess")
              : salesScopeSummaryLabel(t, member.salesOrderVisibilityScope)}
          </div>
        </div>
      </div>
    </section>
  );
}

function AccessDialog({
  title,
  member,
  roles,
  branches,
  initial,
  canSave,
  isOwner,
  isSelfMember,
  companyId,
  onPinUpdated,
  actorPermissions,
  onSubmit,
  onClose,
  pending,
}) {
  const { t } = useI18n();
  const [roleIds, setRoleIds] = useState(initial.roleIds);
  const [branchAccessMode, setBranchAccessMode] = useState(
    initial.branchAccessMode,
  );
  const [selectedBranchIds, setSelectedBranchIds] = useState(
    initial.selectedBranchIds,
  );
  // Own/Branch is a real radio pair, but the underlying stored value can also be null (no explicit
  // scope set yet). null displays with "Branch" selected (behaviorally identical -- both mean
  // unrestricted within existing branch access), but `salesScopeTouched` tracks whether the admin
  // actually interacted with this control, so submit() never silently converts an untouched null
  // into an explicit "Branch" write -- only an actual click sends a value to the backend.
  const [salesScope, setSalesScope] = useState(
    initial.salesScope === "Own" ? "Own" : "Branch",
  );
  const [salesScopeTouched, setSalesScopeTouched] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (
      branchAccessMode === "SelectedBranches" &&
      selectedBranchIds.length === 0
    ) {
      setError(t("usersAccess.validation.selectBranch"));
      return;
    }
    setError("");
    try {
      await onSubmit({
        roleIds,
        branchAccessMode,
        selectedBranchIds,
        ...(member && salesScopeTouched ? { salesScope } : {}),
      });
    } catch (mutationError) {
      // The dialog is a full-screen overlay (Section 17: never "nothing happened") -- a failed
      // mutation must surface here, since the page's own ErrorState banner is hidden behind it.
      setError(getErrorMessage(mutationError, t));
    }
  };

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="space-y-5">
        {/* Section 13: a clean identity/status summary, not just an editable roles/branches form. */}
        {member && (
          <section className="grid gap-3 rounded-xl border border-line bg-raised p-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-bold text-subtle">
                {t("usersAccess.dialog.identity")}
              </div>
              <div className="font-bold text-ink">{member.displayName}</div>
              <div className="text-sm text-muted">{member.email}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-subtle">{t("usersAccess.dialog.status")}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <StatusBadge tone={statusTone(member.status)}>
                  {statusLabel(member.status, t)}
                </StatusBadge>
                {member.isOwner && <StatusBadge tone="info">{t("usersAccess.common.owner")}</StatusBadge>}
              </div>
            </div>
          </section>
        )}
        {member && <MemberAccessSummary member={member} roles={roles} />}
        <section>
          <h3 className="mb-2 text-sm font-black text-ink">{t("usersAccess.dialog.rolesHeading")}</h3>
          <RolePicker
            roles={roles}
            selectedIds={roleIds}
            setSelectedIds={setRoleIds}
            disabled={!canSave || pending || isOwner}
            actorPermissions={actorPermissions}
          />
        </section>
        <section>
          <h3 className="mb-2 text-sm font-black text-ink">{t("usersAccess.dialog.branchAccessHeading")}</h3>
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
        {/* Own/Branch is a CompanyMembership-level setting, not a role or invitation concept
            (Sections 6/8) -- only rendered for real membership management, never for the
            invitation dialog (which reuses AccessDialog without a `member`). */}
        {member && (
          <section>
            <h3 className="mb-2 text-sm font-black text-ink">
              {t("usersAccess.salesScope.title")}
            </h3>
            <SalesScopePicker
              scope={salesScope}
              setScope={(value) => {
                setSalesScope(value);
                setSalesScopeTouched(true);
              }}
              disabled={!canSave || pending}
              owner={isOwner}
            />
            {!isOwner && initial.salesScope == null && (
              <p className="mt-1.5 text-xs text-subtle">
                {t("usersAccess.salesScope.defaultNote")}
              </p>
            )}
          </section>
        )}
        {/* Manager PIN: visible when an admin (Users.Manage) manages someone ELSE's membership, or
            when viewing your own row (the backend allows self-service regardless of Users.Manage).
            Never shown as read-only "Set"/"Not Set" from server data -- no GET endpoint exposes
            PIN status at all, so this only ever offers the action and reports a confirmed result
            after a successful update in this session (see ManagerPinForm). */}
        {member && (canSave || isSelfMember) && (
          <section>
            <h3 className="mb-2 text-sm font-black text-ink">{t("usersAccess.pin.title")}</h3>
            {member.status !== "Active" ? (
              <p className="rounded-xl border border-warning bg-warning-soft p-3 text-sm text-warning">
                {t("usersAccess.pin.inactiveNotice")}
              </p>
            ) : (
              <ManagerPinForm
                key={`${companyId}-${member.membershipId}`}
                companyId={companyId}
                membershipId={member.membershipId}
                disabled={pending}
                onSuccess={onPinUpdated}
              />
            )}
          </section>
        )}
        {error && (
          <div className="rounded-xl border border-danger bg-danger-soft p-3 text-sm text-danger">
            {error}
          </div>
        )}
        {!canSave && (
          <div className="rounded-xl border border-warning bg-warning-soft p-3 text-sm text-warning">
            {t("usersAccess.notice.managePermissionRequired")}
          </div>
        )}
        <button
          type="button"
          disabled={!canSave || pending}
          onClick={submit}
          className="h-11 rounded-xl bg-accent px-5 text-sm font-black text-white disabled:opacity-50"
        >
          {pending ? t("usersAccess.common.saving") : t("usersAccess.action.saveAccess")}
        </button>
      </div>
    </Dialog>
  );
}

function InviteDialog({
  roles,
  branches,
  canManage,
  actorPermissions,
  onSubmit,
  onClose,
  pending,
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState(EMPTY_ACCESS);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.trim()) return setError(t("usersAccess.validation.emailRequired"));
    if (
      access.branchAccessMode === "SelectedBranches" &&
      access.selectedBranchIds.length === 0
    )
      return setError(t("usersAccess.validation.selectBranch"));
    setError("");
    try {
      await onSubmit({ email: email.trim(), ...access });
    } catch (mutationError) {
      setError(getErrorMessage(mutationError, t));
    }
  };

  return (
    <Dialog title={t("usersAccess.invite.dialogTitle")} onClose={onClose}>
      <div className="space-y-5">
        <label className="block text-sm font-bold text-muted">
          {t("usersAccess.field.email")}
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
          />
        </label>
        <section>
          <h3 className="mb-2 text-sm font-black text-ink">{t("usersAccess.dialog.rolesHeading")}</h3>
          <RolePicker
            roles={roles}
            selectedIds={access.roleIds}
            setSelectedIds={(ids) =>
              setAccess((draft) => ({ ...draft, roleIds: ids }))
            }
            disabled={!canManage || pending}
            actorPermissions={actorPermissions}
          />
        </section>
        <section>
          <h3 className="mb-2 text-sm font-black text-ink">{t("usersAccess.dialog.branchAccessHeading")}</h3>
          <BranchAccessPicker
            branches={branches}
            mode={access.branchAccessMode}
            selectedIds={access.selectedBranchIds}
            setMode={(mode) =>
              setAccess((draft) => ({ ...draft, branchAccessMode: mode }))
            }
            setSelectedIds={(ids) =>
              setAccess((draft) => ({ ...draft, selectedBranchIds: ids }))
            }
            disabled={!canManage || pending}
          />
        </section>
        {error && (
          <div className="rounded-xl border border-danger bg-danger-soft p-3 text-sm text-danger">
            {error}
          </div>
        )}
        <button
          type="button"
          disabled={!canManage || pending}
          onClick={submit}
          className="h-11 rounded-xl bg-accent px-5 text-sm font-black text-white disabled:opacity-50"
        >
          {pending ? t("usersAccess.common.sending") : t("usersAccess.action.sendInvitation")}
        </button>
      </div>
    </Dialog>
  );
}

// Creates an Active membership directly, with a password the caller sets here and hands to the
// new user out of band -- no email, no invitation-accept step. Same roles/branch-access pickers
// as InviteDialog, since the access being granted is the same; only how the account comes to
// exist differs.
function CreateMemberDirectlyDialog({
  roles,
  branches,
  canManage,
  actorPermissions,
  onSubmit,
  onClose,
  pending,
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [access, setAccess] = useState(EMPTY_ACCESS);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.trim()) return setError(t("usersAccess.validation.emailRequired"));
    if (!displayName.trim()) return setError(t("usersAccess.validation.nameRequired"));
    if (!password || password.length < 8)
      return setError(t("usersAccess.validation.passwordLength"));
    if (
      access.branchAccessMode === "SelectedBranches" &&
      access.selectedBranchIds.length === 0
    )
      return setError(t("usersAccess.validation.selectBranch"));
    setError("");
    try {
      await onSubmit({
        email: email.trim(),
        displayName: displayName.trim(),
        password,
        ...access,
      });
    } catch (mutationError) {
      setError(getErrorMessage(mutationError, t));
    }
  };

  return (
    <Dialog title={t("usersAccess.createMember.dialogTitle")} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-xs text-blue-100">
          {t("usersAccess.createMember.infoNotice")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-400">
            {t("usersAccess.field.name")}
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={!canManage || pending}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-50"
            />
          </label>
          <label className="text-xs font-bold text-slate-400">
            {t("usersAccess.field.email")}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!canManage || pending}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-50"
            />
          </label>
        </div>
        <label className="block text-xs font-bold text-slate-400">
          {t("usersAccess.field.password")}
          <input
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!canManage || pending}
            placeholder={t("usersAccess.field.passwordPlaceholder")}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-50"
          />
        </label>
        <section>
          <h3 className="mb-2 text-sm font-black text-white">{t("usersAccess.dialog.rolesHeading")}</h3>
          <RolePicker
            roles={roles}
            selectedIds={access.roleIds}
            setSelectedIds={(ids) =>
              setAccess((draft) => ({ ...draft, roleIds: ids }))
            }
            disabled={!canManage || pending}
            actorPermissions={actorPermissions}
          />
        </section>
        <section>
          <h3 className="mb-2 text-sm font-black text-white">{t("usersAccess.dialog.branchAccessHeading")}</h3>
          <BranchAccessPicker
            branches={branches}
            mode={access.branchAccessMode}
            selectedIds={access.selectedBranchIds}
            setMode={(mode) =>
              setAccess((draft) => ({ ...draft, branchAccessMode: mode }))
            }
            setSelectedIds={(ids) =>
              setAccess((draft) => ({ ...draft, selectedBranchIds: ids }))
            }
            disabled={!canManage || pending}
          />
        </section>
        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}
        <button
          type="button"
          disabled={!canManage || pending}
          onClick={submit}
          className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:opacity-50"
        >
          {pending ? t("usersAccess.common.creating") : t("usersAccess.action.createAccount")}
        </button>
      </div>
    </Dialog>
  );
}

// New password only -- the current one is never fetched or shown (the backend never exposes it
// either). The caller then hands the new password to the member out of band.
function ResetPasswordDialog({ member, onSubmit, onClose, pending }) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!password || password.length < 8)
      return setError(t("usersAccess.validation.passwordLength"));
    setError("");
    try {
      await onSubmit(password);
    } catch (mutationError) {
      setError(getErrorMessage(mutationError, t));
    }
  };

  return (
    <Dialog
      title={t("usersAccess.resetPassword.dialogTitle", { name: member.displayName })}
      onClose={onClose}
    >
      <div className="space-y-5">
        <label className="block text-xs font-bold text-slate-400">
          {t("usersAccess.field.newPassword")}
          <input
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            placeholder={t("usersAccess.field.passwordPlaceholder")}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-50"
          />
        </label>
        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:opacity-50"
        >
          {pending ? t("usersAccess.common.saving") : t("usersAccess.action.setNewPassword")}
        </button>
      </div>
    </Dialog>
  );
}

function RoleDialog({
  role,
  entitlements,
  canManage,
  actorPermissions,
  onSubmit,
  onClose,
  pending,
}) {
  const { t } = useI18n();
  const [name, setName] = useState(role?.name || "");
  const [code, setCode] = useState(role?.code || "");
  const [permissions, setPermissions] = useState(role?.permissions || []);
  const [error, setError] = useState("");
  const enabledEntitlements = new Set(
    (entitlements?.entitlements || [])
      .filter((item) => item.enabled)
      .map((item) => item.code),
  );

  const submit = async () => {
    setError("");
    try {
      await onSubmit({ code: code.trim(), name: name.trim(), permissions });
    } catch (mutationError) {
      setError(getErrorMessage(mutationError, t));
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
    <Dialog
      title={isEdit ? t("usersAccess.role.editTitle") : t("usersAccess.role.createTitle")}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-muted">
            {t("usersAccess.field.name")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!canManage || pending || role?.isSystem}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            />
          </label>
          <label className="text-sm font-bold text-muted">
            {t("usersAccess.field.code")}
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={!canManage || pending || isEdit}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            />
          </label>
        </div>
        {[...grouped.entries()].map(([group, items]) => (
          <section
            key={group}
            className="rounded-xl border border-line bg-raised p-3"
          >
            <h3 className="mb-2 text-sm font-black text-ink">{group}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((permission) => {
                const entitlement = getPermissionEntitlement(permission.code);
                const unavailable =
                  entitlement && !enabledEntitlements.has(entitlement);
                const notGrantable = !canActorGrantPermission(
                  actorPermissions,
                  permission.code,
                );
                return (
                  <label
                    key={permission.code}
                    className={`flex gap-2 text-sm ${unavailable || notGrantable ? "text-subtle" : "text-ink"}`}
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(permission.code)}
                      disabled={
                        !canManage ||
                        pending ||
                        role?.isSystem ||
                        unavailable ||
                        notGrantable
                      }
                      onChange={(event) =>
                        setPermissions(
                          event.target.checked
                            ? [...permissions, permission.code]
                            : permissions.filter(
                                (value) => value !== permission.code,
                              ),
                        )
                      }
                    />
                    <span>
                      {permission.label}
                      {unavailable && (
                        <span className="ms-2 text-xs text-warning">
                          {t("usersAccess.role.unavailable")}
                        </span>
                      )}
                      {!unavailable && notGrantable && (
                        <span className="ms-2 text-xs text-warning">
                          {t("usersAccess.role.notGrantablePermission")}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        {role?.isSystem && (
          <div className="rounded-xl border border-accent-line bg-accent-soft p-3 text-sm text-accent">
            {t("usersAccess.role.systemNotice")}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-danger bg-danger-soft p-3 text-sm text-danger">
            {error}
          </div>
        )}
        <button
          type="button"
          disabled={!canManage || pending || role?.isSystem}
          onClick={submit}
          className="h-11 rounded-xl bg-accent px-5 text-sm font-black text-white disabled:opacity-50"
        >
          {pending
            ? t("usersAccess.common.saving")
            : isEdit
              ? t("usersAccess.action.saveRole")
              : t("usersAccess.action.createRoleSubmit")}
        </button>
      </div>
    </Dialog>
  );
}

export default function UsersAccessPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { session } = useAuth();
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
  const canViewUsers = hasEffectivePermission(
    permissionsQuery.data,
    USERS_VIEW,
  );
  const canManageUsers = hasEffectivePermission(
    permissionsQuery.data,
    USERS_MANAGE,
  );
  const canViewRoles = hasEffectivePermission(
    permissionsQuery.data,
    ROLES_VIEW,
  );
  const canManageRoles = hasEffectivePermission(
    permissionsQuery.data,
    ROLES_MANAGE,
  );
  const canOpen =
    canViewUsers || canViewRoles || Boolean(permissionsQuery.data?.isOwner);

  const memberFilters = useMemo(
    () => ({
      status: memberStatus || undefined,
      search: memberSearch.trim() || undefined,
      pageNumber: 1,
      pageSize: 50,
    }),
    [memberSearch, memberStatus],
  );
  const invitationFilters = useMemo(
    () => ({
      status: inviteStatus || undefined,
      search: inviteSearch.trim() || undefined,
      pageNumber: 1,
      pageSize: 50,
    }),
    [inviteSearch, inviteStatus],
  );
  const membershipsQuery = useCompanyMemberships(
    currentCompanyId,
    memberFilters,
    canOpen && canViewUsers,
  );
  const invitationsQuery = useCompanyInvitations(
    currentCompanyId,
    invitationFilters,
    canOpen && canViewUsers,
  );
  const rolesQuery = useCompanyRoles(currentCompanyId, canOpen && canViewRoles);
  const branchesQuery = useTenantAdminBranches(
    currentCompanyId,
    canManageUsers,
  );
  const createInvite = useCreateInvitation(currentCompanyId);
  const createMemberDirectly = useCreateMemberDirectly(currentCompanyId);
  const resetMemberPassword = useResetMemberPassword(currentCompanyId);
  const updateInvite = useUpdateInvitation(currentCompanyId);
  const resendInvite = useResendInvitation(currentCompanyId);
  const cancelInvite = useCancelInvitation(currentCompanyId);
  const assignRoles = useAssignMembershipRoles(currentCompanyId);
  const updateBranchAccess = useUpdateMembershipBranchAccess(currentCompanyId);
  const updateSalesScope = useUpdateMembershipSalesScope(currentCompanyId);
  const changeStatus = useChangeMembershipStatus(currentCompanyId);
  const createRole = useCreateCompanyRole(currentCompanyId);
  const updateRole = useUpdateCompanyRole(currentCompanyId);
  const roles = rolesQuery.data || [];
  const branches = branchesQuery.data || [];
  const filteredRoles = roles.filter((role) =>
    `${role.name} ${role.code}`
      .toLowerCase()
      .includes(roleSearch.trim().toLowerCase()),
  );

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
    await assignRoles.mutateAsync({
      membershipId: membership.membershipId,
      payload: { roleIds: payload.roleIds },
    });
    await updateBranchAccess.mutateAsync({
      membershipId: membership.membershipId,
      payload: {
        branchAccessMode: payload.branchAccessMode,
        selectedBranchIds: payload.selectedBranchIds,
      },
    });
    // Only sent when the admin actually touched the Sales History Access control (AccessDialog
    // omits `salesScope` from the payload entirely otherwise) -- an untouched null-scoped member
    // must never be silently converted into an explicit "Branch" write just because roles or
    // branch access were edited in the same save.
    if (payload.salesScope !== undefined) {
      await updateSalesScope.mutateAsync({
        membershipId: membership.membershipId,
        payload: { scope: payload.salesScope },
      });
    }
    setDialog(null);
    setNotice(t("usersAccess.notice.memberAccessUpdated"));
  };

  const tabs = [
    { key: "members", label: t("usersAccess.tab.members"), visible: canViewUsers },
    { key: "invitations", label: t("usersAccess.tab.invitations"), visible: canViewUsers },
    { key: "roles", label: t("usersAccess.tab.roles"), visible: canViewRoles },
  ].filter((item) => item.visible);

  if (!currentCompanyId)
    return (
      <AppLayout>
        <EmptyState
          title={t("usersAccess.gate.selectCompany.title")}
          message={t("usersAccess.gate.selectCompany.message")}
        />
      </AppLayout>
    );
  if (permissionsQuery.isLoading)
    return (
      <AppLayout>
        <LoadingState label={t("usersAccess.gate.checkingAccess")} />
      </AppLayout>
    );
  if (!canOpen)
    return (
      <AppLayout>
        <EmptyState
          title={t("usersAccess.gate.unavailable.title")}
          message={t("usersAccess.gate.unavailable.message")}
        />
      </AppLayout>
    );

  return (
    <AppLayout>
      <PageHeader
        title={t("usersAccess.pageTitle")}
        actions={
          <>
            {canManageUsers && (
              <button
                onClick={() => setDialog({ type: "invite" })}
                className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-black text-white"
              >
                <UserPlus size={15} />
                {t("usersAccess.action.inviteUser")}
              </button>
            )}
            {canManageUsers && (
              <button
                onClick={() => setDialog({ type: "createMember" })}
                title={t("usersAccess.createMember.buttonTooltip")}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black text-white"
              >
                <UserCog size={15} />
                {t("usersAccess.action.createAccountDirectly")}
              </button>
            )}
            {canManageRoles && (
              <button
                onClick={() => setDialog({ type: "role" })}
                className="flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-4 text-sm font-black text-ink"
              >
                <ShieldCheck size={15} />
                {t("usersAccess.action.createRoleButton")}
              </button>
            )}
          </>
        }
      />
      <p className="mb-4 text-sm text-muted">
        {t("usersAccess.pageDescription")}
      </p>
      {notice && (
        <div className="mb-4 rounded-xl border border-success bg-success-soft p-3 text-sm text-success">
          {notice}
        </div>
      )}
      {showError && (
        <ErrorState
          title={t("usersAccess.error.title")}
          message={getErrorMessage(showError, t)}
        />
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold ${tab === item.key ? "border-accent-line bg-accent-soft text-ink" : "border-line bg-raised text-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "members" && canViewUsers && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="flex h-10 min-w-[240px] items-center gap-2 rounded-xl border border-line bg-canvas px-3 text-muted">
              <Search size={15} />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder={t("usersAccess.field.searchNameOrEmail")}
                className="w-full bg-transparent text-sm text-ink outline-none"
              />
            </div>
            <select
              value={memberStatus}
              onChange={(e) => setMemberStatus(e.target.value)}
              className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink"
            >
              <option value="">{t("usersAccess.common.allStatuses")}</option>
              <option value="Active">{t("usersAccess.status.active")}</option>
              <option value="Suspended">{t("usersAccess.status.suspended")}</option>
              <option value="Revoked">{t("usersAccess.status.revoked")}</option>
            </select>
          </div>
          {membershipsQuery.isLoading ? (
            <LoadingState label={t("usersAccess.loadingMembers")} />
          ) : membershipsQuery.data?.items.length ? (
            <div className="overflow-hidden rounded-xl border border-line">
              {membershipsQuery.data.items.map((member) => (
                <div
                  key={member.membershipId}
                  className="grid gap-3 border-b border-line bg-raised p-4 last:border-b-0 lg:grid-cols-[1.4fr_.8fr_1fr_1fr_auto]"
                >
                  <div>
                    <div className="font-black text-ink">
                      {member.displayName}
                    </div>
                    <div className="text-sm text-muted">{member.email}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={statusTone(member.status)}>
                      {statusLabel(member.status, t)}
                    </StatusBadge>
                    {member.isOwner && (
                      <StatusBadge tone="info">{t("usersAccess.common.owner")}</StatusBadge>
                    )}
                  </div>
                  <div className="text-sm text-muted">
                    {member.roles.map((role) => role.name).join(", ") ||
                      t("usersAccess.accessSummary.noRoles")}
                  </div>
                  <div className="text-sm text-muted">
                    {summarizeBranches(
                      t,
                      member.branchAccessMode,
                      member.selectedBranches,
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setDialog({ type: "member", member })}
                      className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink"
                    >
                      <Edit3 size={14} />
                    </button>
                    {canManageUsers && (
                      <button
                        title={t("usersAccess.action.resetPasswordTooltip")}
                        onClick={() => setDialog({ type: "resetPassword", member })}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white"
                      >
                        <KeyRound size={14} />
                      </button>
                    )}
                    {/* Owners are not blanket-excluded here (Section 2/15): the backend only
                        rejects Suspend/Revoke on the LAST active owner
                        (CompanyMembership.LastOwnerCannotBeSuspended/Revoked) -- a co-owner in a
                        multi-owner company can legitimately be suspended/revoked by another
                        owner/authorized admin. Attempting it on the sole owner still fails
                        cleanly via the backend error surfaced by `showError` above; nothing here
                        assumes the outcome. */}
                    {canManageUsers && member.status === "Active" && (
                      <button
                        onClick={() =>
                          window.confirm(
                            member.isOwner
                              ? t("usersAccess.confirm.suspendOwner")
                              : t("usersAccess.confirm.suspendMember"),
                          ) &&
                          changeStatus.mutate({
                            membershipId: member.membershipId,
                            action: "suspend",
                          })
                        }
                        className="rounded-lg border border-warning px-3 py-2 text-sm font-bold text-warning"
                      >
                        <Ban size={14} />
                      </button>
                    )}
                    {canManageUsers && member.status === "Suspended" && (
                      <button
                        onClick={() =>
                          changeStatus.mutate({
                            membershipId: member.membershipId,
                            action: "activate",
                          })
                        }
                        className="rounded-lg border border-success px-3 py-2 text-sm font-bold text-success"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                    {canManageUsers && member.status !== "Revoked" && (
                      <button
                        onClick={() =>
                          window.confirm(
                            member.isOwner
                              ? t("usersAccess.confirm.revokeOwner")
                              : t("usersAccess.confirm.revokeMember"),
                          ) &&
                          changeStatus.mutate({
                            membershipId: member.membershipId,
                            action: "revoke",
                          })
                        }
                        className="rounded-lg border border-danger px-3 py-2 text-sm font-bold text-danger"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("usersAccess.emptyMembers.title")}
              message={t("usersAccess.emptyMembers.message")}
            />
          )}
        </section>
      )}

      {tab === "invitations" && canViewUsers && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="flex h-10 min-w-[240px] items-center gap-2 rounded-xl border border-line bg-canvas px-3 text-muted">
              <Search size={15} />
              <input
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                placeholder={t("usersAccess.field.searchEmail")}
                className="w-full bg-transparent text-sm text-ink outline-none"
              />
            </div>
            <select
              value={inviteStatus}
              onChange={(e) => setInviteStatus(e.target.value)}
              className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink"
            >
              <option value="">{t("usersAccess.common.allStatuses")}</option>
              <option value="Pending">{t("usersAccess.status.pending")}</option>
              <option value="Accepted">{t("usersAccess.status.accepted")}</option>
              <option value="Cancelled">{t("usersAccess.status.cancelled")}</option>
              <option value="Expired">{t("usersAccess.status.expired")}</option>
            </select>
          </div>
          {invitationsQuery.isLoading ? (
            <LoadingState label={t("usersAccess.loadingInvitations")} />
          ) : invitationsQuery.data?.items.length ? (
            <div className="grid gap-3">
              {invitationsQuery.data.items.map((invite) => (
                <div
                  key={invite.invitationId}
                  className="rounded-xl border border-line bg-raised p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-ink">
                        {invite.email}
                      </div>
                      <div className="text-sm text-subtle">
                        {t("usersAccess.invite.invitedExpires", {
                          invited: formatDateTime(invite.createdAtUtc),
                          expires: formatDateTime(invite.expiresAtUtc),
                        })}
                      </div>
                    </div>
                    <StatusBadge tone={statusTone(invite.effectiveStatus)}>
                      {statusLabel(invite.effectiveStatus, t)}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-2">
                    <div>
                      {t("usersAccess.invite.rolesPrefix")}{" "}
                      {invite.roles.map((role) => role.name).join(", ") ||
                        t("usersAccess.accessSummary.noRoles")}
                    </div>
                    <div>
                      {t("usersAccess.invite.branchesPrefix")}{" "}
                      {summarizeBranches(
                        t,
                        invite.branchAccessMode,
                        invite.selectedBranches,
                      )}
                    </div>
                  </div>
                  {invite.effectiveStatus === "Pending" && canManageUsers && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          setDialog({ type: "invitation", invitation: invite })
                        }
                        className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-ink"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const result = await resendInvite.mutateAsync(
                              invite.invitationId,
                            );
                            setNotice(
                              result.emailSent
                                ? t("usersAccess.notice.invitationResent")
                                : t("usersAccess.notice.invitationUpdatedNoEmail"),
                            );
                          } catch {
                            /* surfaced via showError above (resendInvite.isError) */
                          }
                        }}
                        className="rounded-lg border border-accent-line px-3 py-2 text-sm font-bold text-accent"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() =>
                          window.confirm(t("usersAccess.confirm.cancelInvitation")) &&
                          cancelInvite.mutate(invite.invitationId)
                        }
                        className="rounded-lg border border-danger px-3 py-2 text-sm font-bold text-danger"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("usersAccess.emptyInvitations.title")}
              message={t("usersAccess.emptyInvitations.message")}
            />
          )}
        </section>
      )}

      {tab === "roles" && canViewRoles && (
        <section className="space-y-3">
          <div className="flex h-10 max-w-md items-center gap-2 rounded-xl border border-line bg-canvas px-3 text-muted">
            <Search size={15} />
            <input
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              placeholder={t("usersAccess.field.searchRoles")}
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </div>
          {rolesQuery.isLoading ? (
            <LoadingState label={t("usersAccess.loadingRoles")} />
          ) : filteredRoles.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredRoles.map((role) => (
                <button
                  key={role.roleId}
                  type="button"
                  onClick={() =>
                    !role.isSystem &&
                    canManageRoles &&
                    setDialog({ type: "role", role })
                  }
                  className="rounded-xl border border-line bg-raised p-4 text-start transition hover:border-accent-line"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-ink">{role.name}</div>
                      <div className="text-sm text-subtle">{role.code}</div>
                    </div>
                    <div className="flex gap-2">
                      {role.isSystem && (
                        <StatusBadge tone="info">{t("usersAccess.role.systemRoleBadge")}</StatusBadge>
                      )}
                      <StatusBadge tone={statusTone(role.status)}>
                        {statusLabel(role.status, t)}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-muted">
                    {t("usersAccess.role.permissionsCount", { count: role.permissions.length })}
                  </div>
                  {role.isSystem && (
                    <div className="mt-2 text-sm text-subtle">
                      {t("usersAccess.role.systemShortNotice")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("usersAccess.emptyRoles.title")}
              message={t("usersAccess.emptyRoles.message")}
            />
          )}
        </section>
      )}

      {dialog?.type === "invite" && (
        <InviteDialog
          roles={roles}
          branches={branches}
          canManage={canManageUsers}
          actorPermissions={permissionsQuery.data}
          pending={createInvite.isPending}
          onClose={() => setDialog(null)}
          onSubmit={async (payload) => {
            const result = await createInvite.mutateAsync(payload);
            setDialog(null);
            setNotice(
              result.emailSent
                ? t("usersAccess.notice.invitationSent")
                : t("usersAccess.notice.invitationCreatedNoEmail"),
            );
          }}
        />
      )}
      {dialog?.type === "createMember" && (
        <CreateMemberDirectlyDialog
          roles={roles}
          branches={branches}
          canManage={canManageUsers}
          actorPermissions={permissionsQuery.data}
          pending={createMemberDirectly.isPending}
          onClose={() => setDialog(null)}
          onSubmit={async (payload) => {
            await createMemberDirectly.mutateAsync(payload);
            setDialog(null);
            setNotice(t("usersAccess.notice.accountCreated"));
          }}
        />
      )}
      {dialog?.type === "resetPassword" && (
        <ResetPasswordDialog
          member={dialog.member}
          pending={resetMemberPassword.isPending}
          onClose={() => setDialog(null)}
          onSubmit={async (newPassword) => {
            await resetMemberPassword.mutateAsync({
              membershipId: dialog.member.membershipId,
              payload: { newPassword },
            });
            setDialog(null);
            setNotice(t("usersAccess.notice.passwordReset", { name: dialog.member.displayName }));
          }}
        />
      )}
      {dialog?.type === "member" && (
        <AccessDialog
          title={t("usersAccess.accessDialog.manageTitle", { name: dialog.member.displayName })}
          member={dialog.member}
          roles={roles}
          branches={branches}
          canSave={canManageUsers}
          isOwner={dialog.member.isOwner}
          isSelfMember={dialog.member.userId === session?.userId}
          companyId={currentCompanyId}
          onPinUpdated={() => setNotice(t("usersAccess.pin.updatedNotice"))}
          actorPermissions={permissionsQuery.data}
          pending={
            assignRoles.isPending ||
            updateBranchAccess.isPending ||
            updateSalesScope.isPending
          }
          initial={{
            roleIds: dialog.member.roles.map((role) => role.roleId),
            branchAccessMode: dialog.member.branchAccessMode,
            selectedBranchIds: dialog.member.selectedBranches.map(
              (branch) => branch.branchId,
            ),
            salesScope: dialog.member.salesOrderVisibilityScope,
          }}
          onClose={() => setDialog(null)}
          onSubmit={(payload) => submitAccess(dialog.member, payload)}
        />
      )}
      {dialog?.type === "invitation" && (
        <AccessDialog
          title={t("usersAccess.accessDialog.editInvitationTitle", { email: dialog.invitation.email })}
          roles={roles}
          branches={branches}
          canSave={canManageUsers}
          actorPermissions={permissionsQuery.data}
          pending={updateInvite.isPending}
          initial={{
            roleIds: dialog.invitation.roles.map((role) => role.roleId),
            branchAccessMode: dialog.invitation.branchAccessMode,
            selectedBranchIds: dialog.invitation.selectedBranches.map(
              (branch) => branch.branchId,
            ),
          }}
          onClose={() => setDialog(null)}
          onSubmit={async (payload) => {
            await updateInvite.mutateAsync({
              invitationId: dialog.invitation.invitationId,
              payload,
            });
            setDialog(null);
            setNotice(t("usersAccess.notice.invitationAccessUpdated"));
          }}
        />
      )}
      {dialog?.type === "role" && (
        <RoleDialog
          role={dialog.role}
          entitlements={entitlementsQuery.data}
          canManage={canManageRoles}
          actorPermissions={permissionsQuery.data}
          pending={createRole.isPending || updateRole.isPending}
          onClose={() => setDialog(null)}
          onSubmit={async (payload) => {
            if (dialog.role)
              await updateRole.mutateAsync({
                roleId: dialog.role.roleId,
                payload: {
                  name: payload.name,
                  status: dialog.role.status,
                  permissions: payload.permissions,
                },
              });
            else await createRole.mutateAsync(payload);
            setDialog(null);
            setNotice(dialog.role ? t("usersAccess.notice.roleUpdated") : t("usersAccess.notice.roleCreated"));
          }}
        />
      )}
    </AppLayout>
  );
}
