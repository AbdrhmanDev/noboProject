import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Gift,
  MoreHorizontal,
  PauseCircle,
  ReceiptText,
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
  onOpenCashMovement,
  shouldShowPaymentPanel,
  paymentsViewPermissionQuery,
  canRefundPayments,
  openRefundModal,
  onOpenDiscount,
  canEditDraft,
  isDraftMutationPending,
}) {
  const [expanded, setExpanded] = useState(false);

  // Retrieve Order used to live here too, but it's a low-frequency,
  // session-level action (not per-order work) — it now lives in the POS
  // page's own toolbar next to Shift History/Terminals, freeing a full row
  // in the vertical stack for the line list, which needs it far more.
  const showLifecycle = !isClosedOrder && !isCancelledOrder && draftOrder;
  const showShiftActions = !isClosedOrder && !isCancelledOrder;
  const paymentsCount = (draftOrder?.payments || []).length;
  const showPayments =
    shouldShowPaymentPanel &&
    paymentsViewPermissionQuery.hasPermission &&
    paymentsCount > 0;

  const hasMoreSection = showLifecycle || showShiftActions || showPayments;

  if (!hasMoreSection) {
    return null;
  }

  return (
    <div className="mt-1 shrink-0 space-y-1">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-slate-400 transition hover:border-blue-400/30 hover:text-slate-200"
      >
        <MoreHorizontal size={14} />
        More actions
        {draftOrder?.discount && (
          <Gift size={12} className="text-pink-300" />
        )}
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
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && hasMoreSection && (
        <div className="mt-2 max-h-[22vh] min-h-0 space-y-3 overflow-y-auto pr-1 scrollbar-none">
          {showShiftActions && (
            <div className="grid grid-cols-2 gap-2">
              <IconButton
                icon={Gift}
                label={draftOrder?.discount ? "تعديل الخصم" : "خصم وعروض"}
                tone="pink"
                onClick={onOpenDiscount}
                disabled={!canEditDraft || isDraftMutationPending}
              />
              <IconButton
                icon={CircleDollarSign}
                label="حركة نقدية"
                onClick={onOpenCashMovement}
              />
              <IconButton
                icon={PauseCircle}
                label="حفظ مؤقت"
                onClick={holdOrder}
                disabled
                hint={
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                    قريبًا
                  </span>
                }
              />
            </div>
          )}

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

          {showPayments && (
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                <ReceiptText size={13} />
                Payments
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
        </div>
      )}
    </div>
  );
}
