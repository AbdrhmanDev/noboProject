export type InventoryStatus = "Active" | "Suspended";

export type InventoryUnitOfMeasure = {
  id: string;
  code: string;
  name: string;
  symbol: string;
};

export type InventoryItem = {
  inventoryItemId: string;
  companyId: string;
  code: string;
  name: string;
  baseUnitOfMeasure: InventoryUnitOfMeasure;
  status: InventoryStatus;
  createdAtUtc: string | null;
};

export type InventoryItemFilters = {
  status?: InventoryStatus | "";
  search?: string;
  unitOfMeasureId?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type InventoryItemListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: InventoryItem[];
};

export type CreateInventoryItemRequest = {
  code: string;
  name: string;
  baseUnitOfMeasureId: string;
};

export type UpdateInventoryItemRequest = {
  code: string;
  name: string;
};

export type ChangeInventoryItemStatusRequest = {
  status: InventoryStatus;
};

export type InventoryLocation = {
  inventoryLocationId: string;
  branchId: string;
  code: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  status: InventoryStatus;
  createdAtUtc: string;
};

export type InventoryLocationFilters = {
  status?: InventoryStatus | "";
  search?: string;
};

export type CreateInventoryLocationRequest = {
  code: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
};

export type UpdateInventoryLocationRequest = {
  code: string;
  name: string;
  sortOrder: number;
};

export type ChangeInventoryLocationStatusRequest = {
  status: InventoryStatus;
};

export type ProductVariantInventoryConsumptionComponent = {
  inventoryItemId: string;
  code: string;
  name: string;
  quantityPerSalesUnit: number;
  baseUnitOfMeasure: InventoryUnitOfMeasure;
};

export type ProductVariantInventoryConsumption = {
  productVariantId: string;
  components: ProductVariantInventoryConsumptionComponent[];
};

export type SetProductVariantInventoryComponentRequest = {
  quantityPerSalesUnit: number;
};

export type SetProductVariantInventoryComponentResponse = {
  productVariantInventoryComponentId: string;
  productVariantId: string;
  inventoryItemId: string;
  quantityPerSalesUnit: number;
  baseUnitOfMeasure: InventoryUnitOfMeasure;
  createdAtUtc: string;
  updatedAtUtc: string;
  wasCreated: boolean;
};

export type ModifierOptionInventoryAdjustment = {
  modifierOptionInventoryAdjustmentId: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  inventoryItemStatus: InventoryStatus;
  baseUnitOfMeasure: InventoryUnitOfMeasure;
  quantityDelta: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type ModifierOptionInventoryAdjustments = {
  modifierOptionId: string;
  modifierOptionName: string;
  modifierOptionStatus: string;
  adjustments: ModifierOptionInventoryAdjustment[];
};

export type SetModifierOptionInventoryAdjustmentRequest = {
  quantityDelta: number;
};

export type SetModifierOptionInventoryAdjustmentResponse = {
  modifierOptionInventoryAdjustmentId: string;
  modifierOptionId: string;
  inventoryItemId: string;
  quantityDelta: number;
  baseUnitOfMeasure: InventoryUnitOfMeasure;
  createdAtUtc: string;
  updatedAtUtc: string;
  wasCreated: boolean;
};

// Stock

export type InventoryStockItem = {
  inventoryItemId: string;
  code: string;
  name: string;
  quantityOnHand: number;
  baseUnitOfMeasure: InventoryUnitOfMeasure;
};

export type InventoryLocationStock = {
  inventoryLocationId: string;
  code: string;
  name: string;
  items: InventoryStockItem[];
};

// Manual Stock Adjustment

export type PostManualStockAdjustmentLineRequest = {
  inventoryItemId: string;
  quantityDelta: number;
};

export type PostManualStockAdjustmentRequest = {
  reason: string | null;
  lines: PostManualStockAdjustmentLineRequest[];
};

export type PostManualStockAdjustmentLineResponse = {
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  quantityDelta: number;
  baseUnitOfMeasure: InventoryUnitOfMeasure;
};

export type PostManualStockAdjustmentResponse = {
  inventoryStockTransactionId: string;
  type: string;
  inventoryLocationId: string;
  inventoryLocationCode: string;
  inventoryLocationName: string;
  reason: string | null;
  createdByUserId: string;
  createdAtUtc: string;
  wasAlreadyProcessed: boolean;
  lines: PostManualStockAdjustmentLineResponse[];
};

// Ledger

export type InventoryTransactionType = "ManualAdjustment" | "SalesConsumption" | "SalesReversal";

export type InventoryStockTransactionFilters = {
  inventoryLocationId?: string;
  inventoryItemId?: string;
  transactionType?: InventoryTransactionType | "";
  createdFromUtc?: string;
  createdToUtc?: string;
  salesOrderId?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type InventoryStockTransactionListItem = {
  inventoryStockTransactionId: string;
  companyId: string;
  branchId: string;
  inventoryLocationId: string;
  inventoryLocationCode: string;
  inventoryLocationName: string;
  transactionType: string;
  sourceSalesOrderId: string | null;
  reversesInventoryStockTransactionId: string | null;
  reason: string | null;
  createdByUserId: string;
  createdAtUtc: string;
  lineCount: number;
};

export type InventoryStockTransactionListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: InventoryStockTransactionListItem[];
};

export type InventoryStockTransactionLine = {
  inventoryStockTransactionLineId: string;
  inventoryItemId: string;
  inventoryItemCode: string;
  inventoryItemName: string;
  quantityDelta: number;
  baseUnitOfMeasure: InventoryUnitOfMeasure;
  createdAtUtc: string;
};

export type InventoryStockTransactionDetails = {
  inventoryStockTransactionId: string;
  companyId: string;
  branchId: string;
  inventoryLocationId: string;
  inventoryLocationCode: string;
  inventoryLocationName: string;
  transactionType: string;
  sourceSalesOrderId: string | null;
  reversesInventoryStockTransactionId: string | null;
  reason: string | null;
  createdByUserId: string;
  createdAtUtc: string;
  lines: InventoryStockTransactionLine[];
};
