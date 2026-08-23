// ---- Contract note ----
// This backend's OpenAPI document (confirmed via /openapi/v1.json) fully
// describes every request body and query parameter below, but — consistent
// with every other controller observed in this codebase — it does NOT
// describe response bodies. Request-side fields are exact and reliable.
//
// The GET purchase-order-details response shape below (PurchaseOrderDetails
// + PurchaseOrderDetailsResponse) is taken verbatim from a real captured
// authenticated response, not modeled/guessed:
//   { order: { ...no currency fields, no baseUnitOfMeasure on lines,
//               lines carry a server-computed remainingQuantity... },
//     receipts: [] }
// Notably: this Procurement DTO family exposes NO currency field anywhere
// (list or details) and NO per-line unit-of-measure object — unlike Sales,
// which carries currencyCode directly on every order. Money is rendered as
// a plain formatted number with no currency suffix (see
// procurementFormatters.ts's formatPurchaseAmount) until/unless the backend
// contract adds one; nothing here fabricates a currency value.
// Everything else (Suppliers, list items, request bodies) is modeled from
// symmetric naming with the confirmed request DTOs and this backend's
// established "Formatted number" convention (OrderNumberFormatted etc.).

export type SupplierStatus = "Active" | "Suspended";

export type Supplier = {
  supplierId: string;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  address: string | null;
  note: string | null;
  status: SupplierStatus;
  createdAtUtc: string;
};

export type SuppliersListFilters = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: SupplierStatus | "";
};

export type SuppliersListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: Supplier[];
};

export type CreateSupplierRequest = {
  code: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  taxNumber?: string | null;
  address?: string | null;
  note?: string | null;
};

export type UpdateSupplierRequest = CreateSupplierRequest;

export type ChangeSupplierStatusResponse = Supplier;

// ---- Purchase Orders ----

export type PurchaseOrderStatus =
  | "Draft"
  | "Submitted"
  | "PartiallyReceived"
  | "Received"
  | "Closed"
  | "Cancelled";

export type PurchaseOrderListItem = {
  purchaseOrderId: string;
  purchaseOrderNumber: number;
  purchaseOrderNumberFormatted: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  lineCount: number;
  totalOrderedQuantity: number;
  totalReceivedQuantity: number;
  expectedDeliveryDateUtc: string | null;
  createdAtUtc: string;
  submittedAtUtc: string | null;
};

export type PurchaseOrdersListFilters = {
  pageNumber?: number;
  pageSize?: number;
  status?: PurchaseOrderStatus | "";
  supplierId?: string;
  purchaseOrderNumber?: string;
  createdFromUtc?: string;
  createdToUtc?: string;
};

export type PurchaseOrdersListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: PurchaseOrderListItem[];
};

export type CreatePurchaseOrderLineRequest = {
  inventoryItemId: string;
  orderedQuantity: number;
  unitCost: number;
};

export type CreatePurchaseOrderRequest = {
  supplierId: string;
  expectedDeliveryDateUtc?: string | null;
  note?: string | null;
  lines: CreatePurchaseOrderLineRequest[];
};

export type UpdatePurchaseOrderRequest = CreatePurchaseOrderRequest;

// Confirmed verbatim from a real response — no baseUnitOfMeasure object,
// and remainingQuantity is server-computed (used directly, never
// recomputed client-side as orderedQuantity - receivedQuantity).
export type PurchaseOrderLine = {
  purchaseOrderLineId: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  orderedQuantity: number;
  unitCost: number;
  receivedQuantity: number;
  remainingQuantity: number;
  lineTotal: number;
};

// Confirmed verbatim from a real response — no currency fields, no
// per-action user-id fields (just one shared updatedAtUtc).
export type PurchaseOrderDetails = {
  purchaseOrderId: string;
  companyId: string;
  branchId: string;
  purchaseOrderNumber: number;
  purchaseOrderNumberFormatted: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  expectedDeliveryDateUtc: string | null;
  note: string | null;
  totalAmount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  submittedAtUtc: string | null;
  closedAtUtc: string | null;
  cancelledAtUtc: string | null;
  lines: PurchaseOrderLine[];
};

// The real GET .../purchase-orders/{id} response root — order and its
// complete receipt history bundled together, not the order's own fields at
// the root. This is the ONE source of receipt history for the details page
// (see usePurchaseOrderDetails); the dedicated GET .../receipts endpoint
// stays available for other workflows but isn't called a second time here.
export type PurchaseOrderDetailsResponse = {
  order: PurchaseOrderDetails;
  receipts: PurchaseGoodsReceipt[];
};

// ---- Goods Receipts ----

export type PostPurchaseGoodsReceiptLineRequest = {
  purchaseOrderLineId: string;
  receivedQuantity: number;
};

export type PostPurchaseGoodsReceiptRequest = {
  inventoryLocationId: string;
  note?: string | null;
  lines: PostPurchaseGoodsReceiptLineRequest[];
  idempotencyKey: string;
};

// No confirmed real sample exists for a non-empty receipts array (the
// captured response only had receipts: []); modeled consistently with the
// now-confirmed PurchaseOrderLine shape — no baseUnitOfMeasure, no currency.
export type PurchaseGoodsReceiptLine = {
  purchaseOrderLineId: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  receivedQuantity: number;
};

export type PurchaseGoodsReceipt = {
  purchaseGoodsReceiptId: string;
  grnNumber: number;
  grnNumberFormatted: string;
  purchaseOrderId: string;
  inventoryLocationId: string;
  inventoryLocationCode: string;
  inventoryLocationName: string;
  note: string | null;
  receivedByUserId: string;
  receivedAtUtc: string;
  wasAlreadyProcessed: boolean;
  lines: PurchaseGoodsReceiptLine[];
};
