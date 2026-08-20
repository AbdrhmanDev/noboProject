import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useSalesOrders } from "../../features/sales/hooks/useSalesOrders";
import { SalesOverviewView } from "../../features/sales/components/overview/SalesOverviewView";
import { SalesOrderStatusBadge } from "../../features/sales/components/SalesOrderStatusBadge";
import { SalesOrderPaymentBadge } from "../../features/sales/components/SalesOrderPaymentBadge";
import {
  fulfillmentLabelKey,
  latestOrderTimestamp,
  orderNumberDisplay,
} from "../../features/sales/utils/salesOrderFormatters";
import { customDateRange } from "../../features/sales/utils/dateRangePresets";
import { ROUTES, salesOrderDetailsPath } from "../../utils/routes";

const SALES_ORDERS_VIEW_PERMISSION = "SalesOrders.View";
const PAGE_SIZE = 25;
const STATUS_OPTIONS = ["Draft", "Confirmed", "Closed", "Cancelled"];
const FULFILLMENT_OPTIONS = ["DineIn", "Takeaway", "Delivery"];

function OrderTotalCell({ order }) {
  return <span>{formatMoney(order.payableAmount, order.currencyCode, order.currencyMinorUnitDigits)}</span>;
}

function FulfillmentLabel({ order, t }) {
  const key = fulfillmentLabelKey(order.fulfillmentType);
  const typeLabel = key ? t(key) : order.fulfillmentType || "—";
  const tableLabel =
    order.fulfillmentType === "DineIn" && order.restaurantTableCode
      ? ` · ${order.restaurantTableCode}`
      : "";

  return (
    <span>
      {typeLabel}
      {tableLabel}
    </span>
  );
}

