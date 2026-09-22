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
        aria-label={t(labelKey)}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive}
        className="nobo-sb-item"
      >
        <Icon size={20} className="nobo-sb-icon" />
        <span className="nobo-sb-tip">{t(labelKey)}</span>
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
    <button
      type="button"
      onClick={() => navigate(to)}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      className="nobo-sb-item"
    >
      <Icon size={20} className="nobo-sb-icon" />
      <span className="nobo-sb-label">{t(labelKey)}</span>
      {shortcutAction && <ShortcutHint action={shortcutAction} />}
    </button>
  );
}
