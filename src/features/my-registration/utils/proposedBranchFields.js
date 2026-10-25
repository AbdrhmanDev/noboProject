// The exact 9 fields Nobo.Api.CustomerRegistration.ProposedBranchRequest accepts -- nothing more.
// [key, label, requiredByBackend]. Shared by the branches editor (to render them) and the
// registration wizard (to check every one is filled before moving on).
export const PROPOSED_BRANCH_FIELDS = [
  ["name", "Name", true],
  ["code", "Code", false],
  ["phoneNumber", "Phone", false],
  ["countryCode", "Country code", true],
  ["city", "City", true],
  ["district", "District", false],
  ["street", "Street", false],
  ["buildingNumber", "Building number", false],
  ["postalCode", "Postal code", false],
];

export const isFilled = (value) => String(value ?? "").trim().length > 0;
