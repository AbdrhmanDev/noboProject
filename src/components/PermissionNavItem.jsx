import { useI18n } from "../i18n/I18nContext";
import { useCompany } from "../features/companies/context/CompanyContext";
import { hasEffectivePermission, useCompanyPermissions, useHasEntitlement } from "../features/companies/hooks/useCompanies";
import { ShortcutHint } from "../features/shortcuts/components/ShortcutHint";

export function PermissionNavItem({
  icon: Icon,
  labelKey,
  to,
  permission,
  permissions,
  // Optional: a Commercial App/Capability code (see entitlementCodes.ts). Platform-foundation nav
  // items (Catalog, Pricing, Tax, Devices, Branches, ...) must never pass this -- only genuinely
  // commercial apps are gated by it. When present, visibility is Company-has-App AND User-has-
  // permission (section 14); omitting it leaves existing permission-only items unchanged.
  entitlement,
  activePath,
  navigate,
  variant = "desktop",
  shortcutAction,
  collapsed = false,
}) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const permissionQuery = useCompanyPermissions(currentCompanyId);
  const entitlementQuery = useHasEntitlement(currentCompanyId, entitlement ?? "");
  const requiredPermissions = permissions || (permission ? [permission] : []);
  const hasEntitlement = !entitlement || entitlementQuery.hasEntitlement;
  const hasPermission =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((requiredPermission) =>
      hasEffectivePermission(permissionQuery.data, requiredPermission),
    );
  const visible = Boolean(currentCompanyId) && hasPermission && hasEntitlement;

  if (!visible) {
    return null;
  }

  const isActive = activePath === to;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => navigate(to)}
        title={t(labelKey)}
        aria-label={t(labelKey)}
        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 hover:bg-blue-500/10 ${
          isActive ? "border border-blue-500/40 bg-blue-500/15" : ""
        }`}
      >
        <Icon size={20} color={isActive ? "#2b8cff" : "#60a5fa"} />
      </button>
    );
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={() => navigate(to)}
        className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
          isActive ? "border-blue-400/50 bg-blue-500/20 text-white" : "border-white/10 bg-white/5 text-gray-300"
        }`}
      >
        <Icon size={14} />
        {t(labelKey)}
      </button>
    );
  }

  return (
    <div
      onClick={() => navigate(to)}
      className={`group flex cursor-pointer items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-300 hover:border hover:border-blue-500/30 hover:bg-blue-500/10 ${
        isActive ? "border border-blue-500/40 bg-blue-500/15" : ""
      }`}
    >
      <Icon
        size={20}
        color={isActive ? "#2b8cff" : "#60a5fa"}
        className="shrink-0 transition group-hover:scale-110"
      />
      <span className={`flex-1 font-semibold tracking-wide ${isActive ? "text-white" : ""}`}>{t(labelKey)}</span>
      {shortcutAction && <ShortcutHint action={shortcutAction} />}
    </div>
  );
}
