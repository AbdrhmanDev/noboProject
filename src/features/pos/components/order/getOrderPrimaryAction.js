// Single source of truth for "what does the primary order action currently
// do" — used by both OrderPrimaryAction.jsx (rendering) and the POS page's
// F8 shortcut (execution), so the two can never drift out of sync.
//
// Returns { kind, disabled, run }. `kind` only decides WHICH state we're in;
// labels/icons/formatted money strings stay in OrderPrimaryAction.jsx since
// they need `t()`/formatMoney, which this helper deliberately doesn't own.
export function getOrderPrimaryAction({
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
  goToPayment,
}) {
  if (isClosedOrder || isCancelledOrder) {
    return { kind: "newOrder", disabled: false, run: startNewOrder };
  }

  if (isConfirmedOrder && !isFullyPaid) {
    return { kind: "pay", disabled: false, run: onOpenPayment };
  }

  if (isConfirmedOrder && !kitchenReady) {
    return { kind: "newOrder", disabled: false, run: startNewOrder };
  }

  if (isConfirmedOrder) {
    return { kind: "closeOrder", disabled: !canCloseOrder, run: onOpenCloseOrder };
  }

  // Draft, every order type including DineIn: the primary action moves
  // straight to the Payment step — a local phase change, nothing confirmed
  // yet — so Order → Payment → Edit Order → Payment works before any real
  // payment is recorded, DineIn included. `confirmCurrentOrder` is no
  // longer this button's job; DineIn's genuine "confirm now, pay later"
  // need is its own explicit secondary action (see OrderPrimaryAction.jsx),
  // still driven by the same confirmCurrentOrder function.
  return { kind: "goToPayment", disabled: !hasOpenShift || !canConfirmOrder, run: goToPayment };
}
