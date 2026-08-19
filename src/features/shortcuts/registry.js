// Central shortcut registry — the single source of truth for every keyboard
// shortcut in NOBO. Nothing outside this file should hardcode a binding
// string. Components resolve shortcuts through ShortcutContext, which reads
// this registry, applies (future) user overrides, and checks permissions.
import { ROUTES } from "../../utils/routes";
import { findBindingConflicts, isReservedBinding } from "./keyUtils";

export const SHORTCUT_SCOPES = {
  GLOBAL: "global",
  PAGE: "page",
  MODAL: "modal",
};

// Higher number = takes precedence. A Modal-scope binding for a given key
// combo wins over a Page-scope binding, which wins over Global.
export const SCOPE_PRIORITY = {
  [SHORTCUT_SCOPES.GLOBAL]: 0,
  [SHORTCUT_SCOPES.PAGE]: 1,
  [SHORTCUT_SCOPES.MODAL]: 2,
};

function binding(code, mods = {}) {
  return {
    code,
    ctrlKey: Boolean(mods.ctrlKey),
    altKey: Boolean(mods.altKey),
    shiftKey: Boolean(mods.shiftKey),
    metaKey: Boolean(mods.metaKey),
  };
}

// Each entry:
// - id: stable action id ("navigation.pos"), never shown to users directly
// - category: grouping for the Help dialog ("navigation" | "global")
// - scope: which scope layer this binding lives in (Phase 1 = GLOBAL only)
// - labelKey: i18n key for the human-readable label
// - defaultBinding: the out-of-the-box binding (physical `code` + modifiers)
// - permission: permission string required, or null if none
// - enabledByDefault: whether the shortcut is active before any user override
// - editable: whether a future Settings UI may let the user rebind this
// - reserved: true = never allow rebinding away from this action (unused in
//   Phase 1, reserved for Phase 3 semantics such as pinned system shortcuts)
// - action: what firing the shortcut does
export const SHORTCUT_REGISTRY = [
  {
    id: "navigation.pos",
    category: "navigation",
    scope: SHORTCUT_SCOPES.GLOBAL,
    labelKey: "nav.pos",
    defaultBinding: binding("KeyP", { ctrlKey: true, altKey: true }),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "navigate", to: ROUTES.POS },
  },
  {
    id: "navigation.kitchen",
    category: "navigation",
    scope: SHORTCUT_SCOPES.GLOBAL,
    labelKey: "nav.kitchen",
    defaultBinding: binding("KeyK", { ctrlKey: true, altKey: true }),
    permission: "Kitchen.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "navigate", to: ROUTES.KITCHEN },
  },
  {
    id: "navigation.catalog",
    category: "navigation",
    scope: SHORTCUT_SCOPES.GLOBAL,
    labelKey: "nav.catalog",
    defaultBinding: binding("KeyC", { ctrlKey: true, altKey: true }),
    permission: "Catalog.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "navigate", to: ROUTES.CATALOG_ADMIN },
  },
  {
    id: "navigation.pricing",
    category: "navigation",
    scope: SHORTCUT_SCOPES.GLOBAL,
    labelKey: "nav.pricing",
    defaultBinding: binding("KeyR", { ctrlKey: true, altKey: true }),
    permission: "Pricing.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "navigate", to: ROUTES.PRICING_ADMIN },
  },
  {
    id: "navigation.tax",
    category: "navigation",
    scope: SHORTCUT_SCOPES.GLOBAL,
    labelKey: "nav.tax",
    defaultBinding: binding("KeyT", { ctrlKey: true, altKey: true }),
    permission: "Tax.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "navigate", to: ROUTES.TAX_ADMIN },
  },
  {
    id: "navigation.payments",
    category: "navigation",
    scope: SHORTCUT_SCOPES.GLOBAL,
    labelKey: "nav.payments",
    defaultBinding: binding("KeyM", { ctrlKey: true, altKey: true }),
    permission: "Payments.Configure",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "navigate", to: ROUTES.PAYMENT_METHODS_ADMIN },
  },
  {
    id: "navigation.restaurant",
    category: "navigation",
    scope: SHORTCUT_SCOPES.GLOBAL,
    labelKey: "nav.restaurant",
    defaultBinding: binding("KeyE", { ctrlKey: true, altKey: true }),
    permission: "Restaurant.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "navigate", to: ROUTES.RESTAURANT_ADMIN },
  },
  {
    id: "navigation.inventory",
    category: "navigation",
    scope: SHORTCUT_SCOPES.GLOBAL,
    labelKey: "nav.inventory",
    defaultBinding: binding("KeyI", { ctrlKey: true, altKey: true }),
    permission: "Inventory.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "navigate", to: ROUTES.INVENTORY },
  },
  {
    id: "global.shortcutHelp",
    category: "global",
    scope: SHORTCUT_SCOPES.GLOBAL,
    labelKey: "shortcuts.openHelp",
    defaultBinding: binding("Slash", { ctrlKey: true, altKey: true }),
    permission: null,
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "openShortcutHelp" },
  },

  // ---- POS (Phase 2) ----
  // These are all executed through a POS Page/Modal scope registered by the
  // POS components themselves (useShortcutScope), not through `runAction`
  // below — `action` here is metadata only (kept for shape consistency and
  // so a future generic "what does this do" listing has something to read).
  // `permission: "Pos.View"` gates visibility/hints the same way the POS nav
  // item itself is gated; the finer runtime eligibility (canConfirmOrder,
  // canReceivePayment, hasOpenShift, ...) is enforced inside each binding's
  // onTrigger by reusing POSPage's own existing booleans, not re-derived
  // here.
  {
    id: "pos.newOrder",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.newOrder",
    defaultBinding: binding("F2"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.selectOrder",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.selectOrder",
    // Not in RESERVED_BINDINGS: unlike every entry there, bare F6 isn't
    // destructive — in Chrome/Firefox/Edge it just cycles focus to the
    // address bar, which our keydown handler's preventDefault() suppresses
    // before the browser's default action runs. Checked against the
    // registry (no conflicts) and the reserved list (not present) per spec.
    defaultBinding: binding("F6"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.focusProductSearch",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.focusProductSearch",
    defaultBinding: binding("F3"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.browseProducts",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.browseProducts",
    // F5/F6/F7/F10/F11/F12 all carry real browser/OS chrome behavior
    // (reload, address-bar focus, Firefox's caret-browsing prompt, the
    // Windows/Firefox menu-bar activation key, fullscreen, devtools) — F1
    // has no such interception in Chrome/Firefox/Edge at the page level, and
    // isn't used anywhere else in this registry.
    defaultBinding: binding("F1"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.orderType.takeaway",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.orderTypeTakeaway",
    defaultBinding: binding("F4"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.orderType.dineIn",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.orderTypeDineIn",
    // Ctrl+F4 was the task's suggested default, but it closes the current
    // tab/document in Chromium browsers — checked against the reserved list
    // below and swapped for Shift+F4 instead.
    defaultBinding: binding("F4", { shiftKey: true }),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.confirm",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    // Contextual: whatever OrderPrimaryAction currently shows (Confirm & Pay
    // / Confirm Order / Pay / New Order / Close Order) — see
    // getOrderPrimaryAction, the single source of truth both the button and
    // this binding call.
    labelKey: "shortcuts.pos.confirm",
    defaultBinding: binding("F8"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.openPayment",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.openPayment",
    defaultBinding: binding("F9"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.quantity.increase",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.quantityIncrease",
    defaultBinding: binding("Equal", { shiftKey: true }),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.quantity.decrease",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.quantityDecrease",
    defaultBinding: binding("Minus"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.removeLine",
    category: "pos",
    scope: SHORTCUT_SCOPES.PAGE,
    labelKey: "shortcuts.pos.removeLine",
    defaultBinding: binding("Delete"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.exactAmount",
    category: "pos",
    scope: SHORTCUT_SCOPES.MODAL,
    labelKey: "shortcuts.pos.exactAmount",
    defaultBinding: binding("KeyE"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.receivePayment",
    category: "pos",
    scope: SHORTCUT_SCOPES.MODAL,
    labelKey: "shortcuts.pos.receivePayment",
    defaultBinding: binding("Enter", { ctrlKey: true }),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
  {
    id: "pos.closeModal",
    category: "pos",
    scope: SHORTCUT_SCOPES.MODAL,
    // Executed once, generically, by PosModal itself (every POS dialog's
    // shared shell) calling its own `onClose` prop — not duplicated per
    // dialog.
    labelKey: "shortcuts.pos.closeModal",
    defaultBinding: binding("Escape"),
    permission: "Pos.View",
    enabledByDefault: true,
    editable: true,
    reserved: false,
    action: { type: "scopeBound" },
  },
];

if (import.meta.env.DEV) {
  const conflicts = findBindingConflicts(
    SHORTCUT_REGISTRY.map((entry) => ({ id: entry.id, binding: entry.defaultBinding })),
  );
  if (conflicts.length) {
    console.warn("[shortcuts] default binding conflicts detected:", conflicts);
  }

  const reserved = SHORTCUT_REGISTRY.filter((entry) => isReservedBinding(entry.defaultBinding));
  if (reserved.length) {
    console.warn(
      "[shortcuts] default bindings collide with reserved browser/OS shortcuts:",
      reserved.map((entry) => entry.id),
    );
  }
}
