import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ReceiptText, ShoppingBag } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useDraftSalesOrderDetails } from "../../features/sales-orders/hooks/useDraftSalesOrder";
import { useSalesOrderPayments } from "../../features/payments/hooks/usePayments";
import { SalesOrderStatusBadge } from "../../features/sales/components/SalesOrderStatusBadge";
import { SalesOrderPaymentBadge } from "../../features/sales/components/SalesOrderPaymentBadge";
import { fulfillmentLabelKey, shortOrderReference } from "../../features/sales/utils/salesOrderFormatters";
import { ROUTES } from "../../utils/routes";

const SALES_ORDERS_VIEW_PERMISSION = "SalesOrders.View";

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-100">{value ?? "—"}</div>
    </div>
  );
}

export default function SalesOrderDetailsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

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

  const backButton = (
    <button
      type="button"
      onClick={() => navigate(ROUTES.SALES)}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
    >
      <ArrowRight size={14} />
      {t("salesOrders.details.back")}
    </button>
  );

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
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-white">
                  {order ? shortOrderReference(order.salesOrderId) : shortOrderReference(orderId)}
                </h1>
                {order && <SalesOrderStatusBadge status={order.status} />}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  {t("salesOrders.details.readOnlyBadge")}
                </span>
              </div>
            </div>
            {backButton}
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
        ) : orderQuery.isLoading ? (
          <LoadingState label={t("salesOrders.loading")} />
        ) : orderQuery.isError ? (
          <ErrorState
            title={t("salesOrders.details.notFound.title")}
            message={orderQuery.error?.message || t("salesOrders.details.notFound.message")}
          />
        ) : !order ? (
          <EmptyState
            title={t("salesOrders.details.notFound.title")}
            message={t("salesOrders.details.notFound.message")}
          />
        ) : (
          <div className="space-y-4">
            {order.status === "Draft" && (
              <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2.5 text-xs text-blue-100">
                {t("salesOrders.details.draftNotice")}
              </div>
            )}

            <section>
              <h2 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                {t("salesOrders.details.overview")}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <Field
                  label={t("salesOrders.details.type")}
                  value={
                    fulfillmentLabelKey(order.fulfillmentType)
                      ? t(fulfillmentLabelKey(order.fulfillmentType))
                      : order.fulfillmentType || "—"
                  }
                />
                <Field
                  label={t("salesOrders.details.table")}
                  value={
                    order.fulfillmentType === "DineIn" && order.restaurantTableId
                      ? shortOrderReference(order.restaurantTableId)
                      : "—"
                  }
                />
                <Field
                  label={t("salesOrders.details.created")}
                  value={order.createdAtUtc ? formatDateTime(order.createdAtUtc) : "—"}
                />
                <Field
                  label={t("salesOrders.details.updated")}
                  value={
                    order.confirmedAtUtc || order.closedAtUtc || order.cancelledAtUtc
                      ? formatDateTime(
                          order.closedAtUtc || order.cancelledAtUtc || order.confirmedAtUtc,
                        )
                      : "—"
                  }
                />
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                {t("salesOrders.details.amounts")}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <Field
                  label={t("salesOrders.details.subtotal")}
                  value={currency ? formatMoney(order.subtotalAmount, currency, digits) : "—"}
                />
                <Field
                  label={t("salesOrders.details.discount")}
                  value={currency ? formatMoney(order.discountAmount, currency, digits) : "—"}
                />
                <Field
                  label={t("salesOrders.details.tax")}
                  value={currency ? formatMoney(order.taxAmount, currency, digits) : "—"}
                />
                <Field
                  label={t("salesOrders.details.total")}
                  value={currency ? formatMoney(order.payableAmount, currency, digits) : "—"}
                />
              </div>

              {order.taxSummaries?.length > 0 && (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    {t("salesOrders.details.taxSummary")}
                  </div>
                  <div className="space-y-1.5">
                    {order.taxSummaries.map((summary) => (
                      <div
                        key={summary.taxCategoryId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/10 px-3 py-2 text-[11px]"
                      >
                        <span className="font-semibold text-slate-200">
                          {summary.taxCategoryName || summary.taxCategoryCode}
                          {summary.ratePercent !== undefined ? ` · ${summary.ratePercent}%` : ""}
                        </span>
                        <span className="text-slate-400">
                          {t("salesOrders.details.taxableAmount")}: {formatMoney(summary.netAmount, currency, digits)}
                        </span>
                        <span className="font-bold text-amber-300">
                          {t("salesOrders.details.taxAmount")}: {formatMoney(summary.taxAmount, currency, digits)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                {t("salesOrders.details.items")}
              </h2>
              {!order.lines?.length ? (
                <EmptyState title={t("salesOrders.details.noLines")} />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0c1424]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500">
                        <th className="p-2.5 text-start font-medium">{t("salesOrders.details.product")}</th>
                        <th className="p-2.5 text-start font-medium">{t("salesOrders.details.qty")}</th>
                        <th className="p-2.5 text-start font-medium">{t("salesOrders.details.unitPrice")}</th>
                        <th className="p-2.5 text-start font-medium">{t("salesOrders.details.lineTotal")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.lines.map((line) => (
                        <tr key={line.salesOrderLineId} className="border-b border-white/5 last:border-0">
                          <td className="p-2.5">
                            <div className="font-bold text-slate-100">{line.productName}</div>
                            <div className="text-[10px] text-slate-500">
                              {line.variantName}
                              {line.sku ? ` · ${line.sku}` : ""}
                            </div>
                            {line.modifiers?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {line.modifiers.map((modifier) => (
                                  <span
                                    key={modifier.modifierOptionId}
                                    className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-200"
                                  >
                                    {modifier.modifierOptionName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-300">{line.quantity}</td>
                          <td className="p-2.5 text-slate-300">{formatMoney(line.unitPrice, currency, digits)}</td>
                          <td className="p-2.5 font-bold text-white">
                            {formatMoney(line.lineSubtotalAmount, currency, digits)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                <ReceiptText size={14} />
                {t("salesOrders.details.paymentSummary")}
              </h2>
              {order.status === "Draft" ? (
                <EmptyState title={t("salesOrders.details.noPaymentsYet")} />
              ) : paymentsQuery.isLoading ? (
                <LoadingState label={t("salesOrders.details.loadingPayments")} />
              ) : paymentsQuery.isError ? (
                <ErrorState
                  title={t("salesOrders.error.title")}
                  message={paymentsQuery.error?.message || t("salesOrders.error.message")}
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field
                    label={t("salesOrders.details.paid")}
                    value={
                      paymentState && currency
                        ? formatMoney(paymentState.netPaidAmount, currency, digits)
                        : "—"
                    }
                  />
                  <Field
                    label={t("salesOrders.details.remaining")}
                    value={
                      paymentState && currency
                        ? formatMoney(paymentState.remainingAmount, currency, digits)
                        : "—"
                    }
                  />
                  <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <SalesOrderPaymentBadge
                      isFullyPaid={paymentState?.isFullyPaid}
                      netPaidAmount={paymentState?.netPaidAmount}
                      remainingAmount={paymentState?.remainingAmount}
                      currencyCode={currency}
                      currencyMinorUnitDigits={digits}
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
