import { Boxes, Layers3, Wrench } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { ROUTES } from "../../../utils/routes";
import { NavGroup } from "../../../components/NavGroup";

const INVENTORY_VIEW_PERMISSION = "Inventory.View";
const INVENTORY_CONFIGURE_PERMISSION = "Inventory.Configure";

export function InventoryNavGroup({ activePath, navigate, variant = "desktop" }) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const viewPermissionQuery = useHasPermission(currentCompanyId, INVENTORY_VIEW_PERMISSION);
  const configurePermissionQuery = useHasPermission(
    currentCompanyId,
    INVENTORY_CONFIGURE_PERMISSION,
  );

  const canViewOperations = Boolean(currentCompanyId) && viewPermissionQuery.hasPermission;
  const canViewConfiguration = Boolean(currentCompanyId) && configurePermissionQuery.hasPermission;

  const items = [
    {
      to: ROUTES.INVENTORY,
      labelKey: "nav.inventoryOperations",
      icon: Layers3,
      visible: canViewOperations,
    },
    {
      to: ROUTES.INVENTORY_ADMIN,
      labelKey: "nav.inventoryConfiguration",
      icon: Wrench,
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
        <Boxes size={14} />
        {t("nav.inventory")}
      </button>
    );
  }

  return (
    <NavGroup
      icon={Boxes}
      labelKey="nav.inventory"
      activePath={activePath}
      navigate={navigate}
      items={items}
      shortcutAction="navigation.inventory"
    />
  );
}
