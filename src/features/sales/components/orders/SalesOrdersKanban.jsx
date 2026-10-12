import { useState } from "react";
import { ArrowLeft, CalendarClock, Inbox, ShoppingBag, Truck, Utensils } from "lucide-react";
import { formatDateTime, formatMoney } from "../../../../shared/utils/formatters";
import { useI18n } from "../../../../i18n/I18nContext";
import { StatusPill } from "../../../../shared/components/odoo/StatusBar";
import {
  derivePaymentStatus,
  fulfillmentLabelKey,
  latestOrderTimestamp,
  orderNumberDisplay,
  PAYMENT_STATUS_TONE,
  SALES_STATUS_PILL_TONE,
} from "../../utils/salesOrderFormatters";
import "../../styles/sales.css";

// Per StatusPill tone: the column's top bar, its title dot and the summed-total colour -- all from
// the existing theme tokens (no new colours).
const COLUMN_TONE = {
  info: { bar: "bg-accent", dot: "bg-accent", amount: "text-ink" },
  success: { bar: "bg-success", dot: "bg-success", amount: "text-success" },
  warning: { bar: "bg-warning", dot: "bg-warning", amount: "text-warning" },
  danger: { bar: "bg-danger", dot: "bg-danger", amount: "text-danger" },
  neutral: { bar: "bg-line-strong", dot: "bg-subtle", amount: "text-ink" },
};

// Card edge stripe per payment status (see .sales-card in sales.css).
const PAYMENT_STRIPE = {
  paid: "var(--nobo-success)",
  partiallyPaid: "var(--nobo-warning)",
  unpaid: "var(--nobo-line-strong)",
};

const FULFILLMENT_ICON = { DineIn: Utensils, Takeaway: ShoppingBag, Delivery: Truck };

function sumMoney(rows, pick = (row) => row.payableAmount) {
  if (!rows.length) return null;
  const total = rows.reduce((sum, row) => sum + Number(pick(row)), 0);
  return formatMoney(total, rows[0].currencyCode, rows[0].currencyMinorUnitDigits);
}

// Strip of headline figures over the board, from the orders on the loaded page (the list API has no
// totals endpoint). When the branch has more orders than the page holds, a note says so.
export function SalesOrdersSummary({ orders, totalCount }) {
  const { t } = useI18n();
  const drafts = orders.filter((order) => order.status === "Draft").length;
  const billable = orders.filter((order) => order.status === "Confirmed" || order.status === "Closed");
  const tiles = [
    { key: "orders", label: t("salesOrders.overview.kpi.orders"), value: totalCount },
    { key: "amount", label: t("salesOrders.overview.kpi.salesAmount"), value: sumMoney(billable) ?? "—" },
    {
      key: "outstanding",
      label: t("salesOrders.overview.kpi.outstanding"),
      value: sumMoney(billable, (row) => row.remainingAmount) ?? "—",
      warn: billable.some((order) => Number(order.remainingAmount) > 0),
    },
    { key: "drafts", label: t("salesOrders.status.draft"), value: drafts },
  ];

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.key} className="rounded-xl border border-line bg-surface px-3 py-2.5 shadow-[var(--shadow-surface)]">
            <div className="text-xs text-muted">{tile.label}</div>
            <div className={`sales-display pos-num text-xl font-black ${tile.warn ? "text-warning" : "text-ink"}`}>{tile.value}</div>
          </div>
        ))}
      </div>
      {totalCount > orders.length && (
        <p className="text-[11px] text-subtle">{t("salesOrders.list.pageNote", { count: orders.length })}</p>
      )}
    </div>
  );
}

function OrderCard({ order, statusLabel, onOpen }) {
  const { t } = useI18n();
  const payment = derivePaymentStatus(order.isFullyPaid, order.netPaidAmount);
  const typeKey = fulfillmentLabelKey(order.fulfillmentType);
  const TypeIcon = FULFILLMENT_ICON[order.fulfillmentType] ?? ShoppingBag;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ "--sales-stripe": order.status === "Cancelled" ? "var(--nobo-danger)" : PAYMENT_STRIPE[payment] }}
      className="sales-card group flex w-full flex-col gap-1.5 rounded-lg border border-line bg-surface py-2.5 pe-3 ps-4 text-start shadow-[var(--shadow-surface)] transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="pos-num text-xs font-bold text-subtle">{orderNumberDisplay(order.orderNumber, order.orderNumberFormatted)}</span>
        {statusLabel ? (
          <StatusPill tone={SALES_STATUS_PILL_TONE[order.status]}>{statusLabel}</StatusPill>
        ) : payment ? (
          <StatusPill tone={PAYMENT_STATUS_TONE[payment]}>{t(`salesOrders.payment.${payment}`)}</StatusPill>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="sales-display pos-num text-xl font-black leading-tight text-ink">
          {formatMoney(order.payableAmount, order.currencyCode, order.currencyMinorUnitDigits)}
        </span>
        <span className="flex items-center gap-0.5 text-[11px] font-bold text-accent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          {t("salesOrders.list.open")}
          <ArrowLeft size={12} />
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {typeKey && (
          <span className="flex items-center gap-1">
            <TypeIcon size={13} className="shrink-0 text-subtle" />
            {t(typeKey)}
            {order.fulfillmentType === "DineIn" && order.restaurantTableCode ? ` · ${order.restaurantTableCode}` : ""}
          </span>
        )}
        <span className="flex min-w-0 items-center gap-1">
          <CalendarClock size={13} className="shrink-0 text-subtle" />
          <span className="truncate">{formatDateTime(latestOrderTimestamp(order))}</span>
        </span>
      </div>
      {statusLabel && payment && (
        <div>
          <StatusPill tone={PAYMENT_STATUS_TONE[payment]}>{t(`salesOrders.payment.${payment}`)}</StatusPill>
        </div>
      )}
    </button>
  );
}

