import { useRef } from "react";
import { NumericKeypadCore } from "./NumericKeypadCore";
import { sanitizeKeypadValue } from "./useNumericKeypadState";

/**
 * Inline (non-modal) numeric entry — used by the Payment step, permanently
 * visible whenever Cash requires amount entry. Fully controlled (`value`/
 * `onChange`) rather than owning its own buffer, because the payment amount
 * is also written by other controls on the same screen (quick-tender
 * buttons, "Exact Amount") that must stay in sync with whatever the cashier
 * types here — touch and keyboard both flow through the same `onChange`.
 */
export function NumericKeypadInline({
  value,
  onChange,
  allowDecimal = true,
  maxDecimalPlaces = 2,
  ariaLabel,
  unitLabel,
  onEnter,
}) {
  const inputRef = useRef(null);
  const opts = { allowDecimal, maxDecimalPlaces };

  const applyChar = (char) => {
    onChange(sanitizeKeypadValue((value ?? "") + char, opts));
    inputRef.current?.focus();
  };

  const backspace = () => {
    onChange((value ?? "").slice(0, -1));
    inputRef.current?.focus();
  };

  const onInputChange = (event) => {
    onChange(sanitizeKeypadValue(event.target.value, opts));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1728] p-3">
      <NumericKeypadCore
        value={value ?? ""}
        inputRef={inputRef}
        onInputChange={onInputChange}
        onEnter={onEnter}
        applyChar={applyChar}
        backspace={backspace}
        allowDecimal={allowDecimal}
        ariaLabel={ariaLabel}
        unitLabel={unitLabel}
        inputClassName="h-16 text-3xl"
      />
    </div>
  );
}