function SalesOrdersView({ companyId, branchId, canQuery, onOpenOrder }) {
  const { t } = useI18n();

  const [status, setStatus] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [orderNumberSearch, setOrderNumberSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  // Debounced, server-side order-number search — never filters the already
  // fetched page client-side.
  useEffect(() => {
    const handle = setTimeout(() => {
      setOrderNumberSearch(searchInput.trim());
      setPageNumber(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const dateRange = useMemo(() => customDateRange(dateFrom, dateTo), [dateFrom, dateTo]);

  const filters = useMemo(
    () => ({
      pageNumber,
      pageSize: PAGE_SIZE,
      status,
      fulfillmentType,
      createdFromUtc: dateRange.fromUtc,
      createdToUtc: dateRange.toUtc,
      orderNumber: orderNumberSearch,
    }),
    [pageNumber, status, fulfillmentType, dateRange, orderNumberSearch],
  );

  const ordersQuery = useSalesOrders(companyId, branchId, filters, canQuery);
  const orders = ordersQuery.data?.items || [];

  const resetFilters = () => {
    setStatus("");
    setFulfillmentType("");
    setDateFrom("");
    setDateTo("");
    setSearchInput("");
    setOrderNumberSearch("");
    setPageNumber(1);
  };

  return (
    <>
      <section className="grid gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3 md:grid-cols-6">
        <label className="text-[11px] font-semibold text-slate-400 md:col-span-2">
          {t("salesOrders.search.placeholder")}
          <div className="mt-1 flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
            <Search size={13} className="shrink-0 text-slate-500" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("salesOrders.search.placeholder")}
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </label>
        <label className="text-[11px] font-semibold text-slate-400">
          {t("salesOrders.filters.status")}
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPageNumber(1);
            }}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          >
            <option value="">{t("salesOrders.filters.statusAll")}</option>
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`salesOrders.status.${value.charAt(0).toLowerCase()}${value.slice(1)}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-slate-400">
          {t("salesOrders.filters.fulfillment")}
          <select
            value={fulfillmentType}
            onChange={(event) => {
              setFulfillmentType(event.target.value);
              setPageNumber(1);
            }}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          >
            <option value="">{t("salesOrders.filters.fulfillmentAll")}</option>
            {FULFILLMENT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(fulfillmentLabelKey(value))}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-slate-400">
          {t("salesOrders.filters.dateFrom")}
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPageNumber(1);
            }}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          />
        </label>
        <label className="text-[11px] font-semibold text-slate-400">
          {t("salesOrders.filters.dateTo")}
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPageNumber(1);
            }}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          />
        </label>
        <button
          type="button"
          onClick={resetFilters}
          className="mt-auto h-10 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-bold text-slate-200 md:col-start-6"
        >
          {t("salesOrders.filters.reset")}
        </button>
      </section>

      <section className="mt-3 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-black text-white">{t("salesOrders.title")}</div>
          <div className="text-[11px] text-slate-500">
            {t("salesOrders.totalCount", { count: ordersQuery.data?.totalCount ?? 0 })}
          </div>
        </div>

        {ordersQuery.isLoading && <LoadingState label={t("salesOrders.loading")} />}
        {ordersQuery.isError && (
          <>
            <ErrorState
              title={t("salesOrders.error.title")}
              message={ordersQuery.error?.message || t("salesOrders.error.message")}
            />
            <button
              type="button"
              onClick={() => ordersQuery.refetch()}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
            >
              {t("salesOrders.retry")}
            </button>
          </>
        )}
        {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && (
          <EmptyState title={t("salesOrders.empty.title")} message={t("salesOrders.empty.message")} />
        )}

        {!ordersQuery.isLoading && !ordersQuery.isError && orders.length > 0 && (
          <>
            {/* Desktop: real table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-start text-slate-500">
                    <th className="pb-2 text-start font-medium">{t("salesOrders.table.orderNumber")}</th>
                    <th className="pb-2 text-start font-medium">{t("salesOrders.table.updated")}</th>
                    <th className="pb-2 text-start font-medium">{t("salesOrders.table.status")}</th>
                    <th className="pb-2 text-start font-medium">{t("salesOrders.table.type")}</th>
                    <th className="pb-2 text-start font-medium">{t("salesOrders.table.total")}</th>
                    <th className="pb-2 text-start font-medium">{t("salesOrders.table.payment")}</th>
                    <th className="pb-2 text-end font-medium">{t("salesOrders.table.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.salesOrderId}
                      onClick={() => onOpenOrder(order.salesOrderId)}
                      className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                    >
                      <td className="py-2.5 font-bold text-white">
                        {orderNumberDisplay(order.orderNumber, order.orderNumberFormatted)}
                      </td>
                      <td className="py-2.5 text-slate-300">
                        {formatDateTime(latestOrderTimestamp(order))}
                      </td>
                      <td className="py-2.5">
                        <SalesOrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-2.5 text-slate-300">
                        <FulfillmentLabel order={order} t={t} />
                      </td>
                      <td className="py-2.5 font-bold text-white">
                        <OrderTotalCell order={order} />
                      </td>
                      <td className="py-2.5">
                        <SalesOrderPaymentBadge
                          isFullyPaid={order.isFullyPaid}
                          netPaidAmount={order.netPaidAmount}
                          remainingAmount={order.remainingAmount}
                          currencyCode={order.currencyCode}
                          currencyMinorUnitDigits={order.currencyMinorUnitDigits}
                        />
                      </td>
                      <td className="py-2.5 text-end">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenOrder(order.salesOrderId);
                          }}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-500/10"
                        >
                          {t("salesOrders.view")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet/mobile: compact cards */}
            <div className="space-y-2 lg:hidden">
              {orders.map((order) => (
                <button
                  key={order.salesOrderId}
                  type="button"
                  onClick={() => onOpenOrder(order.salesOrderId)}
                  className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-[#0d1728] p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-black text-white">
                      {orderNumberDisplay(order.orderNumber, order.orderNumberFormatted)}
                    </span>
                    <SalesOrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <FulfillmentLabel order={order} t={t} />
                    <span className="text-sm font-black text-white">
                      <OrderTotalCell order={order} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <SalesOrderPaymentBadge
                      isFullyPaid={order.isFullyPaid}
                      netPaidAmount={order.netPaidAmount}
                      remainingAmount={order.remainingAmount}
                      currencyCode={order.currencyCode}
                      currencyMinorUnitDigits={order.currencyMinorUnitDigits}
                    />
                    <span className="text-[10px] text-slate-500">
                      {formatDateTime(latestOrderTimestamp(order))}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {ordersQuery.data && ordersQuery.data.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
              className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("salesOrders.pagination.previous")}
            </button>
            <span className="text-xs text-slate-400">
              {t("salesOrders.pagination.page", {
                current: ordersQuery.data.pageNumber,
                total: ordersQuery.data.totalPages,
              })}
            </span>
            <button
              type="button"
              disabled={pageNumber >= ordersQuery.data.totalPages}
              onClick={() => setPageNumber((page) => page + 1)}
              className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("salesOrders.pagination.next")}
            </button>
          </div>
        )}
      </section>
    </>
  );
}

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
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShoppingBag size={16} className="text-blue-300" />
                {t("nav.sales")}
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">{t("salesOrders.title")}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">{t("salesOrders.subtitle")}</p>
            </div>
            <div className="flex gap-1.5 rounded-xl border border-white/10 bg-black/10 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === "overview"
                    ? "bg-blue-500/20 text-blue-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t("salesOrders.tabs.overview")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === "orders"
                    ? "bg-blue-500/20 text-blue-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t("salesOrders.tabs.orders")}
              </button>
            </div>
          </div>
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
          <SalesOrdersView
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
