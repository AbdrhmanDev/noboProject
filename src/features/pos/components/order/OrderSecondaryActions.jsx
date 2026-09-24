import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Banknote,
  Check,
  CreditCard,
  MessageSquare,
  MoreHorizontal,
  Percent,
  ReceiptText,
  Smartphone,
  Trash2,
} from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { useI18n } from "../../../../i18n/I18nContext";

import { formatPaymentDate } from "../../utils/posFormatters";
import { PosModal } from "../PosModal";

const KITCHEN_NOTE_MAX_LENGTH = 300;

// The cashier picks between exactly three ways to pay. Each maps onto one of the company's
// active payment methods: Cash by kind, NFC by name/code (the backend has no NFC kind), and
// Card by kind. NFC and Card fall back to each other (NFC is a contactless card payment) so
// both stay selectable; a choice is only disabled when nothing at all can back it.
const isNfcMethod = (method) => /nfc|contactless|tap/i.test(`${method.name} ${method.code}`);

const PAYMENT_CHOICES = [
  {
    id: "cash",
    labelKey: "pos.quick.cash",
    icon: Banknote,
    resolve: (methods) =>
      methods.find((method) => method.kind === "Cash") ||
      methods.find((method) => /cash|نقد/i.test(`${method.name} ${method.code}`)) ||
      null,
  },
  {
    id: "card",
    labelKey: "pos.quick.card",
    icon: CreditCard,
    resolve: (methods) =>
      methods.find((method) => method.kind === "Card" && !isNfcMethod(method)) ||
      methods.find((method) => method.kind === "Card" || isNfcMethod(method)) ||
      null,
  },
  {
    id: "nfc",
    label: "NFC",
    icon: Smartphone,
    resolve: (methods) =>
      methods.find(isNfcMethod) || methods.find((method) => method.kind === "Card") || null,
  },
];

