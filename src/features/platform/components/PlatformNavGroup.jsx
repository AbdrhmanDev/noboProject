import { Building2, ShieldCheck } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useCurrentPlatformAccess } from "../hooks/usePlatform";
import { ROUTES } from "../../../utils/routes";
import { NavGroup } from "../../../components/NavGroup";

// NOT tenant navigation -- unlike every other NavGroup in this app, this one does NOT depend on
// currentCompanyId at all (a NOBO staff member does not need any company selected, or even any
// CompanyMembership, to use the Control Plane). Visibility is gated purely on platform staff
// status; a normal Company user (including a Company Owner) never sees this at all.
export function PlatformNavGroup({ activePath, navigate, variant = "desktop", collapsed = false }) {
  const { t } = useI18n();
  const accessQuery = useCurrentPlatformAccess();
  const isPlatformStaff = Boolean(accessQuery.data?.isPlatformStaff);

  const items = [
    {
      to: ROUTES.PLATFORM_COMPANIES,
      labelKey: "nav.platformCompanies",
      icon: Building2,
      visible: isPlatformStaff,
    },
  ];

  if (variant === "mobile") {
    const target = items.find((item) => item.visible);
    if (!target) return null;

    const isActive = activePath === target.to;
    return (
      <button
        type="button"
        onClick={() => navigate(target.to)}
        className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
          isActive ? "border-blue-400/50 bg-blue-500/20 text-white" : "border-white/10 bg-white/5 text-gray-300"
        }`}
      >
        <ShieldCheck size={14} />
        {t("nav.platform")}
      </button>
    );
  }

  return (
    <NavGroup
      icon={ShieldCheck}
      labelKey="nav.platform"
      activePath={activePath}
      navigate={navigate}
      items={items}
      collapsed={collapsed}
    />
  );
}
