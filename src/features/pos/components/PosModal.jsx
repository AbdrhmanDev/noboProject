import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { SCOPE_PRIORITY, SHORTCUT_SCOPES } from "../../shortcuts/registry";
import { useShortcutScope } from "../../shortcuts/useShortcuts";

export function PosModal({ title, children, onClose, size = "md" }) {
  const sizes = {
    md: "max-w-md",
    lg: "max-w-2xl",
  };

  // Escape-closes-this-dialog for every POS dialog built on PosModal, wired
  // once here instead of duplicated in each dialog's own content component.
  const bindings = useMemo(
    () => [{ binding: { code: "Escape" }, onTrigger: onClose }],
    [onClose],
  );
  useShortcutScope({ id: "pos-modal", priority: SCOPE_PRIORITY[SHORTCUT_SCOPES.MODAL], bindings });

  // Restore focus to whatever triggered this dialog (the button that was
  // clicked, or wherever focus happened to be for a keyboard-opened one)
  // once it closes, instead of leaving focus on <body> after the dialog's
  // DOM unmounts.
  //
  // Deferred and guarded rather than restoring unconditionally: when this
  // dialog is being *replaced* by another one in the same update (Variant
  // selection opening Modifiers is exactly this — two separate PosModal
  // instances, so it's a real unmount+mount, not an update), the new
  // dialog's own auto-focus-first-item is a layout effect and always runs
  // before this cleanup (a passive effect) does. By deferring the actual
  // restore to a macrotask and only acting if focus is still sitting on
  // <body> at that point, a genuine close (nothing else claimed focus)
  // still restores correctly, while a dialog-to-dialog transition (the new
  // dialog already focused its first item) correctly leaves it alone.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    return () => {
      window.setTimeout(() => {
        if (
          document.activeElement === document.body &&
          previouslyFocused instanceof HTMLElement &&
          document.body.contains(previouslyFocused)
        ) {
          previouslyFocused.focus();
        }
      }, 0);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#030713]/75 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#10182a] p-5 shadow-2xl ${sizes[size]}`}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto pr-1 scrollbar-none">{children}</div>
      </div>
    </div>
  );
}
