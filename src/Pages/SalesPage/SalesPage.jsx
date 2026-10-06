import { useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { SalesOverviewView } from "../../features/sales/components/overview/SalesOverviewView";
import { SalesOrdersListView } from "../../features/sales/components/orders/SalesOrdersListView";
import { ROUTES, salesOrderDetailsPath } from "../../utils/routes";
import { SALES_ORDERS_VIEW_PERMISSION } from "../../features/authorization/constants/applicationPermissions";

const TABS = ["overview", "orders"];

export default function SalesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const activeTab = searchParams.get("tab") === "orders" ? "orders" : "overview";
  const setActiveTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "overview") next.delete("tab");
    else next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const permissionQuery = useHasPermission(currentCompanyId, SALES_ORDERS_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !permissionQuery.isLoading &&
    permissionQuery.hasPermission;

  const openOrder = (salesOrderId) => navigate(salesOrderDetailsPath(salesOrderId));

  return (
    <AppLayout activePath={ROUTES.SALES}>
      <main className="odoo-root space-y-3" dir="rtl">
        {/* Odoo-style app bar: module name + its menu (Overview / Orders) as tabs. */}
        <header className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-[var(--shadow-surface)]">
          <div className="flex items-center gap-2 text-lg font-bold text-ink">
            <ShoppingBag size={18} className="text-accent" />
            {t("nav.sales")}
          </div>
          <nav className="flex gap-1" aria-label={t("nav.sales")}>
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-current={activeTab === tab ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-sm font-bold transition ${
                  activeTab === tab ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-ink"
                }`}
              >
                {t(`salesOrders.tabs.${tab}`)}
              </button>
            ))}
          </nav>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("salesOrders.companyBranchRequired.title")}
            message={t("salesOrders.companyBranchRequired.message")}
          />
        ) : permissionQuery.isLoading ? (
          <LoadingState label={t("salesOrders.loading")} />
        ) : !permissionQuery.hasPermission ? (
          <ErrorState
            title={t("salesOrders.permissionRequired.title")}
            message={t("salesOrders.permissionRequired.message")}
          />
        ) : activeTab === "overview" ? (
          <SalesOverviewView companyId={currentCompanyId} branchId={currentBranchId} canQuery={canQuery} />
        ) : (
          <SalesOrdersListView
            companyId={currentCompanyId}
            branchId={currentBranchId}
            canQuery={canQuery}
            onOpenOrder={openOrder}
          />
        )}
      </main>
    </AppLayout>
  );
}
