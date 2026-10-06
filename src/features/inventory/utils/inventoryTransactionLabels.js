export const INVENTORY_TRANSACTION_TYPES = ["ManualAdjustment", "SalesConsumption", "SalesReversal"];

export function getTransactionTypeLabel(type) {
  if (type === "ManualAdjustment") return "Manual Adjustment";
  if (type === "SalesConsumption") return "Sales Consumption";
  if (type === "SalesReversal") return "Sales Reversal";
  return type;
}

export function getTransactionTypeTone(type) {
  if (type === "ManualAdjustment") return "text-accent";
  if (type === "SalesConsumption") return "text-warning";
  if (type === "SalesReversal") return "text-success";
  return "text-muted";
}

export function shortId(value) {
  return value ? value.slice(0, 8) : "-";
}
