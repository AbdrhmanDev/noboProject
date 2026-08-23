import type { ApiError } from "../../../shared/api/apiError";
import type { PurchaseOrderStatus, SupplierStatus } from "../types/procurement.types";

export function purchaseOrderNumberDisplay(
  purchaseOrderNumber?: number | null,
  purchaseOrderNumberFormatted?: string | null,
) {
  if (purchaseOrderNumberFormatted) return purchaseOrderNumberFormatted;
  if (purchaseOrderNumber !== undefined && purchaseOrderNumber !== null) {
    return `PO-${purchaseOrderNumber}`;
  }
  return "";
}

export function grnNumberDisplay(grnNumber?: number | null, grnNumberFormatted?: string | null) {
  if (grnNumberFormatted) return grnNumberFormatted;
  if (grnNumber !== undefined && grnNumber !== null) return `GRN-${grnNumber}`;
  return "";
}

// This backend's Procurement DTOs (confirmed against a real captured
// response) expose no currency field anywhere — unlike Sales/POS, where
// currencyCode travels on every order. Rather than append the JavaScript
// value `undefined` (the literal bug this fixes) or fabricate a currency
// that was never part of the contract, Procurement renders a plain
// formatted number. If the backend contract adds a currency field later,
// this is the one place to start passing it through.
export function formatPurchaseAmount(amount: number) {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const PURCHASE_ORDER_STATUS_LABEL_KEYS: Record<PurchaseOrderStatus, string> = {
  Draft: "procurement.po.status.draft",
  Submitted: "procurement.po.status.submitted",
  PartiallyReceived: "procurement.po.status.partiallyReceived",
  Received: "procurement.po.status.received",
  Closed: "procurement.po.status.closed",
  Cancelled: "procurement.po.status.cancelled",
};

// Restrained, semantic palette per the spec — kept as its own map (not the
// shared 5-tone StatusBadge) since PurchaseOrder has 6 distinct statuses
// that need visually distinct colors (Draft/neutral vs. Closed/muted purple
// both being "neutral" would collapse two meaningfully different states).
export const PURCHASE_ORDER_STATUS_BADGE_CLASSES: Record<PurchaseOrderStatus, string> = {
  Draft: "bg-white/10 text-slate-300",
  Submitted: "bg-blue-500/15 text-blue-300",
  PartiallyReceived: "bg-amber-500/15 text-amber-300",
  Received: "bg-emerald-500/15 text-emerald-300",
  Closed: "bg-violet-500/12 text-violet-300",
  Cancelled: "bg-rose-500/15 text-rose-300",
};

export const SUPPLIER_STATUS_LABEL_KEYS: Record<SupplierStatus, string> = {
  Active: "procurement.supplier.status.active",
  Suspended: "procurement.supplier.status.suspended",
};

export const SUPPLIER_STATUS_BADGE_CLASSES: Record<SupplierStatus, string> = {
  Active: "bg-emerald-500/15 text-emerald-300",
  Suspended: "bg-rose-500/15 text-rose-300",
};

// Known business errors this backend can return for Procurement actions —
// mapped to localized, friendly messages. Anything unmapped falls back to
// the generic error message; raw codes are never shown to the user.
export const PROCUREMENT_ERROR_MESSAGE_KEYS: Record<string, string> = {
  "Supplier.Suspended": "procurement.error.supplierSuspended",
  "PurchaseOrder.NotEditable": "procurement.error.poNotEditable",
  "PurchaseOrder.NotReceivable": "procurement.error.poNotReceivable",
  "PurchaseOrder.NotCancellable": "procurement.error.poNotCancellable",
  "PurchaseGoodsReceipt.ExceedsOrderedQuantity": "procurement.error.receiptExceedsRemaining",
  "Procurement.IdempotencyKeyConflict": "procurement.error.idempotencyKeyConflict",
};

export function getProcurementErrorMessageKey(error: ApiError | null | undefined) {
  if (!error?.code) return null;
  return PROCUREMENT_ERROR_MESSAGE_KEYS[error.code] || null;
}
