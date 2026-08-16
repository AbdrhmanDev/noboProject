import { useI18n } from "../i18n/I18nContext";
import { useCompany } from "../features/companies/context/CompanyContext";
import { useHasPermission } from "../features/companies/hooks/useCompanies";

export function PermissionNavItem({
  icon: Icon,
  labelKey,
  to,
  permission,
  activePath,
  navigate,
  variant = "desktop",
}) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const permissionQuery = useHasPermission(currentCompanyId, permission);
  const visible = Boolean(currentCompanyId) && permissionQuery.hasPermission;

  if (!visible) {
    return null;
  }

  const isActive = activePath === to;

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
      <span className={`font-semibold tracking-wide ${isActive ? "text-white" : ""}`}>{t(labelKey)}</span>
    </div>
  );
}
