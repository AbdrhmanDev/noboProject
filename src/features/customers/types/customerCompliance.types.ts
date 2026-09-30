// Mirrors the backend contract EXACTLY (Nobo.Api.Customers.CustomerEndpointContracts /
// Nobo.Application.Customers.SetCustomerComplianceProfile) -- nothing here is invented, and no
// field is renamed or reshaped from what PUT /compliance-profile actually accepts and returns.
//
// Classification is "Consumer" | "Business" | null (= not stated). OtherIdentifierScheme is one
// of the eleven codes the backend enum accepts; it is only meaningful together with an
// OtherIdentifier and is NEVER derived from the customer's VAT/tax number.
export type CustomerClassification = "Consumer" | "Business";

export const OTHER_IDENTIFIER_SCHEMES = [
  "TIN",
  "CRN",
  "MOM",
  "MLS",
  "700",
  "SAG",
  "NAT",
  "GCC",
  "IQA",
  "PAS",
  "OTH",
] as const;

export type OtherIdentifierScheme = (typeof OTHER_IDENTIFIER_SCHEMES)[number];

// Mirrors Nobo.Domain.Customers.Customer.MaxOtherIdentifierLength (also ASCII-alphanumeric-only,
// enforced server-side -- not duplicated here, just the length so the input can't obviously
// overflow before the round trip).
export const MAX_OTHER_IDENTIFIER_LENGTH = 50;

// Mirrors Nobo.Domain.Customers.CustomerStructuredAddress.MaxPartLength -- the same limit applies
// to each of the eight address parts individually.
export const MAX_ADDRESS_PART_LENGTH = 127;

// The eight fields the backend's CustomerStructuredAddressInput supports -- note CountryCode
// (not "Country"), matching the actual C# record property name.
export type CustomerStructuredAddressInput = {
  street: string | null;
  buildingNumber: string | null;
  additionalNumber: string | null;
  district: string | null;
  city: string | null;
  postalCode: string | null;
  province: string | null;
  countryCode: string | null;
};

export type SetCustomerComplianceProfileRequest = {
  classification: CustomerClassification | null;
  otherIdentifier: string | null;
  otherIdentifierScheme: OtherIdentifierScheme | string | null;
  structuredAddress: CustomerStructuredAddressInput | null;
};

export type CustomerComplianceProfileResult = {
  customerId: string;
  classification: CustomerClassification | string | null;
  otherIdentifier: string | null;
  otherIdentifierScheme: string | null;
  structuredAddress: CustomerStructuredAddressInput;
};
