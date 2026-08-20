import { format } from "date-fns";

// <input type="datetime-local"> works in local wall-clock time with no
// timezone suffix — new Date(value) already parses that as local time, so
// .toISOString() is a correct, direct local -> UTC conversion with no
// day-boundary hacks involved (these are exact instants, not date ranges).
export function toDateTimeLocalValue(isoUtc: string) {
  return format(new Date(isoUtc), "yyyy-MM-dd'T'HH:mm");
}

export function fromDateTimeLocalValue(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
