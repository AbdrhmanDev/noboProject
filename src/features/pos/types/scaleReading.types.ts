// Variable-Weight Products Phase F.2: normalized scale-reading contract, mirroring the backend
// Edge Agent's own Nobo.EdgeAgent.Scales.ScaleReading (see that file's doc comments for the full
// rationale -- this type exists so the POS never depends on one specific device/vendor/transport).
// No real adapter produces this yet (Phase F.1 audit: no keyboard-emulation parser, no Serial/COM
// reader, no Edge Agent bridge) -- today the only producer is the development-only simulator.

export type ScaleReadingStatus = "Stable" | "Unstable" | "Stale" | "Malformed" | "Disconnected";

// "KeyboardEmulation" | "SerialCom" are the two real transports Phase F.2 prepares for;
// "Simulated" is the development-only source. A plain string, not a closed union of only those
// three, so a future real source name never requires widening this type.
export type ScaleReadingSourceType = "KeyboardEmulation" | "SerialCom" | "Simulated" | string;

export type ScaleReading = {
  sourceId: string;
  sourceType: ScaleReadingSourceType;
  status: ScaleReadingStatus;
  // Null whenever status is "Disconnected" or "Malformed" -- there is no number to report.
  value: number | null;
  // The device's own reported unit code (e.g. "KG" | "G"), matching the catalog's existing
  // UnitOfMeasure.code convention. Never assumed, never defaulted to kilograms.
  unit: string | null;
  readAtUtc: string;
  notes?: string | null;
};

// The only condition under which value/unit may be used for a sale: a settled reading with both
// present and a physically sensible value. Mirrors ScaleReading.IsUsable on the backend exactly.
export function isUsableScaleReading(reading: ScaleReading | null | undefined): boolean {
  if (!reading) return false;
  return (
    reading.status === "Stable" &&
    typeof reading.value === "number" &&
    Number.isFinite(reading.value) &&
    reading.value > 0 &&
    Boolean(reading.unit)
  );
}

// Freshness is a function of "how long ago", which only the caller can judge -- kept separate
// from isUsableScaleReading so a reading can be usable-by-status yet still rejected as too old.
export function isFreshScaleReading(
  reading: ScaleReading | null | undefined,
  maxAgeMs: number,
  nowMs: number = Date.now(),
): boolean {
  if (!reading) return false;
  const readAtMs = Date.parse(reading.readAtUtc);
  if (!Number.isFinite(readAtMs)) return false;
  return nowMs - readAtMs <= maxAgeMs;
}

// The ONLY unit conversion this phase knows how to perform -- KG<->G, the two units Variable-
// Weight Products actually ships with (Phase B). Anything else (a reading unit that isn't KG/G,
// or a variant sales unit that isn't KG/G) is explicitly NOT converted; the caller must reject it
// rather than guess. This is deliberately a short-circuit table, not a generic unit-conversion
// system -- "never silently interpret grams as kilograms" applies just as much to inventing a
// conversion for units nobody has confirmed are safe to convert between.
const EXPLICIT_MASS_CONVERSIONS: Record<string, number> = {
  "G->KG": 0.001,
  "KG->G": 1000,
};

// Converts `reading.value` from the reading's own unit to `targetUnit`. Returns null when no
// explicit conversion is known (including when either unit is missing) -- the caller must treat
// null as "cannot be used", never fall back to treating the raw number as already-correct.
export function convertScaleReadingValue(
  reading: ScaleReading,
  targetUnit: string,
): number | null {
  if (reading.value === null || !reading.unit) return null;

  const fromUnit = reading.unit.trim().toUpperCase();
  const toUnit = targetUnit.trim().toUpperCase();

  if (fromUnit === toUnit) return reading.value;

  const factor = EXPLICIT_MASS_CONVERSIONS[`${fromUnit}->${toUnit}`];
  return factor === undefined ? null : reading.value * factor;
}
