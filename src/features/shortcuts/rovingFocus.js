// Arrow-key navigation for a grid of focusable buttons (product cards,
// payment methods, tables, modifier options, variants). Deliberately NOT
// part of the central shortcut dispatcher — this is local DOM focus
// management, scoped naturally to whichever grid currently has focus, the
// same way any accessible listbox/grid widget works. Enter/Space activation
// is native <button> behavior and needs no code here at all.
import { useCallback } from "react";

const ARROW_CODES = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function isContainerRtl(container) {
  if (!container || typeof window === "undefined") return false;
  return window.getComputedStyle(container).direction === "rtl";
}

export function getFocusableGridItems(container, selector) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(selector)).filter((el) => !el.disabled);
}

// Groups items into visual rows by comparing bounding-rect tops instead of
// assuming a fixed column count — the product grid's column count changes
// per breakpoint (grid-cols-2 sm:grid-cols-3 ...), so a static count would
// drift out of sync with what's actually on screen.
function groupIntoRows(items) {
  const rows = [];

  items.forEach((el) => {
    const rect = el.getBoundingClientRect();
    let row = rows.find((candidate) => Math.abs(candidate.top - rect.top) < 6);
    if (!row) {
      row = { top: rect.top, entries: [] };
      rows.push(row);
    }
    row.entries.push({ el, left: rect.left });
  });

  rows.sort((a, b) => a.top - b.top);
  rows.forEach((row) => row.entries.sort((a, b) => a.left - b.left));
  return rows;
}

// Only horizontal movement is direction-aware — vertical arrows always mean
// the same thing in RTL and LTR.
function getArrowTarget(code, rows, rowIndex, colIndex, rtl) {
  if (code === "ArrowRight" || code === "ArrowLeft") {
    const goingRight = code === "ArrowRight";
    const step = goingRight === rtl ? -1 : 1;
    const row = rows[rowIndex];
    const nextCol = Math.max(0, Math.min(row.entries.length - 1, colIndex + step));
    return row.entries[nextCol]?.el ?? null;
  }

  const step = code === "ArrowDown" ? 1 : -1;
  const nextRowIndex = Math.max(0, Math.min(rows.length - 1, rowIndex + step));
  const nextRow = rows[nextRowIndex];
  const nextCol = Math.min(colIndex, nextRow.entries.length - 1);
  return nextRow.entries[nextCol]?.el ?? null;
}

// Returns true if it handled the key (and already called preventDefault).
export function handleGridArrowKeyDown(event, container, selector) {
  if (!container || !ARROW_CODES.has(event.code)) return false;

  const items = getFocusableGridItems(container, selector);
  if (!items.length) return false;

  const rows = groupIntoRows(items);
  let rowIndex = 0;
  let colIndex = 0;

  rows.forEach((row, candidateRowIndex) => {
    const candidateColIndex = row.entries.findIndex((entry) => entry.el === document.activeElement);
    if (candidateColIndex >= 0) {
      rowIndex = candidateRowIndex;
      colIndex = candidateColIndex;
    }
  });

  const target = getArrowTarget(event.code, rows, rowIndex, colIndex, isContainerRtl(container));

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
