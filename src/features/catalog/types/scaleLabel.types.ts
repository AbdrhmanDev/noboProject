// Scale Label Barcodes Phase 1 -- mirrors Nobo.Api.Catalog.ScaleLabels.ScaleLabelSettingsEndpoints
// and the Application handlers behind it (GetScaleLabelSettingsHandler, SetScaleLabelSettingsHandler,
// TestScaleLabelBarcodeHandler) exactly. The decoding itself happens ONLY on the server; nothing in
// the frontend re-implements it.

// GET / PUT response.
export type ScaleLabelSettings = {
  // false = nothing saved yet: the remaining fields are the server's suggested defaults, disabled.
  isConfigured: boolean;
  isEnabled: boolean;
  // Always 2 in this phase (the backend does not accept 1-digit prefixes yet).
  prefixLength: number;
  prefixes: string[];
  itemCodeLength: number;
  weightLength: number;
  weightDecimals: number;
  maxWeightKg: number;
  updatedAtUtc: string | null;
};

export type SetScaleLabelSettingsRequest = {
  isEnabled: boolean;
  prefixes: string[];
  itemCodeLength: number;
  weightLength: number;
  weightDecimals: number;
  maxWeightKg: number;
};

// Layout fields omitted = test against the SAVED layout; all sent = test the unsaved form layout.
export type TestScaleLabelBarcodeRequest = {
  code: string;
  prefixes?: string[];
  itemCodeLength?: number;
  weightLength?: number;
  weightDecimals?: number;
  maxWeightKg?: number;
};

export type TestScaleLabelBarcodeResult = {
  // false = not this layout's shape: a scan treats it as an ordinary barcode.
  isScaleLabel: boolean;
  // null on success; otherwise a ScaleLabel.* rejection code.
  failureCode: string | null;
  itemCode: string | null;
  weightKg: number | null;
  productVariantId: string | null;
  productVariantName: string | null;
  sellingMode: string | null;
};
