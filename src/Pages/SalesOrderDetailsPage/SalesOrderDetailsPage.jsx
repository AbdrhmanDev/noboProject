import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useDraftSalesOrderDetails } from "../../features/sales-orders/hooks/useDraftSalesOrder";
import { useSalesOrderPayments } from "../../features/payments/hooks/usePayments";
import { ReceiptPrintPanel } from "../../features/payments/components/ReceiptPrintPanel";
import { ListView } from "../../shared/components/odoo/ListView";
import { StatusBar, StatusPill } from "../../shared/components/odoo/StatusBar";
import {
  PAYMENT_STATUS_TONE,
  derivePaymentStatus,
  fulfillmentLabelKey,
  orderNumberDisplay,
  shortOrderReference,
} from "../../features/sales/utils/salesOrderFormatters";
import { ROUTES } from "../../utils/routes";
import { SALES_ORDERS_VIEW_PERMISSION } from "../../features/authorization/constants/applicationPermissions";

const STAGES = ["Draft", "Confirmed", "Closed"];
const statusKey = (status) => `salesOrders.status.${status.charAt(0).toLowerCase()}${status.slice(1)}`;

// Odoo form-view field: bold label column + value, one per row.
function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-[minmax(7rem,40%)_1fr] items-baseline gap-3 border-b border-line py-1.5 last:border-0">
      <dt className="text-sm font-bold text-ink">{label}</dt>
      <dd className="min-w-0 text-sm text-ink">{children ?? <span className="text-subtle">—</span>}</dd>
    </div>
  );
}

function TotalRow({ label, value, strong }) {
  return (
    <div className={`flex items-center justify-between gap-6 py-1 ${strong ? "mt-1 border-t border-line-strong pt-2 text-base font-black" : "text-sm"}`}>
      <span className={strong ? "text-ink" : "text-muted"}>{label}</span>
      <span className="pos-num text-ink">{value}</span>
    </div>
  );
}

