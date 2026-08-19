// Physical-key (KeyboardEvent.code) utilities shared by the shortcut registry,
// resolver, dispatcher, and display components. Using `code` instead of `key`
// keeps letter-based shortcuts on the physical key even when the active
// keyboard layout is Arabic (or any other non-Latin layout).

const LETTER_LABELS = Object.fromEntries(
  Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    return [`Key${letter}`, letter];
  }),
);

const DIGIT_LABELS = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [`Digit${i}`, String(i)]),
);

const NAMED_LABELS = {
  Enter: "Enter",
  Escape: "Esc",
  Delete: "Delete",
  Backspace: "Backspace",
  Tab: "Tab",
  Space: "Space",
  Slash: "/",
  Backslash: "\\",
  Comma: ",",
  Period: ".",
  Semicolon: ";",
  Quote: "'",
  Minus: "-",
  Equal: "+",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
};

const CODE_LABELS = { ...LETTER_LABELS, ...DIGIT_LABELS, ...NAMED_LABELS };

export function labelForCode(code) {
  return CODE_LABELS[code] || code;
}

const MODIFIER_LABELS = [
  ["ctrlKey", "Ctrl"],
  ["altKey", "Alt"],
  ["shiftKey", "Shift"],
  ["metaKey", "Win"],
];

export function formatBindingParts(binding) {
  if (!binding) return [];
  const parts = MODIFIER_LABELS.filter(([key]) => binding[key]).map(([, label]) => label);
  parts.push(labelForCode(binding.code));
  return parts;
}

export function formatBinding(binding) {
  return formatBindingParts(binding).join(" + ");
}

export function getEventCombo(event) {
  return {
    code: event.code,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
  };
}

export function matchesCombo(binding, combo) {
  if (!binding || !combo) return false;
  return (
    binding.code === combo.code &&
    Boolean(binding.ctrlKey) === Boolean(combo.ctrlKey) &&
    Boolean(binding.altKey) === Boolean(combo.altKey) &&
    Boolean(binding.shiftKey) === Boolean(combo.shiftKey) &&
    Boolean(binding.metaKey) === Boolean(combo.metaKey)
  );
}

export function bindingKey(binding) {
  if (!binding || !binding.code) return "";
  return [
    binding.code,
    binding.ctrlKey ? 1 : 0,
    binding.altKey ? 1 : 0,
    binding.shiftKey ? 1 : 0,
    binding.metaKey ? 1 : 0,
  ].join("|");
}

// Shared guard: never let a global shortcut interfere with normal typing.
const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function isEditableTarget(target) {
  if (!target || typeof target !== "object") return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return Boolean(tag && EDITABLE_TAGS.has(tag));
}

// Reserved browser/OS bindings. Phase 1 only reads this to keep the shipped
// defaults safe; Phase 3's customization UI can reuse `isReservedBinding` to
// reject a user's proposed override.
const RAW_RESERVED_BINDINGS = [
  { code: "KeyW", ctrlKey: true, reason: "Close tab" },
  { code: "KeyT", ctrlKey: true, reason: "New tab" },
  { code: "KeyN", ctrlKey: true, reason: "New window" },
  { code: "KeyL", ctrlKey: true, reason: "Focus address bar" },
  { code: "KeyR", ctrlKey: true, reason: "Reload page" },
  { code: "KeyP", ctrlKey: true, reason: "Print" },
  { code: "KeyS", ctrlKey: true, reason: "Save page" },
  { code: "KeyF", ctrlKey: true, reason: "Find in page" },
  { code: "KeyD", ctrlKey: true, reason: "Bookmark page" },
  { code: "KeyT", ctrlKey: true, shiftKey: true, reason: "Reopen closed tab" },
  { code: "KeyN", ctrlKey: true, shiftKey: true, reason: "New private window" },
  { code: "Tab", ctrlKey: true, reason: "Switch tab" },
  { code: "Tab", ctrlKey: true, shiftKey: true, reason: "Switch tab (reverse)" },
  { code: "F5", reason: "Reload page" },
  { code: "F4", altKey: true, reason: "Close window" },
  { code: "F4", ctrlKey: true, reason: "Close tab/document (Chromium)" },
  { code: "F11", reason: "Toggle fullscreen" },
  { code: "F12", reason: "Open devtools" },
];

export const RESERVED_BINDINGS = RAW_RESERVED_BINDINGS.map((entry) => ({
  code: entry.code,
  ctrlKey: Boolean(entry.ctrlKey),
  altKey: Boolean(entry.altKey),
  shiftKey: Boolean(entry.shiftKey),
  metaKey: Boolean(entry.metaKey),
  reason: entry.reason,
}));

const RESERVED_KEY_SET = new Set(RESERVED_BINDINGS.map((entry) => bindingKey(entry)));

export function isReservedBinding(binding) {
  return RESERVED_KEY_SET.has(bindingKey(binding));
}

// Reusable conflict detector. Accepts `{ id, binding }` pairs so Phase 3 can
// run it against *resolved* (post-override) bindings, not just the defaults.
export function findBindingConflicts(entries) {
  const seen = new Map();
  const conflicts = [];

  for (const entry of entries) {
    const key = bindingKey(entry.binding);
    if (!key) continue;

    if (seen.has(key)) {
      conflicts.push({ a: seen.get(key), b: entry.id, binding: entry.binding });
    } else {
      seen.set(key, entry.id);
    }
  }

  return conflicts;
}
