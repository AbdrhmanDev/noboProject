import { useShortcut } from "../useShortcuts";
import { formatBinding, formatBindingParts } from "../keyUtils";

// <ShortcutHint action="navigation.inventory" /> — resolves the shortcut's
// current effective binding itself (default today, user override later) and
// renders nothing if that action has no binding, is disabled, or the current
// user has no access to it.
export function ShortcutHint({ action, className = "" }) {
  const shortcut = useShortcut(action);
  if (!shortcut || !shortcut.enabled) return null;

  const parts = formatBindingParts(shortcut.binding);
  if (!parts.length) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 ${className}`}
      title={formatBinding(shortcut.binding)}
      aria-hidden="true"
    >
      {parts.map((part, index) => (
        <kbd
          key={index}
          className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] font-medium leading-none text-slate-500"
        >
          {part}
        </kbd>
      ))}
    </span>
  );
}
