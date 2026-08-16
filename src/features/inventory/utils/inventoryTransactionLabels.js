export const INVENTORY_TRANSACTION_TYPES = ["ManualAdjustment", "SalesConsumption", "SalesReversal"];

export function getTransactionTypeLabel(type) {
  if (type === "ManualAdjustment") return "Manual Adjustment";
  if (type === "SalesConsumption") return "Sales Consumption";
  if (type === "SalesReversal") return "Sales Reversal";
  return type;
}

export function getTransactionTypeTone(type) {
  if (type === "ManualAdjustment") return "text-blue-300";
  if (type === "SalesConsumption") return "text-amber-300";
  if (type === "SalesReversal") return "text-emerald-300";
  return "text-slate-300";
}

export function shortId(value) {
  return value ? value.slice(0, 8) : "-";
}
