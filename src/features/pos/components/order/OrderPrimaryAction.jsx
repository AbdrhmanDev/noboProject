import { Ban, Check, CircleCheckBig, Plus, WalletCards } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { ShortcutHint } from "../../../shortcuts/components/ShortcutHint";
import { getOrderPrimaryAction } from "./getOrderPrimaryAction";

export function OrderPrimaryAction({
  isClosedOrder,
  isCancelledOrder,
  isConfirmedOrder,
  isFullyPaid,
  kitchenReady,
  draftOrder,
  startNewOrder,
  onOpenPayment,
  remainingAmount,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
  readyKitchenTicketCount,
  kitchenTickets,
  closeBlockers,
  canCloseOrder,
  onOpenCloseOrder,
  hasOpenShift,
  canConfirmOrder,
  confirmCurrentOrder,
  orderType,
  total,
  catalogCurrencyCode,
}) {
  // `getOrderPrimaryAction` decides eligibility (`disabled`) — the branches
  // below only pick a label/icon for the SAME `kind` it returned, they never
  // re-derive whether the action is allowed.
  const primaryAction = getOrderPrimaryAction({
    isClosedOrder,
    isCancelledOrder,
    isConfirmedOrder,
    isFullyPaid,
    kitchenReady,
    canCloseOrder,
    canConfirmOrder,
    hasOpenShift,
    startNewOrder,
    onOpenPayment,
    onOpenCloseOrder,
    confirmCurrentOrder,
  });

  if (isClosedOrder || isCancelledOrder) {
    return (
      <button
        type="button"
        onClick={primaryAction.run}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-700 text-sm font-black transition hover:bg-slate-600"
      >
        {isClosedOrder ? <CircleCheckBig size={18} /> : <Ban size={18} />}
        {isClosedOrder
          ? "Closed -"
          : draftOrder?.cancellationKind === "PreparedVoid"
            ? "Prepared Void -"
            : "Cancelled -"}
        <Plus size={16} />
        New Order
        <ShortcutHint action="pos.confirm" className="mr-1" />
      </button>
    );
  }

  if (isConfirmedOrder && !isFullyPaid) {
    return (
      <button
        type="button"
        onClick={primaryAction.run}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black shadow-lg shadow-emerald-950/30 transition hover:brightness-110"
      >
        <WalletCards size={19} />
        Pay · {formatMoney(remainingAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
        <ShortcutHint action="pos.confirm" className="mr-1" />
      </button>
    );
  }

  if (isConfirmedOrder && !kitchenReady) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          <div className="font-bold">Payment complete</div>
          <div className="mt-0.5 text-[10px] text-emerald-200/80">
            Order sent to kitchen · {readyKitchenTicketCount}/{kitchenTickets.length} ready
          </div>
        </div>
        <button
          type="button"
          onClick={primaryAction.run}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black shadow-lg shadow-blue-950/30 transition hover:brightness-110"
        >
          <Plus size={18} />
          New Order
          <ShortcutHint action="pos.confirm" className="mr-1" />
        </button>
      </div>
    );
  }

  if (isConfirmedOrder) {
    return (
      <div className="space-y-2">
        {closeBlockers.length > 0 && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[10px] leading-4 text-amber-100">
            {closeBlockers[0]}
          </div>
        )}
        <button
          type="button"
          disabled={primaryAction.disabled}
          onClick={primaryAction.run}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black shadow-lg shadow-emerald-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CircleCheckBig size={19} />
          Close Order
          <ShortcutHint action="pos.confirm" className="mr-1" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={primaryAction.disabled}
      onClick={primaryAction.run}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-[#0A84FF] text-sm font-black shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Check size={19} />
      {orderType === "DineIn" ? "Confirm Order" : "Confirm & Pay"} ·{" "}
      {formatMoney(total, catalogCurrencyCode, 2)}
      <ShortcutHint action="pos.confirm" className="mr-1" />
    </button>
  );
}
