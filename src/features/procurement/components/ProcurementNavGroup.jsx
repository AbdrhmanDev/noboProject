import { FileText, Truck as TruckIcon } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { ROUTES } from "../../../utils/routes";
import { NavGroup } from "../../../components/NavGroup";

const PURCHASES_VIEW_PERMISSION = "Purchases.View";

export function ProcurementNavGroup({ activePath, navigate, variant = "desktop" }) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const viewPermissionQuery = useHasPermission(currentCompanyId, PURCHASES_VIEW_PERMISSION);
  const canView = Boolean(currentCompanyId) && viewPermissionQuery.hasPermission;

  const items = [
    {
      to: ROUTES.PURCHASES,
      labelKey: "nav.purchaseOrders",
      icon: FileText,
      visible: canView,
    },
    {
      to: ROUTES.SUPPLIERS,
      labelKey: "nav.suppliers",
      icon: TruckIcon,
      visible: canView,
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
        <TruckIcon size={14} />
        {t("nav.purchases")}
      </button>
    );
  }

  return (
    <NavGroup icon={TruckIcon} labelKey="nav.purchases" activePath={activePath} navigate={navigate} items={items} />
  );
}
