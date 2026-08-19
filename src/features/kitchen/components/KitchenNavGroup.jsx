import { ChefHat, Flame, Settings } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { ROUTES } from "../../../utils/routes";
import { NavGroup } from "../../../components/NavGroup";

const KITCHEN_VIEW_PERMISSION = "Kitchen.View";
const KITCHEN_MANAGE_PERMISSION = "Kitchen.Manage";

export function KitchenNavGroup({ activePath, navigate, variant = "desktop" }) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const viewPermissionQuery = useHasPermission(currentCompanyId, KITCHEN_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, KITCHEN_MANAGE_PERMISSION);

  const canViewOperations = Boolean(currentCompanyId) && viewPermissionQuery.hasPermission;
  const canViewConfiguration = Boolean(currentCompanyId) && managePermissionQuery.hasPermission;

  const items = [
    {
      to: ROUTES.KITCHEN,
      labelKey: "nav.kitchenOperations",
      icon: Flame,
      visible: canViewOperations,
    },
    {
      to: ROUTES.KITCHEN_ADMIN,
      labelKey: "nav.kitchenConfiguration",
      icon: Settings,
      visible: canViewConfiguration,
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
        <ChefHat size={14} />
        {t("nav.kitchen")}
      </button>
    );
  }

  return (
    <NavGroup
      icon={ChefHat}
      labelKey="nav.kitchen"
      activePath={activePath}
      navigate={navigate}
      items={items}
      shortcutAction="navigation.kitchen"
    />
  );
}
