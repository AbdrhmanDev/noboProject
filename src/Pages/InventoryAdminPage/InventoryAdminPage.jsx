import { useState } from "react";
import { Boxes, Layers3, MapPin } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../shared/components/ui";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { InventoryItemsPanel } from "../../features/inventory/components/InventoryItemsPanel";
import { InventoryLocationsPanel } from "../../features/inventory/components/InventoryLocationsPanel";
import { ConsumptionRulesPanel } from "../../features/inventory/components/ConsumptionRulesPanel";

const INVENTORY_VIEW_PERMISSION = "Inventory.View";
const INVENTORY_CONFIGURE_PERMISSION = "Inventory.Configure";

const TABS = [
  ["items", "Items", Boxes],
  ["locations", "Locations", MapPin],
  ["consumption", "Consumption Rules", Layers3],
];

export default function InventoryAdminPage() {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState("items");

  const viewPermissionQuery = useHasPermission(currentCompanyId, INVENTORY_VIEW_PERMISSION);
  const configurePermissionQuery = useHasPermission(
    currentCompanyId,
    INVENTORY_CONFIGURE_PERMISSION,
  );
  const canView =
    Boolean(currentCompanyId) && !viewPermissionQuery.isLoading && viewPermissionQuery.hasPermission;
  const canConfigure =
    Boolean(currentCompanyId) &&
    !configurePermissionQuery.isLoading &&
    configurePermissionQuery.hasPermission;

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader title="Inventory Configuration" />

        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-2">
          {TABS.map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === value ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company to configure inventory." />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking Inventory permissions..." />
        ) : !canView ? (
          <ErrorState
            title="Permission required"
            message="Inventory.View permission is required to view inventory configuration."
          />
        ) : tab === "items" ? (
          <InventoryItemsPanel
            companyId={currentCompanyId}
            canView={canView}
            canConfigure={canConfigure}
          />
        ) : tab === "locations" ? (
          <InventoryLocationsPanel
            companyId={currentCompanyId}
            branchId={currentBranchId}
            canView={canView}
            canConfigure={canConfigure}
          />
        ) : (
          <ConsumptionRulesPanel
            companyId={currentCompanyId}
            canView={canView}
            canConfigure={canConfigure}
          />
        )}
      </main>
    </AppLayout>
  );
}
