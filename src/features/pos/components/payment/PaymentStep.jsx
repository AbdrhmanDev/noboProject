import { useMemo, useRef } from "react";
import { ArrowRight, CircleDollarSign, ReceiptText, Wallet } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { formatPaymentDate, getPaymentMethodColor, getPaymentMethodIcon } from "../../utils/posFormatters";
import { PaymentMethodOnboarding } from "../../../payments/components/PaymentMethodOnboarding";
import { ROUTES } from "../../../../utils/routes";
import { SCOPE_PRIORITY, SHORTCUT_SCOPES } from "../../../shortcuts/registry";
import { useShortcutScope } from "../../../shortcuts/useShortcuts";
import { ROVING_ITEM_SELECTOR, useAutoFocusFirstItem, useGridArrowNav } from "../../../shortcuts/rovingFocus";
import { ShortcutHint } from "../../../shortcuts/components/ShortcutHint";
import { OrderLines } from "../order/OrderLines";
import { NumericKeypadInline } from "../keypad/NumericKeypadInline";

const noop = () => {};

/**
 * Non-modal, touch-first Payment workspace. Occupies the same grid slot the
 * Order step uses (product grid on the right in RTL / basket on the left)
 * so the transition between phases doesn't visually jump.
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-bold text-slate-300 hover:border-blue-400/40 hover:bg-blue-500/10"
        >
          <ArrowRight size={16} />
          العودة للطلب
        </button>
        <div className="text-sm font-bold text-slate-200">الدفع</div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="rounded-2xl border border-white/10 bg-[#0d1728]/95 p-4 shadow-xl shadow-black/20">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              {netPaidAmount > 0 ? "Amount Due Now" : "Total Due"}
            </div>
            <div className="mt-1 text-4xl font-black text-blue-300">
              {formatMoney(remainingAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
            </div>
            {netPaidAmount > 0 && (
              <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
                <span>Order Total {formatMoney(total, settlementCurrencyCode, settlementMinorUnitDigits)}</span>
                <span className="font-bold text-emerald-300">
                  Paid {formatMoney(netPaidAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
                </span>
              </div>
            )}
          </div>

          {!paymentsReceivePermissionQuery.hasPermission ? (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-3 text-xs text-amber-100">
              Payments.Receive permission is required to collect payment.
            </div>
          ) : (
            <>
              {paymentMethodsQuery.isLoading && (
                <div className="mt-4 rounded-xl bg-white/[0.025] px-3 py-3 text-center text-xs text-slate-400">
                  Loading payment methods...
                </div>
              )}
              {!paymentMethodsQuery.isLoading &&
                paymentMethods.length === 0 &&
                (showAddPaymentMethod ? (
                  <div className="mt-4">
                    <PaymentMethodOnboarding
                      onCreated={() => {
                        paymentMethodsQuery.refetch();
                        setShowAddPaymentMethod(false);
                      }}
                    />
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-center">
                    <div className="text-sm font-bold text-amber-100">Payment Setup Required</div>
                    <p className="mt-1 text-xs text-amber-100/80">
                      No active payment methods are configured for this company. Add at least one
                      method to accept payments.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddPaymentMethod(true)}
                      className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:brightness-110"
                    >
                      Add Payment Method
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.PAYMENT_METHODS_ADMIN)}
                      className="mt-3 block w-full text-[11px] font-semibold text-blue-300 hover:text-blue-200"
                    >
                      Manage in Payment Methods Admin
                    </button>
                  </div>
                ))}

              {!paymentMethodsQuery.isLoading && paymentMethods.length > 0 && (
                <>
                  <div
                    ref={paymentMethodGridRef}
                    onKeyDown={handlePaymentMethodGridKeyDown}
                    className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4"
                  >
                    {paymentMethods.map((method) => {
                      const Icon = getPaymentMethodIcon(method.kind);
                      const active = selectedPaymentMethod?.paymentMethodId === method.paymentMethodId;
                      return (
                        <button
                          type="button"
                          key={method.paymentMethodId}
                          data-roving-item=""
                          onClick={() => setSelectedPaymentMethodId(method.paymentMethodId)}
                          className={`min-h-[64px] rounded-xl border px-3 py-3 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${
                            active
                              ? "border-blue-400 bg-blue-500/15"
                              : "border-white/10 bg-white/[0.025] hover:bg-white/10"
                          }`}
                        >
                          <Icon size={22} className={`mx-auto ${getPaymentMethodColor(method.kind)}`} />
                          <span className="mt-1.5 block truncate text-xs font-bold">{method.name}</span>
                          <span className="text-[10px] text-slate-500">{method.kind}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                          <CircleDollarSign size={14} className="text-emerald-300" />
                          {isCashSelected ? "Tendered" : "Amount"}
                        </div>
                        <div className="mt-1 text-2xl font-black text-white" dir="ltr">
                          {paymentAmountInput || "0"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentAmountInput(String(remainingAmount))}
                          className="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10"
                        >
                          Exact Amount
                          <ShortcutHint action="pos.exactAmount" />
                        </button>
                        {quickTenderAmounts.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setPaymentAmountInput(String(amount))}
                            className="flex h-11 items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10"
                          >
                            {formatMoney(amount, settlementCurrencyCode, settlementMinorUnitDigits)}
                          </button>
                        ))}
                      </div>

                      {isCashSelected && changeDueAmount > 0 && (
                        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-center">
                          <div className="text-[10px] font-bold uppercase text-emerald-300">Change Due</div>
                          <div className="mt-1 text-xl font-black text-emerald-200">
                            {formatMoney(changeDueAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
                          </div>
                        </div>
                      )}

                      {paymentAmountInput &&
                        (paymentAmount.error ||
                          (!isCashSelected && paymentAmount.amount > remainingAmount)) && (
                          <p className="text-[10px] text-amber-200">
                            {paymentAmount.error || "Payment amount exceeds remaining balance."}
                          </p>
                        )}
                    </div>

                    <NumericKeypadInline
                      value={paymentAmountInput}
                      onChange={setPaymentAmountInput}
                      maxDecimalPlaces={settlementMinorUnitDigits}
                      ariaLabel="Payment amount"
                      unitLabel={settlementCurrencyCode}
                      onEnter={() => {
                        if (canReceivePayment) receiveCurrentPayment();
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!canReceivePayment}
                    onClick={receiveCurrentPayment}
                    className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-lg font-black text-white shadow-lg shadow-emerald-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Wallet size={22} />
                    {receivePaymentMutation.isPending
                      ? "..."
                      : `Receive${
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
                </>
              )}
            </>
          )}
        </div>

        <aside className="flex min-h-[620px] flex-col gap-3 rounded-2xl border border-white/10 bg-[#0d1728]/95 p-3 shadow-xl shadow-black/20 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:scrollbar-none">
          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
            <span>Order status</span>
            <span className="flex items-center gap-1.5">
              {draftOrder?.orderNumberFormatted && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-bold text-slate-300">
                  {draftOrder.orderNumberFormatted}
                </span>
              )}
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300">
                {draftOrder?.status}
              </span>
            </span>
          </div>

          {customer && (
            <div className="rounded-xl bg-blue-500/10 px-3 py-2 text-xs text-blue-100">{customer.name}</div>
          )}

          <OrderLines
            draftLines={draftLines}
            draftOrder={draftOrder}
            catalogCurrencyCode={catalogCurrencyCode}
            canEditDraft={false}
            isLinePending={isLinePending}
            changeQty={noop}
            removeDraftLine={noop}
          />

          <div className="shrink-0 space-y-1 border-t border-white/10 pt-3 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>المجموع الفرعي</span>
              <span>{formatMoney(subtotal, catalogCurrencyCode, 2)}</span>
            </div>
            <div className="flex justify-between text-pink-300">
              <span>الخصم</span>
              <span>- {formatMoney(discountValue, catalogCurrencyCode, 2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ضريبة القيمة المضافة</span>
              <span>{formatMoney(vat, catalogCurrencyCode, 2)}</span>
            </div>
            <div className="mt-2 flex items-end justify-between border-t border-white/10 pt-2">
              <span className="font-bold">الإجمالي</span>
              <span className="text-2xl font-black text-blue-300">
                {formatMoney(total, catalogCurrencyCode, 2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2 text-center">
              <div className="text-emerald-300">Paid</div>
              <div className="mt-0.5 font-black text-emerald-200">
                {formatMoney(netPaidAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
              </div>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2 text-center">
              <div className="text-amber-300">Remaining</div>
              <div className="mt-0.5 font-black text-amber-200">
                {formatMoney(remainingAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
              </div>
            </div>
          </div>

          {paymentsViewPermissionQuery.hasPermission && (draftOrder?.payments || []).length > 0 && (
            <div className="space-y-2 border-t border-white/10 pt-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                <ReceiptText size={13} />
                Payment History
              </div>
              {(draftOrder?.payments || []).map((payment) => (
                <div
                  key={payment.salesOrderPaymentId}
                  className="rounded-lg border border-white/10 bg-white/[0.025] p-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-slate-100">
                        {payment.paymentMethod.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {payment.paymentMethod.code} · {payment.paymentMethod.kind} ·{" "}
                        {formatPaymentDate(payment.receivedAtUtc)}
                      </div>
                    </div>
                    <div className="text-right text-xs font-black text-emerald-300">
                      {formatMoney(payment.amount, payment.currencyCode, payment.currencyMinorUnitDigits)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>
                      Refunded{" "}
                      {formatMoney(
                        payment.refundedAmount,
                        payment.currencyCode,
                        payment.currencyMinorUnitDigits,
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={payment.refundableAmount <= 0 || !canRefundPayments}
                      onClick={() => openRefundModal(payment)}
                      className="rounded-lg border border-rose-400/25 px-2 py-1 font-bold text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Refund
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
