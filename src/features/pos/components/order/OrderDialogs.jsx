import { useMemo, useRef } from "react";
import { AlertTriangle, Ban, CircleCheckBig, RotateCcw } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { PosModal } from "../PosModal";
import { Metric } from "../PosPrimitives";
import { SCOPE_PRIORITY, SHORTCUT_SCOPES } from "../../../shortcuts/registry";
import { useShortcutScope } from "../../../shortcuts/useShortcuts";
import {
  ROVING_ITEM_SELECTOR,
  useAutoFocusFirstItem,
  useGridArrowNav,
} from "../../../shortcuts/rovingFocus";

export function OrderDialogs({
  modal,
  setModal,
  // Variant
  selectedVariantProduct,
  setSelectedVariantProduct,
  selectVariantForDraft,
  catalogCurrencyCode,
  // Modifiers
  selectedModifierVariant,
  setSelectedModifierVariant,
  modifierSelections,
  setModifierSelections,
  toggleModifierOption,
  selectedModifierOptionIds,
  modifierSelectionIsValid,
  canEditDraft,
  isDraftMutationPending,
  addSellableVariant,
  // Discount
  discountInput,
  setDiscountInput,
  discountPermissionQuery,
  applyDraftDiscount,
  // Refund payment
  refundDraft,
  setRefundDraft,
  paymentsRefundPermissionQuery,
  refundPaymentMutation,
  refundCurrentPayment,
  // Close order
  draftOrder,
  total,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
  paymentState,
  effectiveOrderType,
  selectedRestaurantTable,
  kitchenTickets,
  readyKitchenTicketCount,
  canCloseOrder,
  closeCurrentOrder,
  // Lifecycle (cancel / prepared void)
  lifecycleDraft,
  setLifecycleDraft,
  netPaidAmount,
  preparationStarted,
  canRequestPreparedVoid,
  canRequestCancel,
  runLifecycleAction,
}) {
  const variantListRef = useRef(null);
  const handleVariantListKeyDown = useGridArrowNav(variantListRef, ROVING_ITEM_SELECTOR);
  // Nothing else focuses these lists when their dialog opens, so arrow keys
  // would do nothing until the cashier first clicked/Tabbed in.
  useAutoFocusFirstItem(variantListRef, ROVING_ITEM_SELECTOR, modal === "variant");

  const modifierOptionsRef = useRef(null);
  const handleModifierOptionsKeyDown = useGridArrowNav(modifierOptionsRef, ROVING_ITEM_SELECTOR);
  useAutoFocusFirstItem(modifierOptionsRef, ROVING_ITEM_SELECTOR, modal === "modifiers");

  const modifierModalBindings = useMemo(
    () => [
      {
        binding: { code: "Enter", ctrlKey: true },
        onTrigger: () => {
          if (canEditDraft && modifierSelectionIsValid && !isDraftMutationPending) {
            addSellableVariant(selectedModifierVariant, selectedModifierOptionIds);
            setModal(null);
          }
        },
      },
    ],
    [
      canEditDraft,
      modifierSelectionIsValid,
      isDraftMutationPending,
      addSellableVariant,
      selectedModifierVariant,
      selectedModifierOptionIds,
      setModal,
    ],
  );
  useShortcutScope({
    id: "pos-modifier-modal",
    priority: SCOPE_PRIORITY[SHORTCUT_SCOPES.MODAL],
    bindings: modifierModalBindings,
    active: modal === "modifiers",
  });

  return (
    <>
      {modal === "variant" && selectedVariantProduct && (
        <PosModal
          title="Select Variant"
          onClose={() => {
            setSelectedVariantProduct(null);
            setModal(null);
          }}
        >
          <div ref={variantListRef} onKeyDown={handleVariantListKeyDown} className="space-y-2">
            {selectedVariantProduct.variants.map((variant) => (
              <button
                key={variant.productVariantId}
                type="button"
                data-roving-item=""
                onClick={() => {
                  selectVariantForDraft(variant);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 p-3 text-right transition hover:border-blue-400/50 hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-slate-100">
                    {variant.variantName}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-500">
                    {variant.sku}
                    {variant.modifierGroups.length
                      ? ` · ${variant.modifierGroups.length} modifier groups`
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-black text-blue-300">
                  {formatMoney(variant.price, catalogCurrencyCode, 2)}
                </span>
              </button>
            ))}
          </div>
        </PosModal>
      )}

      {modal === "modifiers" && selectedModifierVariant && (
        <PosModal
          title="Select Modifiers"
          onClose={() => {
            setSelectedModifierVariant(null);
            setModifierSelections({});
            setModal(null);
          }}
        >
          <div ref={modifierOptionsRef} onKeyDown={handleModifierOptionsKeyDown} className="space-y-3">
            {selectedModifierVariant.modifierGroups.map((group) => (
              <div
                key={group.modifierGroupId}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-100">{group.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {group.minSelections}-{group.maxSelections}
                  </div>
                </div>
                <div className="grid gap-2">
                  {group.options.map((option) => {
                    const checked = (
                      modifierSelections[group.modifierGroupId] || []
                    ).includes(option.modifierOptionId);

                    return (
                      <button
                        key={option.modifierOptionId}
                        type="button"
                        data-roving-item=""
                        onClick={() => toggleModifierOption(group, option.modifierOptionId)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${
                          checked
                            ? "border-blue-400/60 bg-blue-500/15 text-blue-100"
                            : "border-white/10 bg-black/10 text-slate-300 hover:border-white/20"
                        }`}
                      >
                        <span>{option.name}</span>
                        <span className="font-bold text-slate-400">
                          {formatMoney(option.amountAdjustment, catalogCurrencyCode, 2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={!canEditDraft || !modifierSelectionIsValid || isDraftMutationPending}
            onClick={() => {
              addSellableVariant(selectedModifierVariant, selectedModifierOptionIds);
              setModal(null);
            }}
            className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to Draft
          </button>
        </PosModal>
      )}

      {modal === "discount" && (
        <PosModal title="Draft Discount" onClose={() => setModal(null)}>
          <label className="block text-xs text-slate-400">Percentage discount</label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
            <input
              type="number"
              min="1"
              max="100"
              value={discountInput}
              onChange={(event) => setDiscountInput(event.target.value)}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <span className="text-slate-400">%</span>
          </div>
          {!discountPermissionQuery.hasPermission && (
            <p className="mt-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              SalesOrders.ApplyDiscount permission is required.
            </p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[5, 10, 15].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setDiscountInput(String(value))}
                className="rounded-xl border border-pink-400/20 bg-pink-500/10 py-2 text-xs text-pink-100"
              >
                {value}%
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={applyDraftDiscount}
            disabled={!canEditDraft || isDraftMutationPending || !discountPermissionQuery.hasPermission}
            className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply Discount
          </button>
        </PosModal>
      )}

      {modal === "refundPayment" && refundDraft?.payment && (
        <PosModal
          title="Refund Payment"
          onClose={() => {
            setRefundDraft(null);
            setModal(null);
          }}
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-xs font-bold text-slate-100">
                {refundDraft.payment.paymentMethod.name}
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                {refundDraft.payment.paymentMethod.code} آ·{" "}
                {refundDraft.payment.paymentMethod.kind}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Metric
                label="Original"
                value={formatMoney(
                  refundDraft.payment.amount,
                  refundDraft.payment.currencyCode,
                  refundDraft.payment.currencyMinorUnitDigits,
                )}
                tone="blue"
              />
              <Metric
                label="Refunded"
                value={formatMoney(
                  refundDraft.payment.refundedAmount,
                  refundDraft.payment.currencyCode,
                  refundDraft.payment.currencyMinorUnitDigits,
                )}
                tone="pink"
              />
              <Metric
                label="Refundable"
                value={formatMoney(
                  refundDraft.payment.refundableAmount,
                  refundDraft.payment.currencyCode,
                  refundDraft.payment.currencyMinorUnitDigits,
                )}
                tone="gold"
              />
            </div>
            <label className="block text-xs text-slate-400">Refund amount</label>
            <input
              type="text"
              inputMode="decimal"
              value={refundDraft.amount}
              onChange={(event) =>
                setRefundDraft((draft) => (draft ? { ...draft, amount: event.target.value } : draft))
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
            />
            <label className="block text-xs text-slate-400">Reason</label>
            <textarea
              value={refundDraft.reason}
              onChange={(event) =>
                setRefundDraft((draft) => (draft ? { ...draft, reason: event.target.value } : draft))
              }
              className="h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none"
            />
            <label className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-100">
              <input
                type="checkbox"
                checked={refundDraft.confirmation}
                onChange={(event) =>
                  setRefundDraft((draft) =>
                    draft ? { ...draft, confirmation: event.target.checked } : draft,
                  )
                }
              />
              Confirm money refund
            </label>
            <button
              type="button"
              disabled={refundPaymentMutation.isPending || !paymentsRefundPermissionQuery.hasPermission}
              onClick={refundCurrentPayment}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={15} />
              Process Refund
            </button>
          </div>
        </PosModal>
      )}

      {modal === "closeOrder" && draftOrder && (
        <PosModal title="Close Order" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
                <CircleCheckBig size={16} />
                Ready to close
              </div>
              <div className="mt-1 text-[10px] text-emerald-200/80">
                #{draftOrder.salesOrderId.slice(-8)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Metric
                label="Total"
                value={formatMoney(total, settlementCurrencyCode, settlementMinorUnitDigits)}
                tone="blue"
              />
              <Metric
                label="Net paid"
                value={formatMoney(
                  paymentState?.netPaidAmount ?? draftOrder.netPaidAmount ?? 0,
                  settlementCurrencyCode,
                  settlementMinorUnitDigits,
                )}
                tone="green"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs text-slate-300">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Type</span>
                <span className="font-bold">{effectiveOrderType}</span>
              </div>
              {selectedRestaurantTable && (
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-slate-500">Table</span>
                  <span className="font-bold">
                    {selectedRestaurantTable.floorName} آ·{" "}
                    {selectedRestaurantTable.code}
                  </span>
                </div>
              )}
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-slate-500">Kitchen</span>
                <span className="font-bold">
                  {kitchenTickets.length === 0
                    ? "No tickets"
                    : `${readyKitchenTicketCount}/${kitchenTickets.length} Ready`}
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={!canCloseOrder}
              onClick={closeCurrentOrder}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CircleCheckBig size={15} />
              Confirm Close
            </button>
          </div>
        </PosModal>
      )}

      {(modal === "cancelOrder" || modal === "preparedVoidOrder") && lifecycleDraft && draftOrder && (
        <PosModal
          title={lifecycleDraft.action === "preparedVoid" ? "Prepared Void" : "Cancel Order"}
          onClose={() => {
            setLifecycleDraft(null);
            setModal(null);
          }}
        >
          <div className="space-y-3">
            <div
              className={`rounded-xl border p-3 ${
                lifecycleDraft.action === "preparedVoid"
                  ? "border-amber-400/20 bg-amber-500/10"
                  : "border-rose-400/20 bg-rose-500/10"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                {lifecycleDraft.action === "preparedVoid" ? (
                  <AlertTriangle size={16} className="text-amber-300" />
                ) : (
                  <Ban size={16} className="text-rose-300" />
                )}
                #{draftOrder.salesOrderId.slice(-8)}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-300">
                {lifecycleDraft.action === "preparedVoid"
                  ? "This order has entered preparation. Backend will cancel kitchen tickets for prepared void and will not be treated as a normal pre-preparation cancel."
                  : "This order will be cancelled. Backend owns any allowed inventory reversal and table release side effects."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Metric
                label="Net paid"
                value={formatMoney(netPaidAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
                tone={netPaidAmount === 0 ? "green" : "gold"}
              />
              <Metric
                label="Kitchen"
                value={
                  kitchenTickets.length === 0
                    ? "No tickets"
                    : preparationStarted
                      ? "Started"
                      : "New"
                }
                tone={preparationStarted ? "gold" : "blue"}
              />
            </div>
            <label className="block text-xs text-slate-400">Reason</label>
            <textarea
              value={lifecycleDraft.reason}
              onChange={(event) =>
                setLifecycleDraft((draft) => (draft ? { ...draft, reason: event.target.value } : draft))
              }
              className="h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none"
            />
            {netPaidAmount > 0 && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Refund the payment before this lifecycle action.
              </div>
            )}
            <button
              type="button"
              disabled={
                lifecycleDraft.action === "preparedVoid" ? !canRequestPreparedVoid : !canRequestCancel
              }
              onClick={runLifecycleAction}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                lifecycleDraft.action === "preparedVoid"
                  ? "bg-amber-600 text-white"
                  : "bg-rose-600 text-white"
              }`}
            >
              {lifecycleDraft.action === "preparedVoid" ? (
                <AlertTriangle size={15} />
              ) : (
                <Ban size={15} />
              )}
              {lifecycleDraft.action === "preparedVoid" ? "Confirm Prepared Void" : "Confirm Cancel"}
            </button>
          </div>
        </PosModal>
      )}
    </>
  );
}
