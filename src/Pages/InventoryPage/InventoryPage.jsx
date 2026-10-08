import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { InventoryOperationsHeader } from "../../features/inventory/components/InventoryOperationsHeader";
import { StockPanel } from "../../features/inventory/components/StockPanel";
import { InventoryLedgerPanel } from "../../features/inventory/components/InventoryLedgerPanel";
import { InventoryOverviewPanel } from "../../features/inventory/components/InventoryOverviewPanel";

const INVENTORY_VIEW_PERMISSION = "Inventory.View";
const INVENTORY_ADJUST_STOCK_PERMISSION = "Inventory.AdjustStock";

export default function InventoryPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState("overview");
  // Movement type the Ledger opens pre-filtered on (from an Overview card / movement row).
  const [ledgerType, setLedgerType] = useState("");
  const openLedger = (transactionType = "") => {
    setLedgerType(transactionType);
    setTab("ledger");
  };
  const switchTab = (next) => {
    if (next === "ledger") setLedgerType("");
    setTab(next);
  };
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
      <main className="odoo-root space-y-3" dir="rtl">
        <InventoryOperationsHeader tab={tab} setTab={switchTab} />

        {notice && (
          <div className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-xs text-accent">
            {notice}
          </div>
        )}

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("inventory.gate.companyRequired.title")}
            message={t("inventory.gate.companyRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("inventory.gate.checkingPermissions")} />
        ) : !canView ? (
          <ErrorState
            title={t("inventory.gate.permissionRequired.title")}
            message={t("inventory.gate.permissionRequired.message")}
          />
        ) : tab === "overview" ? (
          <InventoryOverviewPanel
            companyId={currentCompanyId}
            branchId={currentBranchId}
            canView={canView}
            onOpenLedger={openLedger}
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
            key={ledgerType || "all"}
            initialTransactionType={ledgerType}
            companyId={currentCompanyId}
            branchId={currentBranchId}
            canView={canView}
          />
        )}
      </main>
    </AppLayout>
  );
}
