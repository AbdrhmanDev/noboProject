import { useEffect, useRef } from "react";
import type { BarcodeScan } from "../types/barcodeScan.types";

// A USB/keyboard-wedge barcode scanner presents itself to Windows (and the browser) as an
// ordinary keyboard. There is no API that says "this keydown came from a scanner" -- the only
// available signal is that a scanner types its whole payload in a rapid, uniform burst and then
// sends a terminator key (Enter, sometimes Tab), whereas a human never sustains inter-keystroke
// gaps that small across a run of several characters. These defaults are deliberately
// conservative (see Section B of the barcode-scanner task): a human would have to type faster
// than ~20 characters/second, sustained, to be misread as a scan.
const DEFAULT_MIN_LENGTH = 4;
const DEFAULT_MAX_INTER_KEY_DELAY_MS = 40;
const DEFAULT_SUFFIX_KEYS = ["Enter", "Tab"];

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return EDITABLE_TAGS.has(target.tagName);
}

export type UseKeyboardWedgeScannerOptions = {
  // Master switch. Callers should turn this off while a dialog/modal is open or while the
  // screen the scanner should feed isn't the active one -- this hook has no notion of "modal"
  // or "page" of its own, by design, so it stays reusable outside POS.
  enabled?: boolean;
  minLength?: number;
  maxInterKeyDelayMs?: number;
  suffixKeys?: string[];
  onScan: (scan: BarcodeScan) => void;
};

// Attaches a single document-level, capture-phase keydown listener that recognizes
// keyboard-wedge scanner bursts without requiring a dedicated focused input. Normal typing --
// including inside text fields, which this hook ignores outright -- is left completely
// untouched: isEditableTarget(event.target) always short-circuits before any buffering happens.
export function useKeyboardWedgeScanner(options: UseKeyboardWedgeScannerOptions): void {
  const {
    enabled = true,
    minLength = DEFAULT_MIN_LENGTH,
    maxInterKeyDelayMs = DEFAULT_MAX_INTER_KEY_DELAY_MS,
    suffixKeys = DEFAULT_SUFFIX_KEYS,
    onScan,
  } = options;

  const optionsRef = useRef({ minLength, maxInterKeyDelayMs, suffixKeys, onScan });
  optionsRef.current = { minLength, maxInterKeyDelayMs, suffixKeys, onScan };

  const bufferRef = useRef<{ chars: string[]; lastTimestamp: number }>({
    chars: [],
    lastTimestamp: 0,
  });

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = { chars: [], lastTimestamp: 0 };
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Never touch normal typing: real form fields, search boxes, quantity entry, and dialog
      // contents all fall through untouched here, exactly as if this hook didn't exist.
      if (isEditableTarget(event.target)) {
        bufferRef.current = { chars: [], lastTimestamp: 0 };
        return;
      }

      const { minLength: min, maxInterKeyDelayMs: maxDelay, suffixKeys: suffixes, onScan: emit } =
        optionsRef.current;
      const now = performance.now();
      const buffer = bufferRef.current;

      if (suffixes.includes(event.key)) {
        const gap = now - buffer.lastTimestamp;
        const qualifies = buffer.chars.length >= min && gap <= maxDelay;

        if (qualifies) {
          // This is the one moment a real scan intercepts the keystroke: swallow the terminator
          // so it can't also activate whatever happens to be focused (a grid card, a button).
          event.preventDefault();
          event.stopPropagation();

          const value = buffer.chars.join("");
          bufferRef.current = { chars: [], lastTimestamp: 0 };
          emit({
            value,
            symbology: "Unknown",
            source: "KeyboardWedge",
            deviceId: null,
            scannedAtUtc: new Date().toISOString(),
          });
        } else {
          // Too short or too slow to be a scan -- leave the terminator alone so normal
          // accessibility behavior (Enter/Tab on a focused control) proceeds as usual.
          bufferRef.current = { chars: [], lastTimestamp: 0 };
        }
        return;
      }

      // Only accumulate single printable characters. Anything else (Shift, Control, arrow
      // keys, F-keys, ...) is ignored without resetting the buffer, since a scanner never emits
      // those but a human's incidental modifier presses shouldn't break an in-progress burst.
      if (event.key.length !== 1) {
        return;
      }

      const gap = buffer.chars.length === 0 ? 0 : now - buffer.lastTimestamp;
      if (buffer.chars.length > 0 && gap > maxDelay) {
        // Gap too large to be a continuation of a burst -- start over from this character.
        bufferRef.current = { chars: [event.key], lastTimestamp: now };
      } else {
        buffer.chars.push(event.key);
        buffer.lastTimestamp = now;
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [enabled]);
}
