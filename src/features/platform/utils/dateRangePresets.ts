import { addDays, startOfDay, subDays } from "date-fns";

// Deliberately only 7/30/custom (Platform Customer Control Center, Phase 5) -- unlike Sales
// Overview's today/yesterday/last7/last30, the Platform Overview/Customers/Details screens only
// ever need "recent activity window" granularity, matching the backend's own default-30-days
// resolution (PlatformActivityDateRangeResolver).
export type PlatformDateRangePresetId = "last7" | "last30" | "custom";

export type PlatformDateRangeValue = {
  fromUtc?: string;
  toUtc?: string;
};

function toIsoUtc(date: Date) {
  return date.toISOString();
}

// Half-open [fromUtc, toUtc) boundaries computed from the browser's local calendar day, expressed
// as UTC instants -- matches the backend's own half-open range semantics exactly.
export function presetDateRange(
  preset: PlatformDateRangePresetId,
  now: Date = new Date(),
): PlatformDateRangeValue {
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  switch (preset) {
    case "last7":
      return { fromUtc: toIsoUtc(subDays(todayStart, 6)), toUtc: toIsoUtc(tomorrowStart) };
    case "last30":
      return { fromUtc: toIsoUtc(subDays(todayStart, 29)), toUtc: toIsoUtc(tomorrowStart) };
    default:
      return {};
  }
}

// For a custom pair of "YYYY-MM-DD" <input type="date"> values. The end bound is the day *after*
// the selected end date (exclusive), never 23:59:59.999 on the selected date.
export function customDateRange(fromDateInput?: string, toDateInput?: string): PlatformDateRangeValue {
  const fromUtc = fromDateInput
    ? toIsoUtc(startOfDay(new Date(`${fromDateInput}T00:00:00`)))
    : undefined;
  const toUtc = toDateInput
    ? toIsoUtc(addDays(startOfDay(new Date(`${toDateInput}T00:00:00`)), 1))
    : undefined;

  return { fromUtc, toUtc };
}
