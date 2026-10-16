import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { PosModal } from "../PosModal";
import { NumericKeypadCore } from "./NumericKeypadCore";
import { useNumericKeypadState } from "./useNumericKeypadState";

/**
 * Modal-hosted numeric entry — quantity, refund amount, opening float,
 * counted cash, etc. Same external API as the previous single-file
 * `NumericKeypad` component (only the import path changes for callers).
 */
export function NumericKeypadModal({
  title,
  initialValue = "",
  allowDecimal = true,
  maxDecimalPlaces = 2,
  unitLabel,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  onConfirm,
  onCancel,
  // Optional extra content rendered between the keypad and its clear/cancel/confirm row -- a
  // render-prop called with `setSanitizedValue` so the caller can push a value into the keypad's
  // own buffer through the exact same character-shaping rules typing/tapping already use (e.g.
  // the development-only scale-reading simulator panel, Variable-Weight Products Phase F.2,
  // copying a reading in after the cashier explicitly chooses to use it -- never automatically).
  // Every existing caller omits this and is completely unaffected.
  children,
}) {
  const { value, setSanitizedValue, isEmpty, applyChar, backspace, clear, onInputChange, inputRef } =
    useNumericKeypadState({ initialValue, allowDecimal, maxDecimalPlaces });

  const confirm = () => {
    if (isEmpty) return;
    onConfirm?.(value);
  };

  const ariaLabel = useMemo(
    () => title ?? (allowDecimal ? "لوحة أرقام، يدعم الكسور العشرية" : "لوحة أرقام"),
    [title, allowDecimal],
  );

  return (
    <PosModal title={title} onClose={onCancel}>
      <NumericKeypadCore
        value={value}
        inputRef={inputRef}
        onInputChange={onInputChange}
        onEnter={confirm}
        applyChar={applyChar}
        backspace={backspace}
        allowDecimal={allowDecimal}
        ariaLabel={ariaLabel}
        unitLabel={unitLabel}
      />

      {typeof children === "function" ? children({ setValue: setSanitizedValue }) : children}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={clear}
          className="pos-control pos-fs-name border border-pos-border bg-pos-card text-pos-text transition"
        >
          مسح
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="pos-control pos-fs-name flex items-center justify-center gap-1.5 border border-pos-border bg-pos-card text-pos-text transition"
        >
          <X size={15} />
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={isEmpty}
          className="pos-control pos-fs-name flex items-center justify-center gap-1.5 bg-pos-action text-pos-on-action transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={15} />
          {confirmLabel}
        </button>
      </div>
    </PosModal>
  );
}
