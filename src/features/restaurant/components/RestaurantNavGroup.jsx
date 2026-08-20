import { Armchair, CalendarClock, LayoutGrid, Settings } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { ROUTES } from "../../../utils/routes";
import { NavGroup } from "../../../components/NavGroup";

const RESTAURANT_VIEW_PERMISSION = "Restaurant.View";
const RESTAURANT_MANAGE_PERMISSION = "Restaurant.Manage";

// Mirrors KitchenNavGroup/InventoryNavGroup exactly: an Operations surface
// (this task's Floor/Tables view) and a Configuration surface (the existing
// RestaurantAdminPage), gated on the same View/Manage permissions the admin
// page itself already uses.
export function RestaurantNavGroup({ activePath, navigate, variant = "desktop" }) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const viewPermissionQuery = useHasPermission(currentCompanyId, RESTAURANT_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, RESTAURANT_MANAGE_PERMISSION);

  const canViewOperations = Boolean(currentCompanyId) && viewPermissionQuery.hasPermission;
  const canViewConfiguration = Boolean(currentCompanyId) && managePermissionQuery.hasPermission;

  const items = [
    {
      to: ROUTES.RESTAURANT_FLOOR,
      labelKey: "nav.restaurantFloor",
      icon: LayoutGrid,
      visible: canViewOperations,
    },
    {
      to: ROUTES.RESTAURANT_RESERVATIONS,
      labelKey: "nav.restaurantReservations",
      icon: CalendarClock,
      visible: canViewOperations,
    },
    {
      to: ROUTES.RESTAURANT_ADMIN,
      labelKey: "nav.restaurantConfiguration",
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
        <Armchair size={14} />
        {t("nav.restaurant")}
      </button>
    );
  }

  return (
    <NavGroup
      icon={Armchair}
      labelKey="nav.restaurant"
      activePath={activePath}
      navigate={navigate}
      items={items}
    />
  );
}