function QuickAction({ icon: Icon, label, active = false, onClick, disabled = false, accent = "var(--brand-blue)" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-active={active}
      style={{ "--pos-accent": accent }}
      className="pos-quick pos-fs-name flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-pos border border-pos-border bg-pos-card px-2 py-1 text-pos-text transition disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className="pos-chip grid h-6 w-6 place-items-center rounded-full">
        <Icon size={14} />
      </span>
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

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
  shouldShowPaymentPanel,
  paymentsViewPermissionQuery,
  canRefundPayments,
  openRefundModal,
  onOpenDiscount,
  canEditDraft,
  isDraftMutationPending,
  selectedLineId,
  removeDraftLine,
  canEditDraftLines,
  paymentMethods = [],
  selectedPaymentMethod = null,
  onSelectPaymentMethod,
  kitchenNote = "",
  onKitchenNoteChange,
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [pickedChoiceId, setPickedChoiceId] = useState("");

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

  const hasMoreSection = showLifecycle || showPayments;

  if (!showShiftActions && !hasMoreSection) {
    return null;
  }

  const paymentChoices = PAYMENT_CHOICES.map((choice) => ({
    ...choice,
    label: choice.labelKey ? t(choice.labelKey) : choice.label,
    method: choice.resolve(paymentMethods),
  }));
  const selectedMethodId = selectedPaymentMethod?.paymentMethodId;
  // Card and NFC can share one backing method, so prefer the choice the cashier actually tapped.
  const activeChoice =
    paymentChoices.find((choice) => choice.id === pickedChoiceId && choice.method?.paymentMethodId === selectedMethodId) ||
    paymentChoices.find((choice) => choice.method?.paymentMethodId === selectedMethodId) ||
    null;
  const MethodIcon = activeChoice?.icon || CreditCard;
  const hasDiscount = Boolean(draftOrder?.discount);
  // "Void all" is the existing cancel flow (Prepared Void once the kitchen has started),
  // so it keeps its permission checks and reason dialog.
  const voidAllAction = preparationStarted ? "preparedVoid" : "cancel";
  const canVoidAll = Boolean(draftOrder) && (preparationStarted ? canRequestPreparedVoid : canRequestCancel);
  const canVoidLine = Boolean(selectedLineId) && canEditDraftLines && !isDraftMutationPending;

  return (
    <div className="mt-2 shrink-0 space-y-1.5">
      <div className="flex items-stretch gap-1.5">
        {showShiftActions && (
          <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5">
            <QuickAction
              icon={Percent}
              label={hasDiscount ? t("pos.quick.editDiscount") : t("pos.quick.discount")}
              accent="var(--brand-yellow)"
              active={hasDiscount}
              onClick={onOpenDiscount}
              disabled={!canEditDraft || isDraftMutationPending}
            />
            <QuickAction
              icon={MethodIcon}
              label={t("pos.quick.paymentMethod")}
              accent="var(--brand-blue)"
              active={Boolean(activeChoice)}
              onClick={() => setMethodOpen(true)}
            />
            <QuickAction
              icon={MessageSquare}
              label={t("pos.quick.kitchenNote")}
              accent="var(--brand-green)"
              active={Boolean(kitchenNote)}
              onClick={() => {
                setNoteDraft(kitchenNote);
                setNoteOpen(true);
              }}
              disabled={!canEditDraft}
            />
          </div>
        )}
        {hasMoreSection && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-label={t("pos.quick.moreActions")}
            title={t("pos.quick.moreActions")}
            aria-expanded={expanded}
            className={`relative grid w-12 shrink-0 place-items-center rounded-pos border transition ${
              expanded
                ? "border-pos-primary bg-pos-tint text-pos-primary-text"
                : "border-pos-border bg-pos-card text-pos-muted hover:border-pos-primary hover:text-pos-text"
            }`}
          >
            <MoreHorizontal size={16} />
            {(lifecycleBlocker || paymentsCount > 0) && (
              <span className="absolute -end-1 -top-1 h-2.5 w-2.5 rounded-full bg-pos-primary" />
            )}
          </button>
        )}
      </div>

      {showShiftActions && (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => removeDraftLine(selectedLineId)}
            disabled={!canVoidLine}
            className="pos-control pos-fs-name flex !min-h-10 items-center justify-center gap-1.5 border border-pos-danger/50 bg-pos-card text-pos-danger-text transition hover:bg-pos-danger/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 size={14} />
            Void line
          </button>
          <button
            type="button"
            onClick={() => openLifecycleModal(voidAllAction)}
            disabled={!canVoidAll}
            className="pos-control pos-fs-name flex !min-h-10 items-center justify-center gap-1.5 border border-pos-danger/50 bg-pos-card text-pos-danger-text transition hover:bg-pos-danger/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Ban size={14} />
            Void all
          </button>
        </div>
      )}

      {expanded && hasMoreSection && (
        <div className="mt-2 max-h-[22vh] min-h-0 space-y-3 overflow-y-auto pe-1 scrollbar-none">
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
                    <div className="text-end text-xs font-black text-emerald-300">
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
      {methodOpen && (
        <PosModal title={t("pos.quick.paymentMethod")} onClose={() => setMethodOpen(false)}>
          <div className="grid grid-cols-3 gap-2">
            {paymentChoices.map(({ id, label, icon: Icon, method }) => {
              const selected = activeChoice?.id === id;

              return (
                <button
                  key={id}
                  type="button"
                  disabled={!method}
                  onClick={() => {
                    setPickedChoiceId(id);
                    onSelectPaymentMethod?.(method.paymentMethodId);
                    setMethodOpen(false);
                  }}
                  className={`pos-fs-base relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-pos border px-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    selected
                      ? "border-pos-primary bg-pos-tint text-pos-primary-text"
                      : "border-pos-border bg-pos-bg text-pos-text hover:border-pos-primary hover:bg-pos-tint"
                  }`}
                >
                  {selected && <Check size={14} className="absolute end-2 top-2" />}
                  <Icon size={26} />
                  {label}
                  {!method && <span className="text-[10px] font-normal text-pos-muted">{t("pos.quick.notEnabled")}</span>}
                </button>
              );
            })}
          </div>
        </PosModal>
      )}

      {noteOpen && (
        <PosModal title={t("pos.quick.kitchenNote")} onClose={() => setNoteOpen(false)}>
          <textarea
            autoFocus
            rows={4}
            maxLength={KITCHEN_NOTE_MAX_LENGTH}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder={t("pos.quick.notePlaceholder")}
            className="pos-fs-base w-full resize-none rounded-pos border border-pos-border bg-pos-card px-3 py-2 text-pos-text outline-none placeholder:text-subtle focus:border-accent focus:ring-[3px] focus:ring-pos-primary/20"
          />
          <div className="mt-1 text-end text-[10px] text-pos-muted">
            {noteDraft.length}/{KITCHEN_NOTE_MAX_LENGTH}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onKitchenNoteChange?.("");
                setNoteOpen(false);
              }}
              className="pos-control pos-fs-name border border-pos-border bg-pos-card text-pos-text transition hover:bg-pos-tint"
            >
              {t("pos.quick.clear")}
            </button>
            <button
              type="button"
              onClick={() => {
                onKitchenNoteChange?.(noteDraft.trim());
                setNoteOpen(false);
              }}
              className="pos-control pos-fs-name bg-pos-primary-strong text-white transition hover:bg-pos-primary-strong-hover"
            >
              {t("pos.quick.saveNote")}
            </button>
          </div>
        </PosModal>
      )}
    </div>
  );
}
