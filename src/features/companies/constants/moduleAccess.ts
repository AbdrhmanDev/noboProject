import { ROUTES } from "../../../utils/routes";
import {
  ENTITLEMENT_INVENTORY,
  ENTITLEMENT_POS,
  ENTITLEMENT_PROCUREMENT,
  ENTITLEMENT_RESTAURANT,
  ENTITLEMENT_RESTAURANT_KITCHEN,
} from "./entitlementCodes";

export type LandingModule = {
  key: string;
  route: string;
  // Bare "can see this module at all" permissions (any-of) -- matches PermissionNavItem's own
  // any-of semantics for the same module.
  viewPermissions: string[];
  // Holding any of these signals genuine primary/operational engagement with the module, not
  // just incidental read visibility (see the CASHIER note below). Optional: a module with no
  // action permissions of its own (Users & Access) uses Manage-tier permissions instead.
  actionPermissions?: string[];
  entitlement?: string;
};

// Single source of truth for the permission-driven default-landing-route resolver (Section 3 of
// the Permission-Driven Tenant Application Shell task) -- deliberately NOT wired into the
// existing, already-working NavGroup components (KitchenNavGroup/InventoryNavGroup/
// RestaurantNavGroup/ProcurementNavGroup) or navItems.jsx, to avoid rewriting working navigation
// unnecessarily. The permission/entitlement pairs below are copied to match those components
// exactly -- if a module's required permission or entitlement ever changes there, update it here
// too.
//
// viewPermissions/actionPermissions split exists because of a real system-role shape (see
// SystemCompanyRoles.cs, CASHIER): a Cashier holds Restaurant.View (so they can see dine-in table
// context on an order) alongside a full set of POS permissions (View/OpenShift/CloseShift/
// PrintReceipt). A naive "any permission for module X -> module X is a landing candidate" count
// would see the Cashier matching BOTH Pos and Restaurant and, needing to pick one, land on
// neither correctly. Treating a lone view-only permission as "incidental visibility" rather than
// "primary module ownership" is what lets the resolver land the Cashier on POS -- Restaurant.View
// alone never outweighs it. This is pure permission-set arithmetic, not a role-name check: the
// exact same rule applies unchanged to a custom "Senior Cashier" role built from scratch.
export const LANDING_MODULES: LandingModule[] = [
  {
    key: "pos",
    route: ROUTES.POS,
    viewPermissions: ["Pos.View"],
    actionPermissions: ["Pos.Configure", "Pos.OpenShift", "Pos.CloseShift", "Pos.AdjustCashDrawer", "Pos.PrintReceipt"],
    entitlement: ENTITLEMENT_POS,
  },
  {
    key: "kitchen",
    route: ROUTES.KITCHEN,
    viewPermissions: ["Kitchen.View"],
    actionPermissions: ["Kitchen.Manage"],
    entitlement: ENTITLEMENT_RESTAURANT_KITCHEN,
  },
  {
    key: "restaurant",
    route: ROUTES.RESTAURANT_FLOOR,
    viewPermissions: ["Restaurant.View"],
    actionPermissions: ["Restaurant.Manage"],
    entitlement: ENTITLEMENT_RESTAURANT,
  },
  {
    key: "inventory",
    route: ROUTES.INVENTORY,
    viewPermissions: ["Inventory.View"],
    actionPermissions: ["Inventory.Configure", "Inventory.AdjustStock"],
    entitlement: ENTITLEMENT_INVENTORY,
  },
  {
    key: "procurement",
    route: ROUTES.PURCHASES,
    viewPermissions: ["Purchases.View"],
    actionPermissions: ["Purchases.Manage", "Purchases.Receive"],
    entitlement: ENTITLEMENT_PROCUREMENT,
  },
  {
    key: "users-access",
    route: ROUTES.USERS_ACCESS,
    viewPermissions: ["Users.View", "Roles.View"],
    actionPermissions: ["Users.Manage", "Roles.Manage"],
  },
];
