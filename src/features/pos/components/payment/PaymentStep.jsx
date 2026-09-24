import { useMemo, useRef } from "react";
import { CircleDollarSign, ReceiptText, Wallet } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { formatPaymentDate, getPaymentMethodIcon } from "../../utils/posFormatters";
import { PaymentMethodOnboarding } from "../../../payments/components/PaymentMethodOnboarding";
import { ROUTES } from "../../../../utils/routes";
import { SCOPE_PRIORITY, SHORTCUT_SCOPES } from "../../../shortcuts/registry";
import { useShortcutScope } from "../../../shortcuts/useShortcuts";
import { ROVING_ITEM_SELECTOR, useAutoFocusFirstItem, useGridArrowNav } from "../../../shortcuts/rovingFocus";
import { ShortcutHint } from "../../../shortcuts/components/ShortcutHint";
import { OrderLines } from "../order/OrderLines";
import { useI18n } from "../../../../i18n/I18nContext";
import { brandAccentStyle, labelFor } from "../../utils/brandAccents";
import { NumericKeypadInline } from "../keypad/NumericKeypadInline";

/**
 * Non-modal, touch-first Payment workspace. Occupies the same grid slot the
 * Order step uses (product grid on the far side / order info on the near
 * side, in RTL: order info on the right) so the transition between phases
 * doesn't visually jump — the order the cashier just built stays exactly
 * where they were already looking at it. The order list itself is
 * read-only here (OrderLines' `readOnly` mode: no stepper, no trash, one
 * glanceable row per line) so as much of it as possible is visible at once
 * without scrolling — the point of this screen is to catch anything
 * missing before money changes hands, at a glance.
 */
