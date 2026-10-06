import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../../../shared/utils/formatters";
import { useI18n } from "../../../../i18n/I18nContext";
import { ControlPanel } from "../../../../shared/components/odoo/ControlPanel";
import { ListView } from "../../../../shared/components/odoo/ListView";
import { StatusPill } from "../../../../shared/components/odoo/StatusBar";
import { useSalesOrders } from "../../hooks/useSalesOrders";
import {
  derivePaymentStatus,
  fulfillmentLabelKey,
  latestOrderTimestamp,
  orderNumberDisplay,
  SALES_STATUS_PILL_TONE,
} from "../../utils/salesOrderFormatters";
import { customDateRange, presetDateRange } from "../../utils/dateRangePresets";

// Odoo's default page size for list views.
const PAGE_SIZE = 80;
const STATUSES = ["Draft", "Confirmed", "Closed", "Cancelled"];
const FULFILLMENTS = ["DineIn", "Takeaway", "Delivery"];
const DATE_PRESETS = ["today", "last7", "last30"];

const PAYMENT_TONE = { paid: "success", partiallyPaid: "warning", unpaid: "neutral" };

const statusKey = (status) => `salesOrders.status.${status.charAt(0).toLowerCase()}${status.slice(1)}`;

function money(order, amount = order.payableAmount) {
  return formatMoney(amount, order.currencyCode, order.currencyMinorUnitDigits);
}

function OrderPaymentPill({ order }) {
  const { t } = useI18n();
  const payment = derivePaymentStatus(order.isFullyPaid, order.netPaidAmount);
  if (!payment) return null;
  return <StatusPill tone={PAYMENT_TONE[payment]}>{t(`salesOrders.payment.${payment}`)}</StatusPill>;
}

function fulfillmentText(order, t) {
  const key = fulfillmentLabelKey(order.fulfillmentType);
  const type = key ? t(key) : order.fulfillmentType || "—";
  return order.fulfillmentType === "DineIn" && order.restaurantTableCode ? `${type} · ${order.restaurantTableCode}` : type;
}