function ColumnEmpty() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-line-strong bg-inset text-subtle">
        <Inbox size={20} />
      </span>
      <p className="text-xs font-bold text-muted">{t("salesOrders.list.emptyColumn")}</p>
    </div>
  );
}

function ColumnHeader({ column }) {
  const tone = COLUMN_TONE[column.tone] ?? COLUMN_TONE.neutral;
  const total = sumMoney(column.rows);
  return (
    <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-bold text-ink">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
          <span className="truncate">{column.label}</span>
        </div>
        <div className={`sales-display pos-num text-sm font-extrabold ${tone.amount}`}>{total ?? "—"}</div>
      </div>
      <span className="sales-display pos-num grid h-7 min-w-7 shrink-0 place-items-center rounded-full border border-line bg-surface px-2 text-sm font-bold text-ink">
        {column.rows.length}
      </span>
    </header>
  );
}

function ColumnCards({ column, showStatus, statusLabelOf, onOpenOrder }) {
  if (column.rows.length === 0) return <ColumnEmpty />;
  return (
    <div className="flex flex-col gap-2 p-2">
      {column.rows.map((order) => (
        <OrderCard
          key={order.salesOrderId}
          order={order}
          statusLabel={showStatus ? statusLabelOf(order.status) : null}
          onOpen={() => onOpenOrder(order.salesOrderId)}
        />
      ))}
    </div>
  );
}

// Placeholder board while the orders load: the same column/card shapes, shimmering, so the page
// doesn't jump when the data arrives.
export function SalesOrdersKanbanSkeleton() {
  return (
    <div className="flex items-start gap-3 overflow-hidden" aria-hidden="true">
      {[3, 2, 2, 1].map((cards, index) => (
        <div key={index} className={`min-w-[16.5rem] flex-1 overflow-hidden rounded-xl border border-line bg-raised ${index > 0 ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-3">
            <div className="w-1/2 space-y-1.5">
              <div className="sales-skeleton h-3 w-3/5" />
              <div className="sales-skeleton h-2.5 w-4/5" />
            </div>
            <div className="sales-skeleton h-7 w-7 rounded-full" />
          </div>
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: cards }, (_, card) => (
              <div key={card} className="space-y-2 rounded-lg border border-line bg-surface p-3">
                <div className="sales-skeleton h-2.5 w-2/5" />
                <div className="sales-skeleton h-4 w-3/5" />
                <div className="sales-skeleton h-2.5 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Pipeline-style kanban. From md up: one column per group side by side (scrolling sideways when
// they don't fit), each with a tone bar, dot + title, summed total and count; an empty column folds
// to a slim strip until opened. Below md: the columns become tabs over a single full-width column.
// `columns` = [{ key, label, tone, rows }]. A card repeats the status only when the columns aren't
// already the statuses (`showStatus`).
export function SalesOrdersKanban({ columns, showStatus, statusLabelOf, onOpenOrder }) {
  const [openedEmpty, setOpenedEmpty] = useState(() => new Set());
  const [mobileKey, setMobileKey] = useState(null);
  const mobileColumn =
    columns.find((column) => column.key === mobileKey) ?? columns.find((column) => column.rows.length) ?? columns[0];

  return (
    <>
      {/* Phone: status tabs + one column */}
      <div className="space-y-2 md:hidden">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
          {columns.map((column) => {
            const active = column.key === mobileColumn?.key;
            const tone = COLUMN_TONE[column.tone] ?? COLUMN_TONE.neutral;
            return (
              <button
                key={column.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobileKey(column.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  active ? "bg-accent text-surface" : "bg-inset text-muted hover:text-ink"
                }`}
              >
                {!active && <span className={`h-2 w-2 rounded-full ${tone.dot}`} />}
                {column.label}
                <span className="pos-num">{column.rows.length}</span>
              </button>
            );
          })}
        </div>
        {mobileColumn && (
          <div className="overflow-hidden rounded-xl border border-line bg-raised">
            <ColumnHeader column={mobileColumn} />
            <ColumnCards column={mobileColumn} showStatus={showStatus} statusLabelOf={statusLabelOf} onOpenOrder={onOpenOrder} />
          </div>
        )}
      </div>

      {/* Tablet / desktop: the pipeline */}
      <div className="-mx-1 hidden overflow-x-auto pb-2 md:block">
        <div className="flex min-w-full items-start gap-3 px-1">
          {columns.map((column) => {
            const tone = COLUMN_TONE[column.tone] ?? COLUMN_TONE.neutral;
            const folded = column.rows.length === 0 && !openedEmpty.has(column.key);

            if (folded) {
              return (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => setOpenedEmpty((current) => new Set(current).add(column.key))}
                  title={column.label}
                  aria-label={column.label}
                  className="flex w-12 shrink-0 flex-col items-center gap-2.5 rounded-xl border border-line bg-raised py-3 text-muted transition hover:bg-hover hover:text-ink"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                  <span className="sales-display pos-num text-xs font-bold">0</span>
                  <span className="text-sm font-bold [writing-mode:vertical-rl]">{column.label}</span>
                </button>
              );
            }

            return (
              <section
                key={column.key}
                aria-label={column.label}
                className="flex min-w-[16.5rem] flex-1 flex-col overflow-hidden rounded-xl border border-line bg-raised"
              >
                <div className={`h-1 ${tone.bar}`} />
                <ColumnHeader column={column} />
                <div className="max-h-[calc(100dvh-20rem)] overflow-y-auto">
                  <ColumnCards column={column} showStatus={showStatus} statusLabelOf={statusLabelOf} onOpenOrder={onOpenOrder} />
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
