import { useRef, useState } from "react";

// Applies the same character rules whether a digit came from a touch tap or
// from real keyboard typing in the input — one source of truth for both, so
// touch and keyboard entry can never disagree.
export function sanitizeKeypadValue(rawValue, { allowDecimal, maxDecimalPlaces }) {
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
 * Shared numeric-entry buffer/state, used by both `NumericKeypadModal`
 * (quantity, refund, etc.) and `NumericKeypadInline` (payment) so the
 * character-shaping logic exists exactly once.
 *
 * No business logic lives here: only the raw string buffer and
 * character-level shaping (digits, at most one decimal point, an optional
 * decimal-place cap). The caller owns parsing (`Number(value)`), validation,
 * and what the value actually means.
 */
export function useNumericKeypadState({ initialValue = "", allowDecimal = true, maxDecimalPlaces = 2 }) {
  const [value, setValue] = useState(() =>
    sanitizeKeypadValue(initialValue, { allowDecimal, maxDecimalPlaces }),
  );
  const inputRef = useRef(null);

  const isEmpty = value === "" || value === ".";

  const applyChar = (char) => {
    setValue((current) => sanitizeKeypadValue(current + char, { allowDecimal, maxDecimalPlaces }));
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

  const onInputChange = (event) => {
    setValue(sanitizeKeypadValue(event.target.value, { allowDecimal, maxDecimalPlaces }));
  };

  return { value, setValue, isEmpty, applyChar, backspace, clear, onInputChange, inputRef };
}