// Sales order, read-only, laid out like Odoo's form view: breadcrumb + status bar, a "sheet" with
// the order number and two columns of fields, then a notebook (Order lines with totals / Other
// info with taxes and payments). Same queries and data as before -- presentation only.
export default function SalesOrderDetailsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState("lines");

  const permissionQuery = useHasPermission(currentCompanyId, SALES_ORDERS_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !permissionQuery.isLoading &&
    permissionQuery.hasPermission;

  const orderQuery = useDraftSalesOrderDetails(currentCompanyId, currentBranchId, orderId, canQuery);
  const order = orderQuery.data || null;

  const paymentsQuery = useSalesOrderPayments(
    currentCompanyId,
    currentBranchId,
    orderId,
    canQuery && Boolean(order) && order.status !== "Draft",
  );
  const paymentState = paymentsQuery.data;

  const currency = order?.currencyCode;
  const digits = order?.currencyMinorUnitDigits ?? 2;
  const money = (amount) => (currency ? formatMoney(amount, currency, digits) : "—");
  const orderTitle = order
    ? orderNumberDisplay(order.orderNumber, order.orderNumberFormatted) || shortOrderReference(order.salesOrderId)
    : shortOrderReference(orderId);
  const typeLabel = order
    ? fulfillmentLabelKey(order.fulfillmentType)
      ? t(fulfillmentLabelKey(order.fulfillmentType))
      : order.fulfillmentType
    : null;
  const paymentStatus = paymentState
    ? derivePaymentStatus(paymentState.isFullyPaid, paymentState.netPaidAmount)
    : null;

  return (
    <AppLayout activePath={ROUTES.SALES}>
      <main className="odoo-root space-y-3" dir="rtl">
        {/* Breadcrumb bar: the parent levels go back to the orders list. */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-[var(--shadow-surface)]">
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-base">
            <button type="button" onClick={() => navigate(ROUTES.SALES)} className="odoo-link hover:underline">
              {t("nav.sales")}
            </button>
            <span className="text-subtle">/</span>
            <button type="button" onClick={() => navigate(`${ROUTES.SALES}?tab=orders`)} className="odoo-link hover:underline">
              {t("salesOrders.tabs.orders")}
            </button>
            <span className="text-subtle">/</span>
            <span className="truncate font-bold text-ink">{orderTitle}</span>
          </nav>
          <StatusPill>{t("salesOrders.details.readOnlyBadge")}</StatusPill>
        </div>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState title={t("salesOrders.companyBranchRequired.title")} message={t("salesOrders.companyBranchRequired.message")} />
        ) : permissionQuery.isLoading ? (
          <LoadingState label={t("salesOrders.loading")} />
        ) : !permissionQuery.hasPermission ? (
          <ErrorState title={t("salesOrders.permissionRequired.title")} message={t("salesOrders.permissionRequired.message")} />
        ) : orderQuery.isLoading ? (
          <LoadingState label={t("salesOrders.loading")} />
        ) : orderQuery.isError ? (
          <ErrorState
            title={t("salesOrders.details.notFound.title")}
            message={orderQuery.error?.message || t("salesOrders.details.notFound.message")}
          />
        ) : !order ? (
          <EmptyState title={t("salesOrders.details.notFound.title")} message={t("salesOrders.details.notFound.message")} />
        ) : (
          <>
            <StatusBar
              stages={STAGES.map((stage) => ({ id: stage, label: t(statusKey(stage)) }))}
              current={order.status}
              exception={order.status === "Cancelled" ? t(statusKey("Cancelled")) : null}
            />

            {/* The sheet */}
            <article className="mx-auto w-full max-w-5xl space-y-5 rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-surface)] sm:p-6">
              <div>
                <div className="text-xs font-bold text-muted">{t("salesOrders.details.salesOrder")}</div>
                <h1 className="pos-num text-3xl font-black text-ink">{orderTitle}</h1>
              </div>

              {order.status === "Draft" && (
                <div className="rounded-lg border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">
                  {t("salesOrders.details.draftNotice")}
                </div>
              )}

              <div className="grid gap-x-10 md:grid-cols-2">
                <dl>
                  <FieldRow label={t("salesOrders.details.customer")}>
                    {order.customer?.name || t("salesOrders.overview.rankings.walkIn")}
                  </FieldRow>
                  <FieldRow label={t("salesOrders.details.type")}>{typeLabel}</FieldRow>
                  <FieldRow label={t("salesOrders.details.table")}>
                    {order.fulfillmentType === "DineIn" && order.restaurantTable
                      ? `${order.restaurantTable.code}${order.restaurantTable.name ? ` · ${order.restaurantTable.name}` : ""}`
                      : null}
                  </FieldRow>
                  <FieldRow label={t("salesOrders.details.priceList")}>{order.priceListName}</FieldRow>
                </dl>
                <dl>
                  <FieldRow label={t("salesOrders.details.created")}>
                    {order.createdAtUtc ? formatDateTime(order.createdAtUtc) : null}
                  </FieldRow>
                  <FieldRow label={t("salesOrders.details.updated")}>
                    {order.closedAtUtc || order.cancelledAtUtc || order.confirmedAtUtc
                      ? formatDateTime(order.closedAtUtc || order.cancelledAtUtc || order.confirmedAtUtc)
                      : null}
                  </FieldRow>
                  <FieldRow label={t("salesOrders.table.status")}>
                    <StatusPill tone={order.status === "Cancelled" ? "danger" : order.status === "Draft" ? "info" : "success"}>
                      {t(statusKey(order.status))}
                    </StatusPill>
                  </FieldRow>
                  <FieldRow label={t("salesOrders.table.payment")}>
                    {paymentStatus ? (
                      <StatusPill tone={PAYMENT_STATUS_TONE[paymentStatus]}>{t(`salesOrders.payment.${paymentStatus}`)}</StatusPill>
                    ) : null}
                  </FieldRow>
                </dl>
              </div>

              {order.status !== "Draft" && (
                <ReceiptPrintPanel companyId={currentCompanyId} branchId={currentBranchId} salesOrderId={orderId} />
              )}

              {/* Notebook */}
              <div>
                <div className="flex gap-1 border-b border-line" role="tablist">
                  {["lines", "other"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={tab === value}
                      onClick={() => setTab(value)}
                      className={`-mb-px rounded-t-md border px-4 py-2 text-sm font-bold transition ${
                        tab === value ? "border-line border-b-surface bg-surface text-ink" : "border-transparent text-muted hover:text-ink"
                      }`}
                    >
                      {t(`salesOrders.details.tabs.${value}`)}
                    </button>
                  ))}
                </div>

                <div className="pt-3">
                  {tab === "lines" ? (
                    <div className="space-y-3">
                      <ListView
                        columns={[
                          {
                            key: "product",
                            header: t("salesOrders.details.product"),
                            render: (line) => (
                              <div>
                                <div className="font-bold">{line.productName}</div>
                                <div className="text-xs text-subtle">
                                  {line.variantName}
                                  {line.sku ? ` · ${line.sku}` : ""}
                                </div>
                                {line.modifiers?.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {line.modifiers.map((modifier) => (
                                      <span key={modifier.modifierOptionId} className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent">
                                        {modifier.modifierOptionName}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ),
                          },
                          { key: "qty", header: t("salesOrders.details.qty"), align: "end", render: (line) => line.quantity },
                          { key: "price", header: t("salesOrders.details.unitPrice"), align: "end", render: (line) => money(line.unitPrice) },
                          {
                            key: "total",
                            header: t("salesOrders.details.lineTotal"),
                            align: "end",
                            render: (line) => <span className="font-bold">{money(line.lineSubtotalAmount)}</span>,
                          },
                        ]}
                        rows={order.lines ?? []}
                        getRowKey={(line) => line.salesOrderLineId}
                        emptyLabel={t("salesOrders.details.noLines")}
                      />

                      <div className="ms-auto w-full max-w-xs">
                        <TotalRow label={t("salesOrders.details.subtotal")} value={money(order.subtotalAmount)} />
                        <TotalRow label={t("salesOrders.details.discount")} value={money(order.discountAmount)} />
                        <TotalRow label={t("salesOrders.details.tax")} value={money(order.taxAmount)} />
                        <TotalRow label={t("salesOrders.details.total")} value={money(order.payableAmount)} strong />
                        {paymentState && (
                          <>
                            <TotalRow label={t("salesOrders.details.paid")} value={money(paymentState.netPaidAmount)} />
                            <TotalRow label={t("salesOrders.details.remaining")} value={money(paymentState.remainingAmount)} />
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <section className="space-y-2">
                        <h2 className="text-sm font-bold text-ink">{t("salesOrders.details.taxSummary")}</h2>
                        <ListView
                          columns={[
                            {
                              key: "tax",
                              header: t("salesOrders.details.tax"),
                              render: (summary) =>
                                `${summary.taxCategoryName || summary.taxCategoryCode}${
                                  summary.ratePercent !== undefined ? ` · ${summary.ratePercent}%` : ""
                                }`,
                            },
                            { key: "base", header: t("salesOrders.details.taxableAmount"), align: "end", render: (summary) => money(summary.netAmount) },
                            {
                              key: "amount",
                              header: t("salesOrders.details.taxAmount"),
                              align: "end",
                              render: (summary) => <span className="font-bold">{money(summary.taxAmount)}</span>,
                            },
                          ]}
                          rows={order.taxSummaries ?? []}
                          getRowKey={(summary) => summary.taxCategoryId}
                          emptyLabel="—"
                        />
                      </section>

                      <section className="space-y-2">
                        <h2 className="text-sm font-bold text-ink">{t("salesOrders.details.paymentSummary")}</h2>
                        {order.status === "Draft" ? (
                          <p className="text-sm text-subtle">{t("salesOrders.details.noPaymentsYet")}</p>
                        ) : paymentsQuery.isLoading ? (
                          <LoadingState label={t("salesOrders.details.loadingPayments")} />
                        ) : paymentsQuery.isError ? (
                          <ErrorState title={t("salesOrders.error.title")} message={paymentsQuery.error?.message || t("salesOrders.error.message")} />
                        ) : (
                          <ListView
                            columns={[
                              { key: "date", header: t("salesOrders.details.paymentDate"), render: (payment) => formatDateTime(payment.receivedAtUtc) },
                              { key: "method", header: t("salesOrders.details.paymentMethod"), render: (payment) => payment.paymentMethod?.name },
                              {
                                key: "amount",
                                header: t("salesOrders.details.paymentAmount"),
                                align: "end",
                                render: (payment) => (
                                  <span className="font-bold">{formatMoney(payment.amount, payment.currencyCode, payment.currencyMinorUnitDigits)}</span>
                                ),
                              },
                              {
                                key: "refunded",
                                header: t("salesOrders.details.paymentRefunded"),
                                align: "end",
                                render: (payment) =>
                                  payment.refundedAmount > 0 ? (
                                    <span className="text-danger">
                                      {formatMoney(payment.refundedAmount, payment.currencyCode, payment.currencyMinorUnitDigits)}
                                    </span>
                                  ) : (
                                    <span className="text-subtle">—</span>
                                  ),
                              },
                            ]}
                            rows={paymentState?.payments ?? []}
                            getRowKey={(payment) => payment.salesOrderPaymentId}
                            emptyLabel={t("salesOrders.details.noPaymentsYet")}
                          />
                        )}
                      </section>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </>
        )}
      </main>
    </AppLayout>
  );
}
