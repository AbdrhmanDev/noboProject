import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  MoreHorizontal,
  PauseCircle,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { formatPaymentDate } from "../../utils/posFormatters";
import { IconButton } from "../PosPrimitives";

export function OrderSecondaryActions({
  isClosedOrder,
  isCancelledOrder,
  draftOrder,
  preparationStarted,
  canRequestPreparedVoid,
  canRequestCancel,
  openLifecycleModal,
  lifecycleBlocker,
  cancelPermissionQuery,
  voidPreparedPermissionQuery,
  holdOrder,
  onOpenRetrieve,
  onOpenCashMovement,
  shouldShowPaymentPanel,
  paymentsViewPermissionQuery,
  paymentHistoryQuery,
  paymentState,
  canRefundPayments,
  openRefundModal,
}) {
  const [expanded, setExpanded] = useState(false);

  const showLifecycle = !isClosedOrder && !isCancelledOrder && draftOrder;
  const showQuickActions = !isClosedOrder && !isCancelledOrder;
  const paymentsCount = (paymentState?.payments || []).length;
  const showPayments =
    shouldShowPaymentPanel &&
    paymentsViewPermissionQuery.hasPermission &&
    (paymentHistoryQuery.isLoading || paymentsCount > 0);

  if (!showLifecycle && !showQuickActions && !showPayments) {
    return null;
  }

  return (
    <div className="mt-3 shrink-0 border-t border-white/10 pt-2">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200"
      >
        <span className="flex items-center gap-1.5">
          <MoreHorizontal size={14} />
          More actions
          {lifecycleBlocker && (
            <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-200">
              1
            </span>
          )}
          {!lifecycleBlocker && paymentsCount > 0 && (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-slate-300">
              {paymentsCount}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-2 max-h-[22vh] min-h-0 space-y-3 overflow-y-auto pr-1 scrollbar-none">
          {showLifecycle && (
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100">Lifecycle</div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {preparationStarted
                      ? "Preparation has started"
                      : "Preparation has not started"}
                  </div>
                </div>
                {preparationStarted ? (
                  <button
                    type="button"
                    disabled={!canRequestPreparedVoid}
                    onClick={() => openLifecycleModal("preparedVoid")}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <AlertTriangle size={13} />
                    Prepared Void
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canRequestCancel}
                    onClick={() => openLifecycleModal("cancel")}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[10px] font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Ban size={13} />
                    Cancel
                  </button>
                )}
              </div>
              {lifecycleBlocker && (
                <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-100">
                  {lifecycleBlocker}
                </div>
              )}
              {!preparationStarted && !cancelPermissionQuery.hasPermission && (
                <div className="mt-2 text-[10px] text-slate-500">
                  SalesOrders.Cancel permission is required.
                </div>
              )}
              {preparationStarted && !voidPreparedPermissionQuery.hasPermission && (
                <div className="mt-2 text-[10px] text-slate-500">
                  SalesOrders.VoidPrepared permission is required.
                </div>
              )}
            </div>
          )}

          {showQuickActions && (
            <div className="grid grid-cols-3 gap-2">
              <IconButton icon={PauseCircle} label="حفظ مؤقت" onClick={holdOrder} />
              <IconButton icon={RotateCcw} label="استرجاع" onClick={onOpenRetrieve} />
              <IconButton
                icon={CircleDollarSign}
                label="حركة نقدية"
                onClick={onOpenCashMovement}
              />
            </div>
          )}

          {showPayments && (
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                <ReceiptText size={13} />
                Payments
              </div>
              {paymentHistoryQuery.isLoading && (
                <div className="rounded-lg bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                  Loading payment history...
                </div>
              )}
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
      )}
    </div>
  );
}
