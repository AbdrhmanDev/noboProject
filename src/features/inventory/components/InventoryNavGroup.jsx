import { useState } from "react";
import { Boxes, ChevronDown, ChevronUp, Layers3, Wrench } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { ROUTES } from "../../../utils/routes";

const INVENTORY_VIEW_PERMISSION = "Inventory.View";
const INVENTORY_CONFIGURE_PERMISSION = "Inventory.Configure";

export function InventoryNavGroup({ activePath, navigate }) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const viewPermissionQuery = useHasPermission(currentCompanyId, INVENTORY_VIEW_PERMISSION);
  const configurePermissionQuery = useHasPermission(
    currentCompanyId,
    INVENTORY_CONFIGURE_PERMISSION,
  );
  const [manualExpanded, setManualExpanded] = useState(false);

  const canViewOperations = Boolean(currentCompanyId) && viewPermissionQuery.hasPermission;
  const canViewConfiguration = Boolean(currentCompanyId) && configurePermissionQuery.hasPermission;

  if (!canViewOperations && !canViewConfiguration) {
    return null;
  }

  const isGroupActive = activePath === ROUTES.INVENTORY || activePath === ROUTES.INVENTORY_ADMIN;
  const expanded = manualExpanded || isGroupActive;

  return (
    <div>
      <div
        onClick={() => setManualExpanded((value) => !value)}
        className={`group flex cursor-pointer items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-300 hover:border hover:border-blue-500/30 hover:bg-blue-500/10 ${
          isGroupActive ? "border border-blue-500/40 bg-blue-500/15" : ""
        }`}
      >
        <Boxes
          size={20}
          color={isGroupActive ? "#2b8cff" : "#60a5fa"}
          className="shrink-0 transition group-hover:scale-110"
        />
        <span className={`flex-1 font-semibold tracking-wide ${isGroupActive ? "text-white" : ""}`}>
          {t("nav.inventory")}
        </span>
        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-gray-500" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-gray-500" />
        )}
      </div>
      {expanded && (
        <div className="mt-1 space-y-1 pr-3">
          {canViewOperations && (
            <div
              onClick={() => navigate(ROUTES.INVENTORY)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 hover:bg-blue-500/10 ${
                activePath === ROUTES.INVENTORY ? "bg-blue-500/15 text-white" : "text-gray-400"
              }`}
            >
              <Layers3 size={16} className="shrink-0" />
              <span>{t("nav.inventoryOperations")}</span>
            </div>
          )}
          {canViewConfiguration && (
            <div
              onClick={() => navigate(ROUTES.INVENTORY_ADMIN)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 hover:bg-blue-500/10 ${
                activePath === ROUTES.INVENTORY_ADMIN ? "bg-blue-500/15 text-white" : "text-gray-400"
              }`}
            >
              <Wrench size={16} className="shrink-0" />
              <span>{t("nav.inventoryConfiguration")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
