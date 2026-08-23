// ---- Contract note ----
// This backend's OpenAPI document (confirmed via /openapi/v1.json) fully
// describes every request body and query parameter below, but — consistent
// with every other controller observed in this codebase — it does NOT
// describe response bodies (each GET/action here has only
// `"200": { "description": "OK" }`, no schema). Request-side fields are
// exact and reliable. Response shapes are modeled from: (a) symmetric
// naming with the confirmed request DTOs, (b) the existing
// InventoryUnitOfMeasure/InventoryItem shape already established in
// features/inventory, and (c) this backend's consistent "list + Formatted
// number" conventions already confirmed for Sales (OrderNumberFormatted)
// and Restaurant. Every field is read defensively in the API layer — never
// fabricated.

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

export type InventoryUnitOfMeasureRef = {
  id: string;
  code: string;
  name: string;
  symbol: string;
};

export type PurchaseOrderListItem = {
  purchaseOrderId: string;
  purchaseOrderNumber: number;
  purchaseOrderNumberFormatted: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  currencyCode: string;
  currencyMinorUnitDigits: number;
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

export type PurchaseOrderLine = {
  purchaseOrderLineId: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  baseUnitOfMeasure: InventoryUnitOfMeasureRef;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  lineTotal: number;
};

export type PurchaseOrderDetails = {
  purchaseOrderId: string;
  purchaseOrderNumber: number;
  purchaseOrderNumberFormatted: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  currencyCode: string;
  currencyMinorUnitDigits: number;
  expectedDeliveryDateUtc: string | null;
  note: string | null;
  totalAmount: number;
  createdAtUtc: string;
  createdByUserId: string;
  submittedAtUtc: string | null;
  submittedByUserId: string | null;
  cancelledAtUtc: string | null;
  cancelledByUserId: string | null;
  closedAtUtc: string | null;
  closedByUserId: string | null;
  lines: PurchaseOrderLine[];
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

export type PurchaseGoodsReceiptLine = {
  purchaseOrderLineId: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  baseUnitOfMeasure: InventoryUnitOfMeasureRef;
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
