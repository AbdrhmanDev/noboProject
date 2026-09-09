import { Delete } from "lucide-react";

const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

/**
 * Pure presentational digit grid + real text input — no modal chrome, no
 * Confirm/Cancel footer. `NumericKeypadModal` and `NumericKeypadInline` both
 * wrap this in whatever container their context needs; the input/button
 * wiring (and therefore the character rules) exists exactly once here.
 */
export function NumericKeypadCore({
  value,
  inputRef,
  onInputChange,
  onEnter,
  applyChar,
  backspace,
  allowDecimal,
  ariaLabel,
  unitLabel,
  inputClassName = "h-14 text-2xl",
}) {
  return (
    <div className="space-y-3" role="group" aria-label={ariaLabel}>
      <input
        ref={inputRef}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        dir="ltr"
        value={value}
        aria-label={ariaLabel}
        onChange={onInputChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onEnter?.();
          }
        }}
        className={`w-full rounded-xl border border-white/10 bg-black/25 px-4 text-right font-black text-white outline-none focus:border-blue-400/60 ${inputClassName}`}
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

      {unitLabel && <div className="text-center text-xs text-slate-500">{unitLabel}</div>}
    </div>
  );
}
