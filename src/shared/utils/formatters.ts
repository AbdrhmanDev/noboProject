import { format } from "date-fns";

export function formatMoney(
  amount: number,
  currencyCode: string,
  minorUnitDigits = 2,
) {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: minorUnitDigits,
    maximumFractionDigits: minorUnitDigits,
  })} ${currencyCode}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "PP p");
}
