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
        className={`w-full rounded-pos border border-pos-border bg-pos-card px-4 text-right font-bold text-pos-text outline-none focus:border-pos-primary ${inputClassName}`}
        placeholder="0"
      />

      <div dir="ltr" className="grid grid-cols-3 gap-2">
        {DIGIT_ROWS.flat().map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => applyChar(digit)}
            className="pos-fs-numpad h-14 rounded-pos border border-pos-border bg-pos-card text-pos-text transition hover:border-pos-primary hover:bg-pos-tint active:bg-pos-tint"
            aria-label={digit}
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={() => allowDecimal && applyChar(".")}
          disabled={!allowDecimal}
          className="pos-fs-numpad h-14 rounded-pos border border-pos-border bg-pos-card text-pos-text transition hover:border-pos-primary hover:bg-pos-tint active:bg-pos-tint disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Decimal point"
        >
          .
        </button>
        <button
          type="button"
          onClick={() => applyChar("0")}
          className="pos-fs-numpad h-14 rounded-pos border border-pos-border bg-pos-card text-pos-text transition hover:border-pos-primary hover:bg-pos-tint active:bg-pos-tint"
          aria-label="0"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          className="grid h-14 place-items-center rounded-pos border border-pos-border bg-pos-card text-pos-text transition hover:border-pos-danger hover:bg-pos-danger/10 active:bg-pos-danger/10"
          aria-label="Backspace"
        >
          <Delete size={20} />
        </button>
      </div>

      {unitLabel && <div className="pos-fs-label text-center text-pos-muted">{unitLabel}</div>}
    </div>
  );
}
