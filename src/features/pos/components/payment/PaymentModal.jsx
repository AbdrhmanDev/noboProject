import { CircleCheckBig, CircleDollarSign, Plus, ReceiptText } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { formatPaymentDate, getPaymentMethodColor, getPaymentMethodIcon } from "../../utils/posFormatters";
import { PosModal } from "../PosModal";
import { PaymentMethodOnboarding } from "../../../payments/components/PaymentMethodOnboarding";
import { ROUTES } from "../../../../utils/routes";

export function PaymentModal({
  draftOrder,
  total,
  catalogCurrencyCode,
  netPaidAmount,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
  remainingAmount,
  isFullyPaid,
  kitchenTickets,
  readyKitchenTicketCount,
  kitchenReady,
  closePermissionQuery,
  onClose,
  onOpenCloseOrder,
  startNewOrder,
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
  paymentState,
  canRefundPayments,
  openRefundModal,
  navigate,
}) {
  if (!draftOrder) return null;

  return (
    <PosModal title="Payment" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
          <div className="text-[10px] font-bold uppercase text-slate-500">Total Due</div>
          <div className="mt-1 text-3xl font-black text-blue-300">
            {formatMoney(total, catalogCurrencyCode, 2)}
          </div>
          {netPaidAmount > 0 && (
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span>
                Paid {formatMoney(netPaidAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
              </span>
              <span className="font-bold text-amber-300">
                Remaining{" "}
                {formatMoney(remainingAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
              </span>
            </div>
          )}
        </div>

        {isFullyPaid ? (
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15">
              <CircleCheckBig size={24} className="text-emerald-300" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Payment complete</div>
              <div className="mt-1 text-xs text-slate-400">
                {kitchenTickets.length > 0
                  ? `Order sent to kitchen · ${readyKitchenTicketCount}/${kitchenTickets.length} ready`
                  : "Order confirmed."}
              </div>
            </div>
            <div className="grid gap-2">
              {kitchenReady && closePermissionQuery.hasPermission && (
                <button
                  type="button"
                  onClick={onOpenCloseOrder}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:brightness-110"
                >
                  <CircleCheckBig size={17} />
                  Close Order
                </button>
              )}
              <button
                type="button"
                onClick={startNewOrder}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white hover:brightness-110"
              >
                <Plus size={17} />
                New Order
              </button>
            </div>
          </div>
        ) : !paymentsReceivePermissionQuery.hasPermission ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-3 text-xs text-amber-100">
            Payments.Receive permission is required to collect payment.
          </div>
        ) : (
          <>
            {paymentMethodsQuery.isLoading && (
              <div className="rounded-xl bg-white/[0.025] px-3 py-3 text-center text-xs text-slate-400">
                Loading payment methods...
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
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-center">
                  <div className="text-sm font-bold text-amber-100">Payment Setup Required</div>
                  <p className="mt-1 text-xs text-amber-100/80">
                    No active payment methods are configured for this company. Add at least one
                    method to accept payments.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentMethod(true)}
                    className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:brightness-110"
                  >
                    <Plus size={16} />
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
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => {
                    const Icon = getPaymentMethodIcon(method.kind);

                    return (
                      <button
                        type="button"
                        key={method.paymentMethodId}
                        onClick={() => setSelectedPaymentMethodId(method.paymentMethodId)}
                        className={`rounded-xl border px-3 py-3 text-center transition ${
                          selectedPaymentMethod?.paymentMethodId === method.paymentMethodId
                            ? "border-blue-400 bg-blue-500/15"
                            : "border-white/10 bg-white/[0.025] hover:bg-white/10"
                        }`}
                      >
                        <Icon size={20} className={`mx-auto ${getPaymentMethodColor(method.kind)}`} />
                        <span className="mt-1.5 block truncate text-xs font-bold">
                          {method.name}
                        </span>
                        <span className="text-[10px] text-slate-500">{method.kind}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 p-2">
                    <CircleDollarSign size={16} className="text-emerald-300" />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={paymentAmountInput}
                      onChange={(event) => setPaymentAmountInput(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      placeholder="Payment amount"
                    />
                    <button
                      type="button"
                      onClick={() => setPaymentAmountInput(String(remainingAmount))}
                      className="shrink-0 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/10"
                    >
                      Exact Amount
                    </button>
                  </div>
                  {paymentAmountInput &&
                    (paymentAmount.error || paymentAmount.amount > remainingAmount) && (
                      <p className="text-[10px] text-amber-200">
                        {paymentAmount.error || "Payment amount exceeds remaining balance."}
                      </p>
                    )}
                  <button
                    type="button"
                    disabled={!canReceivePayment}
                    onClick={receiveCurrentPayment}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {receivePaymentMutation.isPending
                      ? "..."
                      : `Receive${
                          paymentAmount.amount !== null
                            ? ` ${formatMoney(
                                paymentAmount.amount,
                                settlementCurrencyCode,
                                settlementMinorUnitDigits,
                              )}`
                            : ""
                        }`}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {paymentsViewPermissionQuery.hasPermission && (paymentState?.payments || []).length > 0 && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
              <ReceiptText size={13} />
              Payment History
            </div>
            {(paymentState?.payments || []).map((payment) => (
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
      </div>
    </PosModal>
  );
}