// Sales orders, Odoo style: one control panel (search by order number, Filters for status / order
// type / date, Group By, list <-> kanban, pager) over a list or kanban view. Filters map 1:1 to the
// existing server-side query params (one status, one order type, one date range -- the API takes
// one of each, so each filter section behaves like a radio group). Group By regroups the page
// that's loaded (up to PAGE_SIZE orders), since the API has no server-side grouping.
export function SalesOrdersListView({ companyId, branchId, canQuery, onOpenOrder }) {
  const { t } = useI18n();

  const [status, setStatus] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [datePreset, setDatePreset] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [orderNumberSearch, setOrderNumberSearch] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [view, setView] = useState("list");
  const [pageNumber, setPageNumber] = useState(1);

  // Debounced, server-side order-number search -- never filters the fetched page client-side.
  useEffect(() => {
    const handle = setTimeout(() => {
      setOrderNumberSearch(searchInput.trim());
      setPageNumber(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const dateRange = useMemo(() => {
    if (datePreset === "custom") return customDateRange(customFrom, customTo);
    return datePreset ? presetDateRange(datePreset) : {};
  }, [datePreset, customFrom, customTo]);

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
  const page = ordersQuery.data;
  const orders = useMemo(() => page?.items ?? [], [page]);

  const pick = (setter, current, value) => {
    setter(current === value ? "" : value);
    setPageNumber(1);
  };

  const facets = [
    status && { id: "status", label: t(statusKey(status)), onRemove: () => pick(setStatus, status, status) },
    fulfillmentType && {
      id: "type",
      label: t(fulfillmentLabelKey(fulfillmentType)),
      onRemove: () => pick(setFulfillmentType, fulfillmentType, fulfillmentType),
    },
    datePreset && {
      id: "date",
      label: t(`salesOrders.overview.dateRange.${datePreset}`),
      onRemove: () => pick(setDatePreset, datePreset, datePreset),
    },
    groupBy && {
      id: "group",
      label: `${t("odoo.groupBy")}: ${t(`salesOrders.list.groupBy.${groupBy}`)}`,
      onRemove: () => setGroupBy(""),
    },
  ].filter(Boolean);

  const columns = [
    {
      key: "number",
      header: t("salesOrders.table.orderNumber"),
      render: (order) => <span className="font-bold">{orderNumberDisplay(order.orderNumber, order.orderNumberFormatted)}</span>,
    },
    {
      key: "date",
      header: t("salesOrders.table.updated"),
      render: (order) => <span className="text-muted">{formatDateTime(latestOrderTimestamp(order))}</span>,
    },
    { key: "type", header: t("salesOrders.table.type"), render: (order) => fulfillmentText(order, t) },
    {
      key: "total",
      header: t("salesOrders.table.total"),
      align: "end",
      render: (order) => <span className="font-bold">{money(order)}</span>,
      sum: (rows) => (rows.length ? money(rows[0], rows.reduce((total, row) => total + Number(row.payableAmount), 0)) : null),
    },
    { key: "payment", header: t("salesOrders.table.payment"), render: (order) => <OrderPaymentPill order={order} /> },
    {
      key: "status",
      header: t("salesOrders.table.status"),
      render: (order) => <StatusPill tone={SALES_STATUS_PILL_TONE[order.status]}>{t(statusKey(order.status))}</StatusPill>,
    },
  ];

  const groups = useMemo(() => {
    if (!groupBy) return null;
    const map = new Map();
    for (const order of orders) {
      let key;
      let label;
      if (groupBy === "status") {
        key = order.status;
        label = t(statusKey(order.status));
      } else if (groupBy === "type") {
        key = order.fulfillmentType || "none";
        label = fulfillmentLabelKey(order.fulfillmentType) ? t(fulfillmentLabelKey(order.fulfillmentType)) : "—";
      } else {
        key = order.createdAtUtc.slice(0, 10);
        label = new Date(order.createdAtUtc).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
      }
      if (!map.has(key)) map.set(key, { key, label, rows: [] });
      map.get(key).rows.push(order);
    }
    return [...map.values()];
  }, [groupBy, orders, t]);

  const total = page?.totalCount ?? 0;
  const start = total ? (pageNumber - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(pageNumber * PAGE_SIZE, total);

  return (
    <div className="space-y-3">
      <ControlPanel
        breadcrumbs={[t("nav.sales"), t("salesOrders.tabs.orders")]}
        search={{ value: searchInput, onChange: setSearchInput, placeholder: t("salesOrders.search.placeholder") }}
        facets={facets}
        filters={[
          STATUSES.map((value) => ({
            id: `status-${value}`,
            label: t(statusKey(value)),
            active: status === value,
            onToggle: () => pick(setStatus, status, value),
          })),
          FULFILLMENTS.map((value) => ({
            id: `type-${value}`,
            label: t(fulfillmentLabelKey(value)),
            active: fulfillmentType === value,
            onToggle: () => pick(setFulfillmentType, fulfillmentType, value),
          })),
          [...DATE_PRESETS, "custom"].map((value) => ({
            id: `date-${value}`,
            label: t(`salesOrders.overview.dateRange.${value}`),
            active: datePreset === value,
            onToggle: () => pick(setDatePreset, datePreset, value),
          })),
        ]}
        groupBy={["status", "type", "day"].map((value) => ({
          id: value,
          label: t(`salesOrders.list.groupBy.${value}`),
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
            {t("salesOrders.filters.dateFrom")}
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
            {t("salesOrders.filters.dateTo")}
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

      {ordersQuery.isLoading && <LoadingState label={t("salesOrders.loading")} />}
      {ordersQuery.isError && (
        <ErrorState title={t("salesOrders.error.title")} message={ordersQuery.error?.message || t("salesOrders.error.message")} />
      )}

      {!ordersQuery.isLoading && !ordersQuery.isError && view === "list" && (
        <ListView
          columns={columns}
          rows={groups ? undefined : orders}
          groups={groups ?? undefined}
          getRowKey={(order) => order.salesOrderId}
          onRowClick={(order) => onOpenOrder(order.salesOrderId)}
          emptyLabel={t("salesOrders.empty.message")}
        />
      )}

      {!ordersQuery.isLoading && !ordersQuery.isError && view === "kanban" && (
        orders.length === 0 ? (
          <EmptyState title={t("salesOrders.empty.title")} message={t("salesOrders.empty.message")} />
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
                      key={order.salesOrderId}
                      type="button"
                      onClick={() => onOpenOrder(order.salesOrderId)}
                      className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 text-start shadow-[var(--shadow-surface)] transition hover:border-accent-line hover:bg-hover"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-ink">{orderNumberDisplay(order.orderNumber, order.orderNumberFormatted)}</span>
                        <StatusPill tone={SALES_STATUS_PILL_TONE[order.status]}>{t(statusKey(order.status))}</StatusPill>
                      </div>
                      <div className="text-xs text-muted">{fulfillmentText(order, t)}</div>
                      <div className="flex items-center justify-between gap-2">
                        <OrderPaymentPill order={order} />
                        <span className="pos-num text-base font-black text-ink">{money(order)}</span>
                      </div>
                      <div className="text-[11px] text-subtle">{formatDateTime(latestOrderTimestamp(order))}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
