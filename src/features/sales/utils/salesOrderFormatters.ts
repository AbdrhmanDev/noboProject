// Display-only. Full API operations must always use the complete
// salesOrderId — nothing here is ever used as a lookup key. Kept only for
// subtle/debug reference display — orderNumberDisplay is the primary
// human-facing identifier now.
export function shortOrderReference(salesOrderId?: string | null) {
  if (!salesOrderId) return "";
  return `…${salesOrderId.slice(-6)}`;
}

// Primary human-facing identifier: prefers the backend-formatted
// "ORD-100096" and only falls back to formatting the raw numeric
// orderNumber if the formatted field is genuinely missing.
export function orderNumberDisplay(
  orderNumber?: number | null,
  orderNumberFormatted?: string | null,
) {
  if (orderNumberFormatted) return orderNumberFormatted;
  if (orderNumber !== undefined && orderNumber !== null) return `ORD-${orderNumber}`;
  return "";
}

// SalesOrderListItem has no single updatedAtUtc — status transitions land in
// separate confirmedAtUtc/cancelledAtUtc/closedAtUtc fields. This picks the
// most recent one that actually happened, falling back to createdAtUtc for
// orders still in Draft.
export function latestOrderTimestamp(order: {
  createdAtUtc: string;
  confirmedAtUtc?: string | null;
  cancelledAtUtc?: string | null;
  closedAtUtc?: string | null;
}) {
  const candidates = [order.confirmedAtUtc, order.cancelledAtUtc, order.closedAtUtc, order.createdAtUtc]
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return candidates[0] || order.createdAtUtc;
}

export const STATUS_TONE: Record<string, "info" | "success" | "danger" | "neutral"> = {
  Draft: "info",
  Confirmed: "success",
  Closed: "neutral",
  Cancelled: "danger",
};

export function statusTone(status?: string) {
  return STATUS_TONE[status || ""] || "neutral";
}

const FULFILLMENT_LABEL_KEYS: Record<string, string> = {
  DineIn: "salesOrders.fulfillment.dineIn",
  Takeaway: "salesOrders.fulfillment.takeaway",
  Delivery: "salesOrders.fulfillment.delivery",
};

export function fulfillmentLabelKey(fulfillmentType?: string | null) {
  return fulfillmentType ? FULFILLMENT_LABEL_KEYS[fulfillmentType] || null : null;
}

export type PaymentStatus = "paid" | "partiallyPaid" | "unpaid";

// Only ever called with authoritative fields actually present on the order —
// never inferred from SalesOrder status (Confirmed/Closed do not imply
// paid/unpaid on their own).
export function derivePaymentStatus(
  isFullyPaid?: boolean,
  netPaidAmount?: number,
): PaymentStatus | null {
  if (isFullyPaid === undefined || netPaidAmount === undefined) return null;
  if (isFullyPaid) return "paid";
  if (netPaidAmount > 0) return "partiallyPaid";
  return "unpaid";
}

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, "success" | "warning" | "neutral"> = {
  paid: "success",
  partiallyPaid: "warning",
  unpaid: "neutral",
};