export function PaymentStep({
  draftOrder,
  draftLines,
  catalogCurrencyCode,
  customer,
  subtotal,
  discountValue,
  vat,
  total,
  netPaidAmount,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
  remainingAmount,
  isCashSelected,
  changeDueAmount,
  paymentsReceivePermissionQuery,
  paymentMethodsQuery,
  paymentMethods,
  showAddPaymentMethod,
  setShowAddPaymentMethod,
  selectedPaymentMethod,
  setSelectedPaymentMethodId,
  paymentAmountInput,
  setPaymentAmountInput,
  paymentAmount,
  canReceivePayment,
  receiveCurrentPayment,
  receivePaymentMutation,
  paymentsViewPermissionQuery,
  canRefundPayments,
  openRefundModal,
  isLinePending,
  navigate,
  onBack,
}) {
  const { t } = useI18n();
  const paymentMethodGridRef = useRef(null);
  const handlePaymentMethodGridKeyDown = useGridArrowNav(paymentMethodGridRef, ROVING_ITEM_SELECTOR);
  const showPaymentMethodGrid =
    paymentsReceivePermissionQuery.hasPermission &&
    !paymentMethodsQuery.isLoading &&
    paymentMethods.length > 0;
  useAutoFocusFirstItem(paymentMethodGridRef, ROVING_ITEM_SELECTOR, showPaymentMethodGrid);

  // Same three bindings PaymentModal registered (Ctrl+Enter submit, KeyE
  // exact-amount), plus Escape — PosModal used to own that one, but this
  // step isn't hosted in PosModal anymore so it owns it directly.
  const stepBindings = useMemo(
    () => [
      { binding: { code: "Escape" }, onTrigger: onBack },
      {
        binding: { code: "Enter", ctrlKey: true },
        onTrigger: () => {
          if (canReceivePayment) receiveCurrentPayment();
        },
        allowInEditable: true,
      },
      {
        binding: { code: "KeyE" },
        onTrigger: () => setPaymentAmountInput(String(remainingAmount)),
      },
    ],
    [onBack, canReceivePayment, receiveCurrentPayment, remainingAmount, setPaymentAmountInput],
  );
  useShortcutScope({
    id: "pos-payment-step",
    priority: SCOPE_PRIORITY[SHORTCUT_SCOPES.MODAL],
    bindings: stepBindings,
  });

  // Round-up-to-a-common-note suggestions for cash only — a typing shortcut,
  // not a financial rule; the amount actually recorded is still capped at
  // remainingAmount regardless of which button (or manual typing) set it.
  const quickTenderAmounts = useMemo(() => {
    if (!isCashSelected || remainingAmount <= 0) return [];
    const roundUps = [10, 50, 100]
      .map((step) => Math.ceil(remainingAmount / step) * step)
      .filter((value) => value > remainingAmount);
    return Array.from(new Set(roundUps)).slice(0, 3);
  }, [isCashSelected, remainingAmount]);

  if (!draftOrder) return null;

  return (
    <div className="grid items-start gap-2 xl:grid-cols-[380px_minmax(0,1fr)]">
      {/* Order review — same physical position (right, in RTL) as the basket during the Order step,
          and the exact same definite-height technique as CatalogPanel/OrderSidebar (100dvh minus
          the shared --pos-chrome budget — the "Back to Order" row now lives in the toolbar those
          also sit under, not in a row of its own here, so there's nothing extra to account for). */}
      <aside className="flex min-h-[420px] flex-col gap-2 rounded-pos-lg border border-pos-border bg-pos-card p-3 xl:order-first xl:h-[calc(100dvh-var(--pos-chrome))] xl:min-h-0 xl:overflow-y-auto xl:scrollbar-none">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <span className="pos-fs-name font-bold text-pos-text">{t("pos.pay.order")}</span>
            <span className="flex items-center gap-1.5">
              {draftOrder?.orderNumberFormatted && (
                <span className="pos-num rounded-full bg-pos-tint px-2 py-0.5 text-[10px] font-bold text-pos-primary-text">
                  {draftOrder.orderNumberFormatted}
                </span>
              )}
              <span className="rounded-full bg-pos-action-tint px-2 py-0.5 text-[10px] font-bold text-pos-action-text">
                {labelFor(t, "pos.status", draftOrder?.status)}
              </span>
            </span>
          </div>

          {customer && (
            <div className="shrink-0 rounded-pos bg-pos-tint px-3 py-2 text-xs text-pos-primary-text">
              {customer.name}
            </div>
          )}

          <OrderLines
            draftLines={draftLines}
            draftOrder={draftOrder}
            catalogCurrencyCode={catalogCurrencyCode}
            isLinePending={isLinePending}
            readOnly
          />

          <div className="pos-fs-secondary shrink-0 space-y-0.5 border-t border-pos-border pt-2">
            <div className="flex justify-between text-pos-muted">
              <span className="flex items-center">
                <i className="pos-dot" style={{ "--pos-accent": "var(--brand-blue)" }} />
                {t("pos.sum.subtotal")}
              </span>
              <span className="pos-num">{formatMoney(subtotal, catalogCurrencyCode, 2)}</span>
            </div>
            <div className="flex justify-between text-pos-warning-text">
              <span className="flex items-center">
                <i className="pos-dot" style={{ "--pos-accent": "var(--brand-yellow)" }} />
                {t("pos.sum.discount")}
              </span>
              <span className="pos-num">- {formatMoney(discountValue, catalogCurrencyCode, 2)}</span>
            </div>
            <div className="flex justify-between text-pos-muted">
              <span className="flex items-center">
                <i className="pos-dot" style={{ "--pos-accent": "var(--brand-pink)" }} />
                {t("pos.sum.vat")}
              </span>
              <span className="pos-num">{formatMoney(vat, catalogCurrencyCode, 2)}</span>
            </div>
            <div className="mt-1.5 flex items-end justify-between rounded-pos bg-pos-tint px-2 py-1">
              <span className="pos-fs-line font-bold text-pos-text">{t("pos.sum.total")}</span>
              <span className="pos-num pos-fs-total text-pos-primary-text">
                {formatMoney(total, catalogCurrencyCode, 2)}
              </span>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-pos border border-pos-action/30 bg-pos-action-tint p-2 text-center">
              <div className="font-bold text-pos-action-text">{t("pos.sum.paid")}</div>
              <div className="pos-num mt-0.5 font-black text-pos-action-text">
                {formatMoney(netPaidAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
              </div>
            </div>
            <div className="rounded-pos border border-pos-warning/40 bg-pos-warning-tint p-2 text-center">
              <div className="font-bold text-pos-warning-text">{t("pos.sum.remaining")}</div>
              <div className="pos-num mt-0.5 font-black text-pos-warning-text">
                {formatMoney(remainingAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
              </div>
            </div>
          </div>

          {paymentsViewPermissionQuery.hasPermission && (draftOrder?.payments || []).length > 0 && (
            <div className="min-h-0 shrink-0 space-y-2 border-t border-pos-border pt-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-pos-muted">
                <ReceiptText size={13} />
                {t("pos.pay.history")}
              </div>
              {(draftOrder?.payments || []).map((payment) => (
                <div
                  key={payment.salesOrderPaymentId}
                  className="rounded-pos border border-pos-border bg-pos-bg p-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-pos-text">
                        {payment.paymentMethod.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-pos-muted">
                        {payment.paymentMethod.code} · {payment.paymentMethod.kind} ·{" "}
                        {formatPaymentDate(payment.receivedAtUtc)}
                      </div>
                    </div>
                    <div className="pos-num text-end text-xs font-black text-pos-action-text">
                      {formatMoney(payment.amount, payment.currencyCode, payment.currencyMinorUnitDigits)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-pos-muted">
                    <span className="pos-num">
                      {t("pos.pay.refundedAmount", {
                        amount: formatMoney(
                          payment.refundedAmount,
                          payment.currencyCode,
                          payment.currencyMinorUnitDigits,
                        ),
                      })}
                    </span>
                    <button
                      type="button"
                      disabled={payment.refundableAmount <= 0 || !canRefundPayments}
                      onClick={() => openRefundModal(payment)}
                      className="rounded-pos border border-pos-danger/40 px-2 py-1 font-bold text-pos-danger-text disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("pos.pay.refund")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Payment actions — same physical position (left, in RTL) as the product grid during the
            Order step. The Due-now hero and the Receive CTA are pinned (shrink-0); only the
            payment-method/amount/keypad middle scrolls if it doesn't fit, so Receive is always
            reachable without hunting for it. */}
        <div className="flex min-h-0 flex-col gap-2 rounded-pos-lg border border-pos-border bg-pos-card p-3 xl:h-[calc(100dvh-var(--pos-chrome))]">
          <div className="shrink-0 rounded-pos bg-pos-primary-strong p-3 text-center text-white">
            <div className="pos-fs-label font-bold uppercase text-white/80">
              {netPaidAmount > 0 ? t("pos.pay.dueNow") : t("pos.pay.totalDue")}
            </div>
            <div className="pos-num mt-1 text-4xl font-black text-white">
              {formatMoney(remainingAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
            </div>
            {netPaidAmount > 0 && (
              <div className="mt-2 flex items-center justify-center gap-4 text-xs text-white/80">
                <span>{t("pos.pay.orderTotal")} <span className="pos-num">{formatMoney(total, settlementCurrencyCode, settlementMinorUnitDigits)}</span></span>
                <span className="font-bold text-white">
                  {t("pos.sum.paid")} <span className="pos-num">{formatMoney(netPaidAmount, settlementCurrencyCode, settlementMinorUnitDigits)}</span>
                </span>
              </div>
            )}
          </div>

          {!paymentsReceivePermissionQuery.hasPermission ? (
            <div className="rounded-pos border border-pos-warning/40 bg-pos-warning-tint px-3 py-3 text-xs text-pos-warning-text">
              {t("pos.pay.needPermission")}
            </div>
          ) : (
            <>
              {paymentMethodsQuery.isLoading && (
                <div className="rounded-pos bg-pos-bg px-3 py-3 text-center text-xs text-pos-muted">
                  {t("pos.pay.loadingMethods")}
                </div>
              )}
              {!paymentMethodsQuery.isLoading &&
                paymentMethods.length === 0 &&
                (showAddPaymentMethod ? (
                  <PaymentMethodOnboarding
                    onCreated={() => {
                      paymentMethodsQuery.refetch();
                      setShowAddPaymentMethod(false);
                    }}
                  />
                ) : (
                  <div className="rounded-pos border border-pos-warning/40 bg-pos-warning-tint p-4 text-center">
                    <div className="text-sm font-bold text-pos-warning-text">{t("pos.pay.setupRequired")}</div>
                    <p className="mt-1 text-xs text-pos-warning-text/80">
                      {t("pos.pay.setupBody")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddPaymentMethod(true)}
                      className="pos-control mt-3 inline-flex items-center justify-center gap-2 bg-pos-primary-strong px-4 text-sm font-bold text-white hover:bg-pos-primary-strong-hover"
                    >
                      {t("pos.pay.addMethod")}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.PAYMENT_METHODS_ADMIN)}
                      className="mt-3 block w-full text-[11px] font-semibold text-pos-primary-text hover:underline"
                    >
                      {t("pos.pay.manageMethods")}
                    </button>
                  </div>
                ))}

              {!paymentMethodsQuery.isLoading && paymentMethods.length > 0 && (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pe-1 scrollbar-none">
                  <div
                    ref={paymentMethodGridRef}
                    onKeyDown={handlePaymentMethodGridKeyDown}
                    className="grid grid-cols-3 gap-1.5 sm:grid-cols-4"
                  >
                    {paymentMethods.map((method, methodIndex) => {
                      const Icon = getPaymentMethodIcon(method.kind);
                      const active = selectedPaymentMethod?.paymentMethodId === method.paymentMethodId;
                      return (
                        <button
                          type="button"
                          key={method.paymentMethodId}
                          data-roving-item=""
                          onClick={() => setSelectedPaymentMethodId(method.paymentMethodId)}
                          style={brandAccentStyle(methodIndex)}
                          className={`min-h-14 rounded-pos border px-3 py-2 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pos-primary ${
                            active
                              ? "border-pos-primary bg-pos-tint shadow-sm"
                              : "border-pos-border bg-pos-bg hover:border-pos-primary"
                          }`}
                        >
                          <span className="pos-chip mx-auto grid h-9 w-9 place-items-center rounded-full">
                            <Icon size={20} />
                          </span>
                          <span className="mt-1.5 block truncate text-xs font-bold text-pos-text">{method.name}</span>
                          <span className="text-[10px] text-pos-muted">{method.kind}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="rounded-pos border border-pos-border bg-pos-bg p-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-pos-muted">
                          <CircleDollarSign size={14} className="text-pos-action-text" />
                          {isCashSelected ? t("pos.pay.tendered") : t("pos.pay.amount")}
                        </div>
                        <div className="pos-num mt-1 text-2xl font-black text-pos-text">
                          {paymentAmountInput || "0"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentAmountInput(String(remainingAmount))}
                          className="pos-control flex items-center justify-center gap-1.5 border border-pos-primary/50 bg-pos-tint text-xs font-bold text-pos-primary-text hover:bg-pos-primary/15"
                        >
                          {t("pos.pay.exact")}
                          <ShortcutHint action="pos.exactAmount" />
                        </button>
                        {quickTenderAmounts.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setPaymentAmountInput(String(amount))}
                            className="pos-control flex items-center justify-center border border-pos-border bg-pos-bg text-xs font-bold text-pos-text hover:border-pos-primary"
                          >
                            <span className="pos-num">{formatMoney(amount, settlementCurrencyCode, settlementMinorUnitDigits)}</span>
                          </button>
                        ))}
                      </div>

                      {isCashSelected && changeDueAmount > 0 && (
                        <div className="rounded-pos border border-pos-action/40 bg-pos-action-tint p-3 text-center">
                          <div className="text-[10px] font-bold uppercase text-pos-action-text">{t("pos.pay.changeDue")}</div>
                          <div className="pos-num mt-1 text-xl font-black text-pos-action-text">
                            {formatMoney(changeDueAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
                          </div>
                        </div>
                      )}

                      {paymentAmountInput &&
                        (paymentAmount.error ||
                          (!isCashSelected && paymentAmount.amount > remainingAmount)) && (
                          <p className="text-[10px] text-pos-warning-text">
                            {paymentAmount.error || t("pos.pay.exceeds")}
                          </p>
                        )}
                    </div>

                    <NumericKeypadInline
                      value={paymentAmountInput}
                      onChange={setPaymentAmountInput}
                      maxDecimalPlaces={settlementMinorUnitDigits}
                      ariaLabel={t("pos.pay.amountAria")}
                      unitLabel={settlementCurrencyCode}
                      onEnter={() => {
                        if (canReceivePayment) receiveCurrentPayment();
                      }}
                    />
                  </div>
                </div>
              )}

              {!paymentMethodsQuery.isLoading && paymentMethods.length > 0 && (
                <button
                  type="button"
                  disabled={!canReceivePayment}
                  onClick={receiveCurrentPayment}
                  className="flex h-16 w-full shrink-0 items-center justify-center gap-2 rounded-pos-lg bg-pos-action text-lg font-black text-pos-on-action shadow-lg transition hover:bg-pos-action-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wallet size={22} />
                  {receivePaymentMutation.isPending
                    ? "..."
                    : `${t("pos.pay.receive")}${
                        paymentAmount.amount !== null
                          ? ` ${formatMoney(
                              Math.min(paymentAmount.amount, remainingAmount),
                              settlementCurrencyCode,
                              settlementMinorUnitDigits,
                            )}`
                          : ""
                      }`}
                  <ShortcutHint action="pos.receivePayment" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
  );
}
