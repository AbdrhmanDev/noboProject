import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutGrid, List, Plus, Truck } from "lucide-react";
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
import {
  PURCHASE_ORDER_STATUS_LABEL_KEYS,
  purchaseOrderNumberDisplay,
} from "../../features/procurement/utils/procurementFormatters";
import { customDateRange, presetDateRange } from "../../features/sales/utils/dateRangePresets";
import { ControlPanel } from "../../shared/components/odoo/ControlPanel";
import { ListView } from "../../shared/components/odoo/ListView";
import { ROUTES, purchaseOrderDetailsPath } from "../../utils/routes";

const PURCHASES_VIEW_PERMISSION = "Purchases.View";
const PURCHASES_MANAGE_PERMISSION = "Purchases.Manage";
// Odoo's default page size for list views.
const PAGE_SIZE = 80;
const STATUS_OPTIONS = ["Draft", "Submitted", "PartiallyReceived", "Received", "Closed", "Cancelled"];
const DATE_PRESETS = ["today", "last7", "last30", "custom"];

function orderTotal(order) {
  return formatMoney(order.totalAmount, order.currencyCode, order.currencyMinorUnitDigits ?? undefined);
}

// Purchase orders, Odoo style (same building blocks as Sales orders): one control panel --
// search by PO number, Filters for status / supplier / created date, Group By, list <-> kanban,
// pager -- over a list or kanban view. Filters map 1:1 to the existing server-side query params
// (one status, one supplier, one date range), so each filter section behaves like a radio group.
// Group By regroups the loaded page (up to PAGE_SIZE orders); the API has no server-side grouping.
export default function PurchasesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState(searchParams.get("supplierId") || "");
  const [datePreset, setDatePreset] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [view, setView] = useState("list");
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

  // Filter menu needs the complete supplier set (any status, for historical filtering) — never
  // the paginated management-list query.
  const suppliersQuery = useAllSuppliers(currentCompanyId, {}, canQuery);
  const suppliers = useMemo(() => suppliersQuery.data || [], [suppliersQuery.data]);

  const dateRange = useMemo(() => {
    if (datePreset === "custom") return customDateRange(customFrom, customTo);
    return datePreset ? presetDateRange(datePreset) : {};
  }, [datePreset, customFrom, customTo]);

  const filters = useMemo(
    () => ({
      pageNumber,
      pageSize: PAGE_SIZE,
      status,
      supplierId,
      purchaseOrderNumber,
      createdFromUtc: dateRange.fromUtc,
      createdToUtc: dateRange.toUtc,
    }),
    [pageNumber, status, supplierId, purchaseOrderNumber, dateRange],
  );

  const poQuery = usePurchaseOrders(currentCompanyId, currentBranchId, filters, canQuery);
  const page = poQuery.data;
  const orders = useMemo(() => page?.items ?? [], [page]);

  const openOrder = (purchaseOrderId) => navigate(purchaseOrderDetailsPath(purchaseOrderId));
  const pick = (setter, current, value) => {
    setter(current === value ? "" : value);
    setPageNumber(1);
  };

  const selectedSupplier = suppliers.find((supplier) => supplier.supplierId === supplierId);
  const facets = [
    status && {
      id: "status",
      label: t(PURCHASE_ORDER_STATUS_LABEL_KEYS[status]),
      onRemove: () => pick(setStatus, status, status),
    },
    supplierId && {
      id: "supplier",
      label: selectedSupplier ? selectedSupplier.name : t("procurement.po.form.supplier"),
      onRemove: () => pick(setSupplierId, supplierId, supplierId),
    },
    datePreset && {
      id: "date",
      label: t(`salesOrders.overview.dateRange.${datePreset}`),
      onRemove: () => pick(setDatePreset, datePreset, datePreset),
    },
    groupBy && {
      id: "group",
      label: `${t("odoo.groupBy")}: ${t(`procurement.list.groupBy.${groupBy}`)}`,
      onRemove: () => setGroupBy(""),
    },
  ].filter(Boolean);

  const columns = [
    {
      key: "number",
      header: t("procurement.po.number"),
      render: (order) => (
        <span className="font-bold">
          {purchaseOrderNumberDisplay(order.purchaseOrderNumber, order.purchaseOrderNumberFormatted)}
        </span>
      ),
    },
    { key: "supplier", header: t("procurement.po.form.supplier"), render: (order) => order.supplierName },
    {
      key: "created",
      header: t("procurement.po.created"),
      render: (order) => <span className="text-muted">{formatDateTime(order.createdAtUtc)}</span>,
    },
    {
      key: "progress",
      header: t("procurement.receipt.progress"),
      align: "end",
      render: (order) => (
        <span className="text-muted">
          {order.totalReceivedQuantity} / {order.totalOrderedQuantity}
        </span>
      ),
    },
    {
      key: "total",
      header: t("procurement.po.total"),
      align: "end",
      render: (order) => <span className="font-bold">{orderTotal(order)}</span>,
      sum: (rows) =>
        rows.length
          ? formatMoney(
              rows.reduce((total, row) => total + Number(row.totalAmount), 0),
              rows[0].currencyCode,
              rows[0].currencyMinorUnitDigits ?? undefined,
            )
          : null,
    },
    { key: "status", header: t("procurement.filters.status"), render: (order) => <PurchaseOrderStatusBadge status={order.status} /> },
  ];

  const groups = useMemo(() => {
    if (!groupBy) return null;
    const map = new Map();
    for (const order of orders) {
      const key = groupBy === "status" ? order.status : order.supplierId || order.supplierName;
      const label = groupBy === "status" ? t(PURCHASE_ORDER_STATUS_LABEL_KEYS[order.status]) : order.supplierName;
      if (!map.has(key)) map.set(key, { key, label, rows: [] });
      map.get(key).rows.push(order);
    }
    return [...map.values()];
  }, [groupBy, orders, t]);

  const total = page?.totalCount ?? 0;
  const start = total ? (pageNumber - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(pageNumber * PAGE_SIZE, total);

  return (
    <AppLayout activePath={ROUTES.PURCHASES}>
      <main className="odoo-root space-y-3" dir="rtl">
        {/* Odoo-style app bar: module name. */}
        <header className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-[var(--shadow-surface)]">
          <div className="flex items-center gap-2 text-lg font-bold text-ink">
            <Truck size={18} className="text-accent" />
            {t("nav.purchases")}
          </div>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState title={t("procurement.companyRequired.title")} message={t("procurement.companyRequired.message")} />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("procurement.loading")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState title={t("procurement.permissionRequired.title")} message={t("procurement.permissionRequired.message")} />
        ) : (
          <>
            <ControlPanel
              breadcrumbs={[t("nav.purchases"), t("procurement.po.title")]}
              actions={
                canManage && (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.PURCHASE_ORDER_NEW)}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-bold text-white transition hover:bg-accent-strong"
                  >
                    <Plus size={14} />
                    {t("procurement.po.new")}
                  </button>
                )
              }
              search={{ value: searchInput, onChange: setSearchInput, placeholder: t("procurement.po.search") }}
              facets={facets}
              filters={[
                STATUS_OPTIONS.map((value) => ({
                  id: `status-${value}`,
                  label: t(PURCHASE_ORDER_STATUS_LABEL_KEYS[value]),
                  active: status === value,
                  onToggle: () => pick(setStatus, status, value),
                })),
                DATE_PRESETS.map((value) => ({
                  id: `date-${value}`,
                  label: t(`salesOrders.overview.dateRange.${value}`),
                  active: datePreset === value,
                  onToggle: () => pick(setDatePreset, datePreset, value),
                })),
                suppliers.map((supplier) => ({
                  id: `supplier-${supplier.supplierId}`,
                  label: `${supplier.code} — ${supplier.name}`,
                  active: supplierId === supplier.supplierId,
                  onToggle: () => pick(setSupplierId, supplierId, supplier.supplierId),
                })),
              ].filter((section) => section.length > 0)}
              groupBy={["status", "supplier"].map((value) => ({
                id: value,
                label: t(`procurement.list.groupBy.${value}`),
                active: groupBy === value,
                onSelect: () => setGroupBy((current) => (current === value ? "" : value)),
              }))}
              views={{
                current: view,
                onChange: setView,
                options: [
                  { id: "list", label: t("odoo.view.list"), icon: List },
                  { id: "kanban", label: t("odoo.view.kanban"), icon: LayoutGrid },
                ],
              }}
              pager={{
                start,
                end,
                total,
                onPrev: pageNumber > 1 ? () => setPageNumber((current) => current - 1) : undefined,
                onNext: page && pageNumber < page.totalPages ? () => setPageNumber((current) => current + 1) : undefined,
              }}
            />

            {datePreset === "custom" && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted">
                <label className="flex items-center gap-1.5">
                  {t("procurement.filters.dateFrom")}
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(event) => {
                      setCustomFrom(event.target.value);
                      setPageNumber(1);
                    }}
                    className="h-8 rounded-md border border-line bg-canvas px-2 text-ink outline-none focus:border-accent-line"
                  />
                </label>
                <label className="flex items-center gap-1.5">
                  {t("procurement.filters.dateTo")}
                  <input
                    type="date"
                    value={customTo}
                    onChange={(event) => {
                      setCustomTo(event.target.value);
                      setPageNumber(1);
                    }}
                    className="h-8 rounded-md border border-line bg-canvas px-2 text-ink outline-none focus:border-accent-line"
                  />
                </label>
              </div>
            )}

            {poQuery.isLoading && <LoadingState label={t("procurement.loading")} />}
            {poQuery.isError && (
              <ErrorState title={t("procurement.error.title")} message={poQuery.error?.message || t("procurement.error.message")} />
            )}

            {!poQuery.isLoading && !poQuery.isError && view === "list" && (
              <ListView
                columns={columns}
                rows={groups ? undefined : orders}
                groups={groups ?? undefined}
                getRowKey={(order) => order.purchaseOrderId}
                onRowClick={(order) => openOrder(order.purchaseOrderId)}
                emptyLabel={t("procurement.po.empty.message")}
              />
            )}

            {!poQuery.isLoading && !poQuery.isError && view === "kanban" && (
              orders.length === 0 ? (
                <EmptyState title={t("procurement.po.empty.title")} message={t("procurement.po.empty.message")} />
              ) : (
                <div className="space-y-4">
                  {(groups ?? [{ key: "all", label: null, rows: orders }]).map((group) => (
                    <div key={group.key}>
                      {group.label && (
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                          {group.label} <span className="pos-num font-normal text-subtle">({group.rows.length})</span>
                        </div>
                      )}
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2">
                        {group.rows.map((order) => (
                          <button
                            key={order.purchaseOrderId}
                            type="button"
                            onClick={() => openOrder(order.purchaseOrderId)}
                            className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 text-start shadow-[var(--shadow-surface)] transition hover:border-accent-line hover:bg-hover"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-ink">
                                {purchaseOrderNumberDisplay(order.purchaseOrderNumber, order.purchaseOrderNumberFormatted)}
                              </span>
                              <PurchaseOrderStatusBadge status={order.status} />
                            </div>
                            <div className="truncate text-xs text-muted">{order.supplierName}</div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="pos-num text-xs text-muted">
                                {order.totalReceivedQuantity} / {order.totalOrderedQuantity}
                              </span>
                              <span className="pos-num text-base font-black text-ink">{orderTotal(order)}</span>
                            </div>
                            <div className="text-[11px] text-subtle">{formatDateTime(order.createdAtUtc)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </main>
    </AppLayout>
  );
}
