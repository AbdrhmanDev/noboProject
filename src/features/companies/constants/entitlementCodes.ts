// Mirrors the backend's Nobo.Application.Entitlements.EntitlementCatalog -- kept as plain string
// constants (not re-derived from any API response) so nav/route code can reference them the same
// way ApplicationPermissions.* strings are already referenced throughout the frontend. The backend
// remains the source of truth for which codes exist and how the hierarchy resolves; this file only
// names the codes, it never re-implements the parent/child evaluation.
export const ENTITLEMENT_POS = "POS";
export const ENTITLEMENT_INVENTORY = "INVENTORY";
export const ENTITLEMENT_RESTAURANT = "RESTAURANT";
export const ENTITLEMENT_PROCUREMENT = "PROCUREMENT";

// Child capabilities -- Commercial App Root Entitlement Enforcement Sweep. Each still requires its
// parent app above to be enabled too (the backend's /me/entitlements response already resolves
// that chain into a single `enabled` flag per code, so a plain equality check here is sufficient).
export const ENTITLEMENT_RESTAURANT_KITCHEN = "RESTAURANT.KITCHEN";
