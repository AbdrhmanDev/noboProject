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
}) {
  const { value, isEmpty, applyChar, backspace, clear, onInputChange, inputRef } =
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

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={clear}
          className="pos-control pos-fs-name border border-pos-border bg-pos-card text-pos-text transition hover:bg-pos-tint"
        >
          مسح
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="pos-control pos-fs-name flex items-center justify-center gap-1.5 border border-pos-border bg-pos-card text-pos-text transition hover:bg-pos-tint"
        >
          <X size={15} />
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={isEmpty}
          className="pos-control pos-fs-name flex items-center justify-center gap-1.5 bg-pos-action text-white transition hover:bg-pos-action-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={15} />
          {confirmLabel}
        </button>
      </div>
    </PosModal>
  );
}
