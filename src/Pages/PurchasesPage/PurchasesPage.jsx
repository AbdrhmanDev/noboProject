import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, Truck } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useAllSuppliers } from "../../features/procurement/hooks/useSuppliers";
import { usePurchaseOrders } from "../../features/procurement/hooks/usePurchaseOrders";
import { PurchaseOrderStatusBadge } from "../../features/procurement/components/PurchaseOrderStatusBadge";
import { purchaseOrderNumberDisplay } from "../../features/procurement/utils/procurementFormatters";
import { ROUTES, purchaseOrderDetailsPath } from "../../utils/routes";

const PURCHASES_VIEW_PERMISSION = "Purchases.View";
const PURCHASES_MANAGE_PERMISSION = "Purchases.Manage";
const PAGE_SIZE = 25;
const STATUS_OPTIONS = ["Draft", "Submitted", "PartiallyReceived", "Received", "Closed", "Cancelled"];

function toStartOfDayUtc(value) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

// Half-open [from, to) — next-day-exclusive boundary, never 23:59:59.999.
function toNextDayUtc(value) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export default function PurchasesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState(searchParams.get("supplierId") || "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  const viewPermissionQuery = useHasPermission(currentCompanyId, PURCHASES_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, PURCHASES_MANAGE_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;

  // Debounced, server-side PO-number search — never filters the fetched page.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPurchaseOrderNumber(searchInput.trim());
      setPageNumber(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Filter dropdown needs the complete supplier set (any status, for
  // historical filtering) — never the paginated management-list query.
  const suppliersQuery = useAllSuppliers(currentCompanyId, {}, canQuery);
  const suppliers = suppliersQuery.data || [];

  const filters = useMemo(
    () => ({
      pageNumber,
      pageSize: PAGE_SIZE,
      status,
      supplierId,
      purchaseOrderNumber,
      createdFromUtc: toStartOfDayUtc(dateFrom),
      createdToUtc: toNextDayUtc(dateTo),
    }),
    [pageNumber, status, supplierId, purchaseOrderNumber, dateFrom, dateTo],
  );

  const poQuery = usePurchaseOrders(currentCompanyId, currentBranchId, filters, canQuery);
  const orders = poQuery.data?.items || [];

  const resetFilters = () => {
    setStatus("");
    setSupplierId("");
    setDateFrom("");
    setDateTo("");
    setSearchInput("");
    setPurchaseOrderNumber("");
    setPageNumber(1);
  };

  const openOrder = (purchaseOrderId) => navigate(purchaseOrderDetailsPath(purchaseOrderId));

  return (
    <AppLayout activePath={ROUTES.PURCHASES}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Truck size={16} className="text-blue-300" />
                {t("nav.purchases")}
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">{t("procurement.po.title")}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">{t("procurement.po.subtitle")}</p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.PURCHASE_ORDER_NEW)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
              >
                <Plus size={14} />
                {t("procurement.po.new")}
              </button>
            )}
          </div>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("procurement.companyRequired.title")}
            message={t("procurement.companyRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("procurement.loading")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title={t("procurement.permissionRequired.title")}
            message={t("procurement.permissionRequired.message")}
          />
        ) : (
          <>
            <section className="grid gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3 md:grid-cols-6">
              <label className="text-[11px] font-semibold text-slate-400 md:col-span-2">
                {t("procurement.po.search")}
                <div className="mt-1 flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
                  <Search size={13} className="shrink-0 text-slate-500" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={t("procurement.po.search")}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("procurement.filters.status")}
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPageNumber(1);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("procurement.filters.statusAll")}</option>
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`procurement.po.status.${value.charAt(0).toLowerCase()}${value.slice(1)}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("procurement.po.form.supplier")}
                <select
                  value={supplierId}
                  onChange={(event) => {
                    setSupplierId(event.target.value);
                    setPageNumber(1);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("procurement.filters.supplierAll")}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.supplierId} value={supplier.supplierId}>
                      {supplier.code} — {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("procurement.filters.dateFrom")}
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
                {t("procurement.filters.dateTo")}
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
                {t("procurement.filters.reset")}
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-black text-white">{t("procurement.po.title")}</div>
                <div className="text-[11px] text-slate-500">
                  {t("procurement.totalCount", { count: poQuery.data?.totalCount ?? 0 })}
                </div>
              </div>

              {poQuery.isLoading && <LoadingState label={t("procurement.loading")} />}
              {poQuery.isError && (
                <>
                  <ErrorState
                    title={t("procurement.error.title")}
                    message={poQuery.error?.message || t("procurement.error.message")}
                  />
                  <button
                    type="button"
                    onClick={() => poQuery.refetch()}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
                  >
                    {t("procurement.retry")}
                  </button>
                </>
              )}
              {!poQuery.isLoading && !poQuery.isError && orders.length === 0 && (
                <EmptyState title={t("procurement.po.empty.title")} message={t("procurement.po.empty.message")} />
              )}

              {!poQuery.isLoading && !poQuery.isError && orders.length > 0 && (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-start text-slate-500">
                          <th className="pb-2 text-start font-medium">{t("procurement.po.number")}</th>
                          <th className="pb-2 text-start font-medium">{t("procurement.po.form.supplier")}</th>
                          <th className="pb-2 text-start font-medium">{t("procurement.filters.status")}</th>
                          <th className="pb-2 text-start font-medium">{t("procurement.po.total")}</th>
                          <th className="pb-2 text-start font-medium">{t("procurement.receipt.progress")}</th>
                          <th className="pb-2 text-start font-medium">{t("procurement.po.created")}</th>
                          <th className="pb-2 text-end font-medium">{t("procurement.actions.view")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr
                            key={order.purchaseOrderId}
                            onClick={() => openOrder(order.purchaseOrderId)}
                            className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                          >
                            <td className="py-2.5 font-bold text-white">
                              {purchaseOrderNumberDisplay(order.purchaseOrderNumber, order.purchaseOrderNumberFormatted)}
                            </td>
                            <td className="py-2.5 text-slate-200">{order.supplierName}</td>
                            <td className="py-2.5">
                              <PurchaseOrderStatusBadge status={order.status} />
                            </td>
                            <td className="py-2.5 font-bold text-white">
                              {formatMoney(order.totalAmount, order.currencyCode, order.currencyMinorUnitDigits ?? undefined)}
                            </td>
                            <td className="py-2.5 text-slate-300">
                              {order.totalReceivedQuantity} / {order.totalOrderedQuantity}
                            </td>
                            <td className="py-2.5 text-slate-300">{formatDateTime(order.createdAtUtc)}</td>
                            <td className="py-2.5 text-end">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openOrder(order.purchaseOrderId);
                                }}
                                className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-500/10"
                              >
                                {t("procurement.actions.view")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2 lg:hidden">
                    {orders.map((order) => (
                      <button
                        key={order.purchaseOrderId}
                        type="button"
                        onClick={() => openOrder(order.purchaseOrderId)}
                        className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-[#0d1728] p-3 text-start transition hover:border-blue-400/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-white">
                            {purchaseOrderNumberDisplay(order.purchaseOrderNumber, order.purchaseOrderNumberFormatted)}
                          </span>
                          <PurchaseOrderStatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span>{order.supplierName}</span>
                          <span className="font-bold text-white">
                            {formatMoney(order.totalAmount, order.currencyCode, order.currencyMinorUnitDigits ?? undefined)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{formatDateTime(order.createdAtUtc)}</span>
                          <span>
                            {order.totalReceivedQuantity} / {order.totalOrderedQuantity}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {poQuery.data && poQuery.data.totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                    className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("procurement.pagination.previous")}
                  </button>
                  <span className="text-xs text-slate-400">
                    {t("procurement.pagination.page", {
                      current: poQuery.data.pageNumber,
                      total: poQuery.data.totalPages,
                    })}
                  </span>
                  <button
                    type="button"
                    disabled={pageNumber >= poQuery.data.totalPages}
                    onClick={() => setPageNumber((page) => page + 1)}
                    className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("procurement.pagination.next")}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </AppLayout>
  );
}
