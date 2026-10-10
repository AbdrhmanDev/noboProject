import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Ban, Check, CircleCheckBig, Minus, Package, Plus, RotateCcw, ShieldAlert } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { formatPaymentDate, formatQuantity } from "../../utils/posFormatters";
import { PosModal } from "../PosModal";
import { Metric } from "../PosPrimitives";

// A large, full-bleed hero banner for the Variant/Modifiers pickers -- the product's own photo AS
// the picker's background, not a small thumbnail beside the name. `-mx-5 -mt-5` cancels PosModal's
// own p-5 so the image reaches the dialog's actual edges (and its own rounded top corners).
// `object-contain` on a neutral tinted backdrop: the ENTIRE image is always visible, never cropped
// -- a hero banner that crops (object-cover) looks great for a true photo but was cutting off a
// large chunk of catalog items whose source art isn't shot to the banner's own wide/short aspect
// ratio. A visible letterboxed gap around a smaller image is a far smaller problem than literally
// losing half the picture. The name/price sit in a scrim-protected caption at the bottom so they
// stay legible either way. No image -> the same neutral backdrop with a large centered icon.
function ModalHeroImage({ imageUrl, title, subtitle }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className="pos-product-tint relative -mx-5 -mt-5 mb-4 h-36 overflow-hidden rounded-t-[var(--pos-radius-lg)]">
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain p-3"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="pos-chip absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full">
          <Package size={30} />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-5 pb-3 pt-8">
        <div className="truncate text-lg font-black text-white drop-shadow">{title}</div>
        {subtitle && <div className="pos-num text-sm font-bold text-white/90 drop-shadow">{subtitle}</div>}
      </div>
    </div>
  );
}
import { SCOPE_PRIORITY, SHORTCUT_SCOPES } from "../../../shortcuts/registry";
import { useShortcutScope } from "../../../shortcuts/useShortcuts";
import {
  ROVING_ITEM_SELECTOR,
  useAutoFocusFirstItem,
  useGridArrowNav,
} from "../../../shortcuts/rovingFocus";
import { useI18n } from "../../../../i18n/I18nContext";

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
  modifierSelectionIsValid,
  canEditDraft,
  isDraftMutationPending,
  // ByWeight modifier quantities (Variable-Weight Products Phase E): pendingWeight is set only
  // when this dialog was opened after a weight entry, modifierQuantities holds each selected
  // option's own independent count, onChangeModifierOptionQuantity adjusts one, and
  // onConfirmModifierDialog is the single submit handler for BOTH modes (branches internally).
  pendingWeight,
  modifierQuantities,
  onChangeModifierOptionQuantity,
  onConfirmModifierDialog,
  // Discount
  discountInput,
  setDiscountInput,
  discountPermissionQuery,
  applyDraftDiscount,
  discountReason,
  setDiscountReason,
  discountApproval,
  isDiscountRequestPending,
  onRefreshDraft,
  isRefreshingDraft,
  // Refund payment
  refundDraft,
  setRefundDraft,
  paymentsRefundPermissionQuery,
  refundPaymentMutation,
  refundCurrentPayment,
  // Refund approval (manager PIN)
  pendingRefundApproval,
  setPendingRefundApproval,
  refundApprovalDetailsQuery,
  managerPin,
  setManagerPin,
  approveRefundMutation,
  approveRefundRequest,
  // Close order
  draftOrder,
  total,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
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
  const { t } = useI18n();
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
            onConfirmModifierDialog();
          }
        },
      },
    ],
    [canEditDraft, modifierSelectionIsValid, isDraftMutationPending, onConfirmModifierDialog],
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
          title={t("pos.picker.variantTitle")}
          size="lg"
          onClose={() => {
            setSelectedVariantProduct(null);
            setModal(null);
          }}
        >
          <ModalHeroImage
            imageUrl={selectedVariantProduct.imageUrl}
            title={selectedVariantProduct.productName}
            subtitle={t("pos.picker.variantHint")}
          />
          <div ref={variantListRef} onKeyDown={handleVariantListKeyDown} className="grid gap-2">
            {selectedVariantProduct.variants.map((variant) => (
              <button
                key={variant.productVariantId}
                type="button"
                data-roving-item=""
                onClick={() => {
                  selectVariantForDraft(variant);
                }}
                className="flex h-14 w-full items-center justify-between gap-3 rounded-pos-lg border border-pos-border bg-pos-card px-3.5 text-start transition hover:border-pos-primary hover:bg-pos-tint active:scale-[0.99]"
              >
                <span className="min-w-0">
                  <span className="pos-fs-name block truncate font-bold text-pos-text">
                    {variant.variantName}
                  </span>
                  {variant.modifierGroups.length > 0 && (
                    <span className="pos-fs-label mt-0.5 block text-pos-muted">
                      {t("pos.catalog.hasModifiers")}
                    </span>
                  )}
                </span>
                <span className="pos-num pos-chip shrink-0 rounded-full px-3 py-1.5 text-sm font-black">
                  {formatMoney(variant.price, catalogCurrencyCode, 2)}
                </span>
              </button>
            ))}
          </div>
        </PosModal>
      )}

      {modal === "modifiers" && selectedModifierVariant && (
        <PosModal
          title={t("pos.picker.modifiersTitle")}
          size="lg"
          onClose={() => {
            setSelectedModifierVariant(null);
            setModifierSelections({});
            setModal(null);
          }}
        >
          <ModalHeroImage
            imageUrl={selectedModifierVariant.productImageUrl}
            title={selectedModifierVariant.name || selectedModifierVariant.variantName}
            subtitle={
              pendingWeight != null
                ? `${formatQuantity(pendingWeight)} ${selectedModifierVariant.salesUnitOfMeasure?.symbol ?? ""} · ${formatMoney(selectedModifierVariant.price, catalogCurrencyCode, 2)} / ${selectedModifierVariant.salesUnitOfMeasure?.symbol ?? ""}`
                : formatMoney(selectedModifierVariant.price, catalogCurrencyCode, 2)
            }
          />
          <div ref={modifierOptionsRef} onKeyDown={handleModifierOptionsKeyDown} className="space-y-3">
            {selectedModifierVariant.modifierGroups.map((group) => (
              <div key={group.modifierGroupId} className="rounded-xl bg-pos-bg p-3">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <div className="pos-fs-label font-bold text-pos-text">{group.name}</div>
                  <div className="pos-fs-label text-pos-muted">
                    {group.minSelections > 0
                      ? t("pos.catalog.groupRequired", { min: group.minSelections, max: group.maxSelections })
                      : t("pos.catalog.groupOptional", { max: group.maxSelections })}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const checked = (
                      modifierSelections[group.modifierGroupId] || []
                    ).includes(option.modifierOptionId);
                    // ByWeight mode: a checked option also gets its own [-] qty [+] stepper
                    // (independent of the product's weight -- see POSPage's
                    // changeModifierOptionQuantity), defaulting to quantity 1 the moment it's
                    // first selected.
                    const quantity = modifierQuantities?.[option.modifierOptionId] ?? 1;

                    return (
                      <div
                        key={option.modifierOptionId}
                        className={`flex items-center gap-1.5 rounded-full text-sm font-bold transition ${
                          checked
                            ? "pos-chip shadow-sm"
                            : "border border-pos-border bg-pos-card text-pos-text hover:border-pos-primary"
                        } ${pendingWeight != null && checked ? "pe-1" : ""}`}
                      >
                        <button
                          type="button"
                          data-roving-item=""
                          onClick={() => toggleModifierOption(group, option.modifierOptionId)}
                          className="flex h-11 items-center gap-1.5 rounded-full px-3.5 active:scale-95"
                        >
                          {checked && <Check size={14} />}
                          {option.name}
                          {Number(option.amountAdjustment) !== 0 && (
                            <span className="pos-num opacity-80">
                              +{formatMoney(option.amountAdjustment, catalogCurrencyCode, 2)}
                            </span>
                          )}
                        </button>
                        {pendingWeight != null && checked && (
                          <div
                            className="flex h-8 items-center gap-1 rounded-full bg-pos-bg px-1"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => onChangeModifierOptionQuantity(option.modifierOptionId, -1)}
                              aria-label={t("pos.catalog.decrement")}
                              className="grid h-6 w-6 place-items-center rounded-full text-pos-muted hover:bg-pos-card active:scale-90"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="pos-num w-4 text-center text-xs font-black">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => onChangeModifierOptionQuantity(option.modifierOptionId, 1)}
                              aria-label={t("pos.catalog.increment")}
                              className="grid h-6 w-6 place-items-center rounded-full bg-pos-primary-strong text-white active:scale-90"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={!canEditDraft || !modifierSelectionIsValid || isDraftMutationPending}
            onClick={onConfirmModifierDialog}
            className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-pos-action font-black text-pos-on-action shadow-sm transition hover:bg-pos-action-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={20} />
            {t("pos.catalog.addToOrder")}
          </button>
        </PosModal>
      )}

      {modal === "discount" && (
        <PosModal title={t("pos.discount.title")} onClose={() => setModal(null)}>
          <label className="block text-xs text-slate-400">{t("pos.discount.percentageLabel")}</label>
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
          {!discountPermissionQuery.isLoading && !discountPermissionQuery.hasPermission && (
            <>
              <p className="mt-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {t("pos.discount.approvalHint")}
              </p>
              <label className="mt-3 block text-xs text-slate-400">{t("pos.discount.reasonLabel")}</label>
              <textarea
                rows={2}
                maxLength={500}
                value={discountReason}
                onChange={(event) => setDiscountReason(event.target.value)}
                placeholder={t("pos.discount.reasonPlaceholder")}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
              />
            </>
          )}
          {discountApproval && (
            <div className="mt-3 rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-3 text-xs text-blue-100">
              <div className="font-bold">{t("pos.discount.approvalRequiredTitle")}</div>
              <p className="mt-1 leading-5">{t("pos.discount.approvalRequiredBody")}</p>
              <p className="mt-2">
                {t("pos.discount.pendingRequested", {
                  value:
                    discountApproval.discountType === "Percentage"
                      ? `${Number(discountApproval.requestedValue)}%`
                      : formatMoney(discountApproval.requestedValue, ""),
                })}
              </p>
              <p>
                {t("pos.discount.pendingEstimate", {
                  amount: formatMoney(discountApproval.estimatedAppliedAmount, ""),
                  percent: Number(discountApproval.estimatedEffectivePercent),
                })}
              </p>
              <p>{t("pos.discount.pendingExpires", { time: formatPaymentDate(discountApproval.expiresAtUtc) })}</p>
              <button
                type="button"
                onClick={onRefreshDraft}
                disabled={isRefreshingDraft}
                className="mt-3 w-full rounded-xl border border-blue-300/30 bg-blue-500/10 py-2 text-xs font-bold disabled:opacity-50"
              >
                {t("pos.discount.refreshOrder")}
              </button>
            </div>
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
            disabled={
              !canEditDraft ||
              isDraftMutationPending ||
              isDiscountRequestPending ||
              discountPermissionQuery.isLoading
            }
            className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {discountPermissionQuery.hasPermission ? "Apply Discount" : t("pos.discount.submitApproval")}
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
            {!paymentsRefundPermissionQuery.hasPermission && (
              <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {t("pos.refundApproval.directPermissionHint")}
              </p>
            )}
            <button
              type="button"
              disabled={refundPaymentMutation.isPending}
              onClick={refundCurrentPayment}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={15} />
              Process Refund
            </button>
          </div>
        </PosModal>
      )}

      {modal === "refundApprovalPending" && pendingRefundApproval && (
        <PosModal
          title={t("pos.refundApproval.requiredTitle")}
          onClose={() => {
            setPendingRefundApproval(null);
            setManagerPin("");
            setModal(null);
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-100">
              <ShieldAlert size={16} className="shrink-0" />
              {t("pos.refundApproval.requiredMessage")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Metric
                label={t("pos.refundApproval.amount")}
                value={formatMoney(pendingRefundApproval.amount, pendingRefundApproval.currencyCode, 2)}
                tone="gold"
              />
              <Metric
                label={t("pos.refundApproval.statusLabel")}
                value={refundApprovalDetailsQuery.data?.status || pendingRefundApproval.status}
                tone="blue"
              />
            </div>
            {refundApprovalDetailsQuery.data && (
              <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-[11px] text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">{t("pos.refundApproval.reason")}</span>
                  <span className="max-w-[65%] truncate text-start font-bold">
                    {refundApprovalDetailsQuery.data.reason || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">{t("pos.refundApproval.expiresAt")}</span>
                  <span className="font-bold">
                    {formatPaymentDate(refundApprovalDetailsQuery.data.expiresAtUtc)}
                  </span>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-[10px] leading-4 text-rose-100">
              {t("pos.refundApproval.disclaimer")}
            </div>
            <label className="block text-xs text-slate-400">
              {t("pos.refundApproval.managerPinLabel")}
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={managerPin}
              onChange={(event) => setManagerPin(event.target.value)}
              placeholder={t("pos.refundApproval.managerPinPlaceholder")}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
            />
            <button
              type="button"
              disabled={approveRefundMutation.isPending || !managerPin.trim()}
              onClick={approveRefundRequest}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CircleCheckBig size={15} />
              {approveRefundMutation.isPending
                ? t("pos.refundApproval.approving")
                : t("pos.refundApproval.approveButton")}
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
                  draftOrder.netPaidAmount ?? 0,
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
