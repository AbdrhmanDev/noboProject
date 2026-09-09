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
          className="h-12 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-300 transition hover:bg-white/10"
        >
          مسح
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-300 transition hover:bg-white/10"
        >
          <X size={15} />
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={isEmpty}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={15} />
          {confirmLabel}
        </button>
      </div>
    </PosModal>
  );
}
