import { useMemo } from "react";
import { CircleCheckBig, Plus } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { useI18n } from "../../../../i18n/I18nContext";
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
  const { t } = useI18n();
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
    <div className="relative grid min-h-[60vh] place-items-center">
      <div className="relative w-full max-w-sm space-y-5 overflow-hidden rounded-pos-lg border border-pos-border bg-pos-card p-8 text-center shadow-xl shadow-black/10">
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {["pink", "yellow", "blue", "green"].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--brand-${c})` }} />
          ))}
        </div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-pos-action/40 bg-pos-action-tint">
          <CircleCheckBig size={32} className="text-pos-action-text" />
        </div>
        <div>
          <div className="text-lg font-bold text-pos-text">{t("pos.complete.success")}</div>
          {draftOrder?.orderNumberFormatted && (
            <div className="pos-num mt-1 text-xs text-pos-muted">{t("pos.complete.orderNo", { number: draftOrder.orderNumberFormatted })}</div>
          )}
          <div className="pos-num mt-3 text-3xl font-black text-pos-action-text">
            {formatMoney(total, settlementCurrencyCode, settlementMinorUnitDigits)}
          </div>
          <div className="mt-2 text-xs text-pos-muted">
            {kitchenTickets.length > 0
              ? t("pos.action.sentToKitchen", { ready: readyKitchenTicketCount, total: kitchenTickets.length })
              : t("pos.complete.confirmed")}
          </div>
        </div>
        <div className="grid gap-2">
          {kitchenReady && closePermissionQuery.hasPermission && (
            <button
              type="button"
              onClick={onOpenCloseOrder}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-pos-lg border border-pos-border bg-pos-bg text-sm font-bold text-pos-text hover:border-pos-action hover:bg-pos-action-tint"
            >
              <CircleCheckBig size={18} />
              {t("pos.action.closeOrder")}
            </button>
          )}
          <button
            type="button"
            onClick={startNewOrder}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-pos-lg bg-pos-primary-strong text-base font-black text-white shadow-lg transition hover:bg-pos-primary-strong-hover"
          >
            <Plus size={20} />
            {t("pos.action.newOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}
