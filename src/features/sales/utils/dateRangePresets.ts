import { addDays, startOfDay, subDays } from "date-fns";

export type DateRangePresetId = "today" | "yesterday" | "last7" | "last30" | "custom";

export type DateRangeValue = {
  fromUtc?: string;
  toUtc?: string;
};

function toIsoUtc(date: Date) {
  return date.toISOString();
}

// Half-open [fromUtc, toUtc) boundaries, computed from the browser's local
// calendar day and expressed as UTC instants. Deliberately never uses an
// inclusive end-of-day (23:59:59.999) — "tomorrow's start" is the exclusive
// upper bound instead, matching the backend's own range semantics.
export function presetDateRange(preset: DateRangePresetId, now: Date = new Date()): DateRangeValue {
  const todayStart = startOfDay(now);

  switch (preset) {
    case "today":
      return { fromUtc: toIsoUtc(todayStart), toUtc: toIsoUtc(addDays(todayStart, 1)) };
    case "yesterday":
      return { fromUtc: toIsoUtc(subDays(todayStart, 1)), toUtc: toIsoUtc(todayStart) };
    case "last7":
      return { fromUtc: toIsoUtc(subDays(todayStart, 6)), toUtc: toIsoUtc(addDays(todayStart, 1)) };
    case "last30":
      return { fromUtc: toIsoUtc(subDays(todayStart, 29)), toUtc: toIsoUtc(addDays(todayStart, 1)) };
    default:
      return {};
  }
}

// For a custom pair of "YYYY-MM-DD" <input type="date"> values. The end
// bound is the day *after* the selected end date (exclusive), never
// 23:59:59.999 on the selected date.
export function customDateRange(fromDateInput?: string, toDateInput?: string): DateRangeValue {
  const fromUtc = fromDateInput
    ? toIsoUtc(startOfDay(new Date(`${fromDateInput}T00:00:00`)))
    : undefined;
  const toUtc = toDateInput
    ? toIsoUtc(addDays(startOfDay(new Date(`${toDateInput}T00:00:00`)), 1))
    : undefined;

  return { fromUtc, toUtc };
}
