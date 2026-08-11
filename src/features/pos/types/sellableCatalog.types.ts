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

export type BranchSellableCatalogItem = {
  categoryId: string | null;
  categoryName: string | null;
  productId: string;
  productName: string;
  productDescription: string | null;
  productVariantId: string;
  variantName: string;
  sku: string | null;
  salesUnitOfMeasure: BranchSellableCatalogUnitOfMeasure;
  unitPrice: number;
  modifierGroups: BranchSellableCatalogModifierGroup[];
};

export type BranchSellableCatalogResponse = {
  branchId: string;
  priceListId: string;
  priceListName: string;
  currencyCode: string;
  items: BranchSellableCatalogItem[];
};
