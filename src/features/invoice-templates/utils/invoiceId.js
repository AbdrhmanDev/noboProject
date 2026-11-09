const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

// The preview's invoice id is checked before sending, so a typo never reaches the server (which also refuses it, with
// Template.PreviewInvoiceIdInvalid).
export function isValidInvoiceId(value) {
  const trimmed = (value || "").trim();
  return GUID_PATTERN.test(trimmed) && trimmed !== EMPTY_GUID;
}
