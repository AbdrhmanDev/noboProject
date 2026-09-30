// PRESENTATION ONLY -- see src/features/registrations/utils/fieldLabels.js and
// src/features/company-profile/utils/fieldLabels.js for the identical rationale (no field-catalog
// endpoint exists anywhere in Nobo.Api; this never changes, filters, validates or invents a field,
// only labels a KNOWN key for readability; an unknown key falls back to itself verbatim).
const KNOWN_LABELS = {
  "legal_identity.legal_name": "Legal name",
  "legal_identity.trade_name": "Trade name",
  "legal_identity.tax_number": "VAT / tax number",
  "legal_identity.commercial_registration_number": "Commercial registration number",
  "legal_identity.business_sector": "Business sector (ID)",
  "registered_address.country_code": "Country code",
  "registered_address.building_number": "Building number",
  "registered_address.street_name": "Street",
  "registered_address.district": "District",
  "registered_address.city": "City",
  "registered_address.postal_code": "Postal code",
  "registered_address.additional_number": "Additional number",
  "registered_address.unit_number": "Unit number",
  "registered_address.short_address": "Short address",
  "financial.bank_name": "Bank name",
  "financial.iban": "IBAN",
  "financial.fiscal_year": "Fiscal year",
  "financial.vat_filing_frequency": "VAT filing frequency (Monthly/Quarterly)",
  "financial.annual_revenue": "Annual revenue",
  "financial.annual_expenses": "Annual expenses",
  "representative.full_name": "Representative name",
  "representative.identification_number": "Representative ID number",
  "representative.phone": "Representative phone",
  "representative.email": "Representative email",
  "representative.role": "Representative role",
  "representative.authority_basis": "Authority basis",
  "contacts.primary_phone": "Primary phone",
  "contacts.primary_email": "Primary email",
};

export function fieldLabel(key) {
  return KNOWN_LABELS[key] || key;
}

export const GROUP_LABEL = {
  LegalIdentity: "Legal identity",
  RegisteredAddress: "Registered address",
  Financial: "Financial",
  Representative: "Representative",
  Contacts: "Contacts",
};

export function groupFields(fields) {
  const groups = new Map();
  for (const field of fields) {
    if (!groups.has(field.group)) groups.set(field.group, []);
    groups.get(field.group).push(field);
  }
  return groups;
}
