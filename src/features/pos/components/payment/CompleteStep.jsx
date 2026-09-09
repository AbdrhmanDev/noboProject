import { useMemo } from "react";
import { CircleCheckBig, Plus } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { SCOPE_PRIORITY, SHORTCUT_SCOPES } from "../../../shortcuts/registry";
import { useShortcutScope } from "../../../shortcuts/useShortcuts";

/**
 * Calm success state entered automatically once payment finishes. No
 * receipt/print action — the backend has no wired print capability yet
 * (PrintCustomerReceiptHandler exists server-side but nothing on the
 * frontend calls it), and inventing one here would be a fake system state.
 */
export function CompleteStep({
  draftOrder,
  total,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
  kitchenTickets,
  readyKitchenTicketCount,
  kitchenReady,
  closePermissionQuery,
  onOpenCloseOrder,
  startNewOrder,
  onBack,
}) {
  // The old PaymentModal's fully-paid success view lived inside the same
  // MODAL-priority scope as the payment form, so F1-F9 were inert there and
  // Escape closed back to the order without starting a new one. Keep both
  // exactly, now that this is a persistent phase instead of a dialog.
  const stepBindings = useMemo(() => [{ binding: { code: "Escape" }, onTrigger: onBack }], [onBack]);
  useShortcutScope({
    id: "pos-complete-step",
    priority: SCOPE_PRIORITY[SHORTCUT_SCOPES.MODAL],
    bindings: stepBindings,
  });

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-[#0d1728]/95 p-8 text-center shadow-xl shadow-black/20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15">
          <CircleCheckBig size={32} className="text-emerald-300" />
        </div>
        <div>
          <div className="text-lg font-bold text-white">تم الدفع بنجاح</div>
          {draftOrder?.orderNumberFormatted && (
            <div className="mt-1 text-xs text-slate-400">رقم الطلب {draftOrder.orderNumberFormatted}</div>
          )}
          <div className="mt-3 text-3xl font-black text-emerald-300">
            {formatMoney(total, settlementCurrencyCode, settlementMinorUnitDigits)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
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
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-bold text-slate-200 hover:border-emerald-400/40 hover:bg-emerald-500/10"
            >
              <CircleCheckBig size={18} />
              إغلاق الطلب
            </button>
          )}
          <button
            type="button"
            onClick={startNewOrder}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-950/30 hover:brightness-110"
          >
            <Plus size={20} />
            طلب جديد
          </button>
        </div>
      </div>
    </div>
  );
}
