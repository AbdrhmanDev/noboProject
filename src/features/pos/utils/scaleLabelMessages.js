// Scale Label Barcodes Phase 1: the backend's rejection codes for scale labels, PLUs and line
// weight sources (Nobo.Application.Catalog.ScaleLabels.ScaleLabelErrors,
// SalesOrderLineWeightSourceResolver, Create/UpdateProductVariantHandler, TestScaleLabelBarcodeHandler),
// each with an Arabic and English message under "scaleLabel.error.<code>" in i18n/translations.js.
export const SCALE_LABEL_ERROR_CODES = [
  "ScaleLabel.InvalidCheckDigit",
  "ScaleLabel.InvalidItemCode",
  "ScaleLabel.InvalidWeight",
  "ScaleLabel.WeightAboveMaximum",
  "ScaleLabel.UnknownItemCode",
  "ScaleLabel.VariantNotByWeight",
  "ScaleLabel.UnitMismatch",
  "SalesOrder.ScaleLabelWeightMismatch",
  "SalesOrder.ScaleLabelVariantMismatch",
  "SalesOrder.ScaleLabelBarcodeRequired",
  "SalesOrder.ScaleLabelBarcodeNotAllowed",
  "SalesOrder.ScaleLabelBarcodeInvalid",
  "SalesOrder.ScaleLabelNotEnabled",
  "SalesOrder.WeightSourceInvalid",
  "SalesOrder.WeightSourceNotAllowed",
  "ProductVariant.ScaleItemCodeInUse",
  "ProductVariant.ScaleItemCodeInvalid",
  "ScaleLabelSettings.NotConfigured",
];

const KNOWN = new Set(SCALE_LABEL_ERROR_CODES);

// The translated message for a known code, or null so the caller keeps its own fallback.
export function scaleLabelErrorMessage(code, t) {
  return code && KNOWN.has(code) ? t(`scaleLabel.error.${code}`) : null;
}
