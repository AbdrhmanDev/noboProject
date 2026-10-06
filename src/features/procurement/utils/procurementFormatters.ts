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

// PurchaseOrder now snapshots Company.DefaultCurrency at Draft creation and
// returns currencyCode/currencyMinorUnitDigits on both the list item and
// details — use the shared formatMoney() (see shared/utils/formatters.ts)
// wherever that data is available. This numeric-only fallback exists solely
// for the PO editor's pre-save preview in the narrow window before a Draft
// exists server-side AND the Company default currency hasn't resolved yet
// (see PurchaseOrderEditorPage) — never use it once a real currencyCode is
// on hand.
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

// Semantic, theme-aware palette (app tokens, so it follows light/dark and the Odoo look) — kept
// as its own map (not the shared 5-tone StatusBadge) since PurchaseOrder has 6 distinct statuses
// that need to stay visually distinct: Draft is a plain neutral pill, Closed an outlined muted one.
export const PURCHASE_ORDER_STATUS_BADGE_CLASSES: Record<PurchaseOrderStatus, string> = {
  Draft: "bg-inset text-muted",
  Submitted: "bg-accent-soft text-accent",
  PartiallyReceived: "bg-warning-soft text-warning",
  Received: "bg-success-soft text-success",
  Closed: "bg-raised text-subtle ring-1 ring-line",
  Cancelled: "bg-danger-soft text-danger",
};

export const SUPPLIER_STATUS_LABEL_KEYS: Record<SupplierStatus, string> = {
  Active: "procurement.supplier.status.active",
  Suspended: "procurement.supplier.status.suspended",
};

export const SUPPLIER_STATUS_BADGE_CLASSES: Record<SupplierStatus, string> = {
  Active: "bg-success-soft text-success",
  Suspended: "bg-danger-soft text-danger",
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
