import { ROUTES } from "../../../utils/routes";
import { LANDING_MODULES, type LandingModule } from "../constants/moduleAccess";
import type { CompanyEntitlements, EffectivePermissions } from "../types/company.types";
import {
  isEntitlementEnabled,
  useCompanyEntitlements,
  useCompanyPermissions,
} from "./useCompanies";

// A user genuinely has nothing to do in this Company -- distinct from "has some permission that
// doesn't map to a specific landing module" (that case still safely lands on Dashboard, which
// requires no permission to view). Centralized here so CompanyGate (global no-access state) and
// the landing resolver below agree on exactly one definition.
export function hasAnyUsableAccess(permissions: EffectivePermissions | null | undefined): boolean {
  if (!permissions) return false;
  return permissions.isOwner || permissions.permissions.length > 0;
}

function isEnabledForCompany(module: LandingModule, entitlements: CompanyEntitlements | null | undefined) {
  return !module.entitlement || isEntitlementEnabled(entitlements, module.entitlement);
}

// Candidacy is view-permission-only, deliberately matching RouteAccessGate's own requirement for
// every one of these routes in App.jsx (which mirrors the pre-existing nav visibility check) --
// a permission set that holds only an action/manage-tier permission without its view sibling
// (an unusual custom-role shape, not present in any SystemCompanyRoles today) could not open the
// route anyway, so it must not be treated as a landing candidate for it either.
function matchesModule(module: LandingModule, held: string[]) {
  return module.viewPermissions.some((permission) => held.includes(permission));
}

// Strong = genuine primary/operational engagement (holds an action-tier permission), not just
// incidental view-only visibility into a related module -- see moduleAccess.ts's CASHIER note.
function isStrongMatch(module: LandingModule, held: string[]) {
  return (module.actionPermissions ?? []).some((permission) => held.includes(permission));
}

// Permission + entitlement driven default landing route (Section 3): centralized here rather than
// duplicated in Login/CompanyGate/Sidebar. Deliberately never inspects role names or codes --
// see moduleAccess.ts for why view-only vs action permissions are distinguished.
//
// - Owner -> Dashboard (broad access by definition).
// - Exactly one module matches (permission granted AND, if it has one, its entitlement enabled)
//   -> that module's route, regardless of view/action strength (a genuinely single-module user,
//     even with only a bare view permission, still has exactly one place to go).
// - More than one module matches -> if exactly one of those matches is a STRONG match, that one
//   wins (e.g. a Cashier matching both Pos (strong) and Restaurant (weak, view-only) lands on
//   POS); otherwise (zero or multiple strong matches -- e.g. a Manager with both strong Pos and
//   strong Kitchen) -> Dashboard, since that is genuinely broad/manager-level access.
// - Zero modules match -> Dashboard: either no usable permission maps to a specific single-purpose
//   surface (Dashboard is a safe generic landing) or a permission's module has its Company
//   Entitlement disabled (Section 10: a stale permission must never expose a module that isn't
//   actually owned).
//
// hasAnyUsableAccess (zero permissions at all, not owner) is intentionally NOT handled here --
// that is CompanyGate's job (a single, global "No access assigned" state for every route, not
// just Dashboard's).
export function resolveLandingRoute(
  permissions: EffectivePermissions | null | undefined,
  entitlements: CompanyEntitlements | null | undefined,
): string {
  if (!permissions || permissions.isOwner) {
    return ROUTES.DASHBOARD;
  }

  const held = permissions.permissions;
  const matches = LANDING_MODULES.filter(
    (module) => matchesModule(module, held) && isEnabledForCompany(module, entitlements),
  );

  if (matches.length === 0) return ROUTES.DASHBOARD;
  if (matches.length === 1) return matches[0].route;

  const strongMatches = matches.filter((module) => isStrongMatch(module, held));
  return strongMatches.length === 1 ? strongMatches[0].route : ROUTES.DASHBOARD;
}

export function useLandingRoute(companyId: string | null | undefined) {
  const permissionsQuery = useCompanyPermissions(companyId);
  const entitlementsQuery = useCompanyEntitlements(companyId);

  return {
    route: resolveLandingRoute(permissionsQuery.data, entitlementsQuery.data),
    isLoading: permissionsQuery.isLoading || entitlementsQuery.isLoading,
    isError: permissionsQuery.isError || entitlementsQuery.isError,
  };
}
