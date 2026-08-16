import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../shared/components/ui";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { InventoryOperationsHeader } from "../../features/inventory/components/InventoryOperationsHeader";
import { StockPanel } from "../../features/inventory/components/StockPanel";
import { InventoryLedgerPanel } from "../../features/inventory/components/InventoryLedgerPanel";

const INVENTORY_VIEW_PERMISSION = "Inventory.View";
const INVENTORY_ADJUST_STOCK_PERMISSION = "Inventory.AdjustStock";

export default function InventoryPage() {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState("stock");
  const [notice, setNotice] = useState("");

  const viewPermissionQuery = useHasPermission(currentCompanyId, INVENTORY_VIEW_PERMISSION);
  const adjustPermissionQuery = useHasPermission(
    currentCompanyId,
    INVENTORY_ADJUST_STOCK_PERMISSION,
  );
  const canView =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canAdjust =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !adjustPermissionQuery.isLoading &&
    adjustPermissionQuery.hasPermission;

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader title="Inventory Operations" />

        <InventoryOperationsHeader tab={tab} setTab={setTab} />

        {notice && (
          <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
            {notice}
          </div>
        )}

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title="Company and branch required"
            message="Select a company and branch to view inventory operations."
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking Inventory permissions..." />
        ) : !canView ? (
          <ErrorState
            title="Permission required"
            message="Inventory.View permission is required to view inventory operations."
          />
        ) : tab === "stock" ? (
          <StockPanel
            companyId={currentCompanyId}
            branchId={currentBranchId}
            canView={canView}
            canAdjust={canAdjust}
            notify={notify}
          />
        ) : (
          <InventoryLedgerPanel
            companyId={currentCompanyId}
            branchId={currentBranchId}
            canView={canView}
          />
        )}
      </main>
    </AppLayout>
  );
}
