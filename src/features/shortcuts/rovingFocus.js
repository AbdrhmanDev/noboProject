// Arrow-key navigation for a grid of focusable buttons (product cards,
// payment methods, tables, modifier options, variants, order selection).
// Deliberately NOT part of the central shortcut dispatcher — this is local
// DOM focus management, scoped naturally to whichever grid currently has
// focus, the same way any accessible listbox/grid widget works. Enter/Space
// activation is native <button> behavior and needs no code here at all.
import { useCallback, useLayoutEffect } from "react";

const ARROW_CODES = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

// Single selector every POS roving-focus grid uses (product cards, tables,
// payment methods, variants, modifier options) — centralized so every call
// site stays in sync instead of each file redefining the same string.
export const ROVING_ITEM_SELECTOR = "[data-roving-item]";

export function getFocusableGridItems(container, selector) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(selector)).filter((el) => !el.disabled);
}

function centerOf(el) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// Pure visual/physical spatial navigation: ArrowLeft/Right/Up/Down always
// mean "move to the nearest eligible element in that direction on screen",
// using real bounding-rect centers — never document.dir, computed CSS
// direction, or DOM order. This is deliberate: keyboard arrows represent
// physical screen position, not reading direction, so Arabic/RTL and
// English/LTR must behave identically. Among every item in the correct
// half-plane (e.g. strictly left of the current center for ArrowLeft), the
// one with the smallest Euclidean distance wins — which naturally prefers a
// same-row/same-column neighbor over a diagonal one in a regular grid,
// without needing to know the grid's column count (which changes per
// breakpoint) or DOM order at all.
function findNearestInDirection(code, current, items) {
  const from = centerOf(current);
  let best = null;
  let bestDistance = Infinity;

  for (const el of items) {
    if (el === current) continue;
    const to = centerOf(el);

    const inHalfPlane =
      code === "ArrowLeft"
        ? to.x < from.x
        : code === "ArrowRight"
          ? to.x > from.x
          : code === "ArrowUp"
            ? to.y < from.y
            : to.y > from.y;

    if (!inHalfPlane) continue;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = el;
    }
  }

  return best;
}

// Returns true if it handled the key (and already called preventDefault).
export function handleGridArrowKeyDown(event, container, selector) {
  if (!container || !ARROW_CODES.has(event.code)) return false;

  const items = getFocusableGridItems(container, selector);
  if (!items.length) return false;

  const focusedItem = items.includes(document.activeElement) ? document.activeElement : null;
  // Nothing inside the grid has focus yet — land on the first item instead
  // of guessing a direction from nowhere.
  const target = focusedItem ? findNearestInDirection(event.code, focusedItem, items) : items[0];

  event.preventDefault();
  if (target) target.focus();
  return true;
}

// Attach the returned handler as onKeyDown on the grid's container element.
export function useGridArrowNav(containerRef, selector) {
  return useCallback(
    (event) => {
      handleGridArrowKeyDown(event, containerRef.current, selector);
    },
    [containerRef, selector],
  );
}

// For modal grids (payment methods, modifier options, variants): arrow-key
// navigation needs *something* focused inside the grid before it can move
// anywhere, and nothing else focuses it automatically when the dialog
// mounts. Not used for inline/always-on-page grids (product grid, table
// grid) — auto-focusing those on every render/filter change would steal
// focus away from whatever the cashier is doing (e.g. typing in search).
//
// Deliberately a layout effect, not a passive one: when selecting a Variant
// immediately opens the Modifiers dialog, the Variant PosModal unmounts and
// the Modifiers PosModal mounts in the same commit. PosModal's own
// focus-restore-on-close (a passive effect) would otherwise race this one —
// passive effects for an unmounting tree run before passive effects for a
// newly-mounted one, so a plain useEffect here could lose to PosModal's
// "restore focus to whatever opened the old dialog" cleanup. Layout effects
// run synchronously before paint and before any passive effect, so this
// always wins that race and PosModal's restore (which itself now checks
// whether something already claimed focus — see PosModal.jsx) correctly
// backs off.
export function useAutoFocusFirstItem(containerRef, selector, active = true) {
  useLayoutEffect(() => {
    if (!active) return;
    const items = getFocusableGridItems(containerRef.current, selector);
    if (items.length && !items.includes(document.activeElement)) {
      items[0].focus();
    }
    // Runs once per mount/activation (containerRef is a stable ref object
    // and selector is always a module-level constant at every call site, so
    // neither dependency causes an extra run) — re-focusing on every
    // re-render (e.g. a query refetch) would yank focus away from wherever
    // the cashier just navigated to.
  }, [active, containerRef, selector]);
}
