export type BranchSellableCatalogUnitOfMeasure = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  allowsFractionalQuantity: boolean;
};

export type BranchSellableCatalogModifierOption = {
  modifierOptionId: string;
  name: string;
  sortOrder: number;
  amountAdjustment: number;
};

export type BranchSellableCatalogModifierGroup = {
  modifierGroupId: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  options: BranchSellableCatalogModifierOption[];
};

// "PerUnit" | "ByWeight" (Variable-Weight Products Phase B). A variant without this field (an
// older cached response) is treated as "PerUnit" everywhere this is read.
export type SellingMode = "PerUnit" | "ByWeight";

export type BranchSellableCatalogItem = {
  categoryId: string | null;
  categoryName: string | null;
  productId: string;
  productName: string;
  productDescription: string | null;
  productImageUrl: string | null;
  productVariantId: string;
  variantName: string;
  sku: string | null;
  salesUnitOfMeasure: BranchSellableCatalogUnitOfMeasure;
  unitPrice: number;
  modifierGroups: BranchSellableCatalogModifierGroup[];
  sellingMode: SellingMode;
};

export type BranchSellableCatalogResponse = {
  branchId: string;
  priceListId: string;
  priceListName: string;
  currencyCode: string;
  items: BranchSellableCatalogItem[];
};
