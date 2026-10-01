import { useState } from "react";
import { Ban, Eraser, Percent, StickyNote, UserRound } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nContext";
import { OrderPrimaryAction } from "./OrderPrimaryAction";
import { PosModal } from "../PosModal";

// Touch-first POS redesign: a fixed bottom quick-action bar, always on screen during the Order
// phase regardless of whether the cart sheet is open — Payment (the largest/rightmost action) must
// never require opening the cart first (spec requirement). Every action here calls the SAME
// handlers the previous sidebar/dialogs already used (openLifecycleModal, startNewOrder, the modal
// state setters, OrderPrimaryAction's own state machine) — nothing new is invented.
export function PosActionBar({
  onOpenDiscount,
  discountDisabled,
  orderNote,
  onOrderNoteChange,
  onOpenCustomer,
  customerName,
  customerDisabled,
  onClear,
  canRequestCancel,
  onCancel,
  primaryActionProps,
}) {
  const { t } = useI18n();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  return (
    // min-h-[var(--pos-action-bar-h)] is the SAME value the scrollable content areas (CatalogPanel's
    // grid and the page's own bottom padding) reserve as their own bottom clearance, so this bar's
    // real rendered height and "how much space is reserved for it elsewhere" can never drift apart.
    // pb-[env(safe-area-inset-bottom)] keeps the bar itself clear of a device's own home-indicator
    // area instead of letting its content sit under it.
    <div
      // left-0 + an explicit `right` (not `inset-x-0`, which sets right:0 unconditionally) so this
      // bar stops short of the app's own nav sidebar instead of rendering underneath/over it --
      // --app-sidebar-w (AppLayout.jsx) is 0 unless the sidebar is actually on this same physical
      // right edge.
      style={{ right: "var(--app-sidebar-w, 0px)" }}
      className="fixed left-0 bottom-0 z-[85] flex min-h-[var(--pos-action-bar-h)] items-stretch border-t border-pos-border bg-pos-card px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex w-full max-w-[2200px] items-stretch gap-1.5">
        <BarButton
          icon={Percent}
          label={t("pos.actionBar.discount")}
          onClick={onOpenDiscount}
          disabled={discountDisabled}
        />
        <BarButton
          icon={StickyNote}
          label={t("pos.actionBar.note")}
          onClick={() => {
            setNoteDraft(orderNote);
            setNoteOpen(true);
          }}
          active={Boolean(orderNote)}
        />
        <BarButton
          icon={UserRound}
          label={customerName || t("pos.actionBar.customer")}
          onClick={onOpenCustomer}
          disabled={customerDisabled}
        />
        <BarButton icon={Eraser} label={t("pos.actionBar.clear")} onClick={onClear} />
        <BarButton
          icon={Ban}
          label={t("pos.actionBar.cancel")}
          onClick={onCancel}
          disabled={!canRequestCancel}
          tone="danger"
        />
        <div className="min-w-[220px] flex-[2]">
          <OrderPrimaryAction {...primaryActionProps} />
        </div>
      </div>

      {noteOpen && (
        <PosModal title={t("pos.actionBar.note")} onClose={() => setNoteOpen(false)}>
          {/* Local-only, exactly like the existing basket "kitchen note" it shares state with (see
              POSPage's kitchenNote) — the current sales-order API has no order-note field to
              persist this to, so it is never sent to the backend. This is a known, reported
              limitation, not a bug: the UI is ready for a real field the moment one exists. */}
          <textarea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value.slice(0, 300))}
            rows={4}
            maxLength={300}
            className="w-full resize-none rounded-pos border border-pos-border bg-pos-bg p-2.5 text-sm text-pos-text outline-none focus:border-pos-primary"
            placeholder={t("pos.quick.notePlaceholder")}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setNoteDraft("");
                onOrderNoteChange("");
              }}
              className="pos-control rounded-pos border border-pos-border px-3 text-sm font-bold text-pos-muted transition hover:bg-pos-tint"
            >
              {t("pos.quick.clear")}
            </button>
            <button
              type="button"
              onClick={() => {
                onOrderNoteChange(noteDraft);
                setNoteOpen(false);
              }}
              className="pos-control rounded-pos bg-pos-primary-strong px-4 text-sm font-bold text-white transition hover:bg-pos-primary-strong-hover"
            >
              {t("pos.quick.saveNote")}
            </button>
          </div>
        </PosModal>
      )}
    </div>
  );
}

function BarButton({ icon: Icon, label, onClick, disabled, active, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-active={active ? "true" : undefined}
      className={`pos-quick flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-pos border border-pos-border bg-pos-card px-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger" ? "text-pos-danger-text hover:border-pos-danger/50 hover:bg-pos-danger/10" : "text-pos-text"
      }`}
    >
      <Icon size={18} />
      <span className="pos-fs-label truncate font-bold leading-none">{label}</span>
    </button>
  );
}
