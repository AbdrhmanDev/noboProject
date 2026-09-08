import { useMemo, useRef, useState } from "react";
import { Check, Delete, X } from "lucide-react";
import { PosModal } from "./PosModal";

const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

// Applies the same character rules whether a digit came from a touch tap or
// from real keyboard typing in the input — one source of truth for both, per
// caller of this component owning no state beyond the final confirmed value.
function sanitize(rawValue, { allowDecimal, maxDecimalPlaces }) {
  let value = rawValue.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, "");

  if (allowDecimal) {
    const firstDot = value.indexOf(".");
    if (firstDot !== -1) {
      value =
        value.slice(0, firstDot + 1) +
        value.slice(firstDot + 1).replace(/\./g, "");
      const [whole, fraction = ""] = value.split(".");
      value = fraction.length > maxDecimalPlaces
        ? `${whole}.${fraction.slice(0, maxDecimalPlaces)}`
        : value;
    }
  }

  return value;
}

/**
 * Reusable on-screen numeric entry dialog — touch-friendly digit grid plus a
 * real text input so physical keyboard typing keeps working normally.
 *
 * No business logic lives here: it only manages the raw string buffer and
 * character-level shaping (digits, at most one decimal point, an optional
 * decimal-place cap). The caller owns parsing (`Number(value)`), validation
 * (min/max, required, etc.) and what the value actually means — this mirrors
 * how the existing Discount/Payment/Cash-movement inputs already parse their
 * own text values (see `features/pos/utils/posFormatters.js`).
 */
export function NumericKeypad({
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
  const [value, setValue] = useState(() => sanitize(initialValue, { allowDecimal, maxDecimalPlaces }));
  const inputRef = useRef(null);

  const isEmpty = value === "" || value === ".";

  const applyChar = (char) => {
    setValue((current) => sanitize(current + char, { allowDecimal, maxDecimalPlaces }));
    inputRef.current?.focus();
  };

  const backspace = () => {
    setValue((current) => current.slice(0, -1));
    inputRef.current?.focus();
  };

  const clear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  const confirm = () => {
    if (isEmpty) return;
    onConfirm?.(value);
  };

  const keyLabel = useMemo(
    () => (allowDecimal ? "لوحة أرقام، يدعم الكسور العشرية" : "لوحة أرقام"),
    [allowDecimal],
  );

  return (
    <PosModal title={title} onClose={onCancel}>
      <div className="space-y-3" role="group" aria-label={keyLabel}>
        <input
          ref={inputRef}
          type="text"
          inputMode={allowDecimal ? "decimal" : "numeric"}
          dir="ltr"
          value={value}
          aria-label={title}
          onChange={(event) =>
            setValue(sanitize(event.target.value, { allowDecimal, maxDecimalPlaces }))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              confirm();
            }
          }}
          className="h-14 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-right text-2xl font-black text-white outline-none focus:border-blue-400/60"
          placeholder="0"
        />

        <div dir="ltr" className="grid grid-cols-3 gap-2">
          {DIGIT_ROWS.flat().map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => applyChar(digit)}
              className="h-14 rounded-xl border border-white/10 bg-white/[0.04] text-xl font-bold text-white transition hover:border-blue-400/45 hover:bg-blue-500/10 active:bg-blue-500/20"
              aria-label={digit}
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={() => allowDecimal && applyChar(".")}
            disabled={!allowDecimal}
            className="h-14 rounded-xl border border-white/10 bg-white/[0.04] text-xl font-bold text-white transition hover:border-blue-400/45 hover:bg-blue-500/10 active:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Decimal point"
          >
            .
          </button>
          <button
            type="button"
            onClick={() => applyChar("0")}
            className="h-14 rounded-xl border border-white/10 bg-white/[0.04] text-xl font-bold text-white transition hover:border-blue-400/45 hover:bg-blue-500/10 active:bg-blue-500/20"
            aria-label="0"
          >
            0
          </button>
          <button
            type="button"
            onClick={backspace}
            className="grid h-14 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-rose-400/45 hover:bg-rose-500/10 active:bg-rose-500/20"
            aria-label="Backspace"
          >
            <Delete size={20} />
          </button>
        </div>

        {unitLabel && (
          <div className="text-center text-xs text-slate-500">{unitLabel}</div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
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
      </div>
    </PosModal>
  );
}
