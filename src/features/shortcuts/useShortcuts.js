import { useContext, useEffect } from "react";
import { SCOPE_PRIORITY, SHORTCUT_SCOPES } from "./registry";
import { ShortcutContext } from "./shortcutContext";

export function useShortcutContext() {
  const ctx = useContext(ShortcutContext);
  if (!ctx) throw new Error("useShortcutContext must be used within a ShortcutProvider");
  return ctx;
}

export function useShortcut(actionId) {
  const { getShortcut } = useShortcutContext();
  return getShortcut(actionId);
}

// The API a Page/Modal scope uses to register higher-priority bindings
// without touching the dispatcher in ShortcutProvider.jsx. `bindings` should
// be memoized by the caller (e.g. useMemo keyed on the closures it embeds) —
// a fresh array every render would tear the scope down and re-register it on
// every keystroke.
//
// bindings: Array<{ binding: {code, ctrlKey?, altKey?, shiftKey?, metaKey?},
//                    onTrigger: (event) => void,
//                    allowInEditable?: boolean }>
export function useShortcutScope({
  id,
  priority = SCOPE_PRIORITY[SHORTCUT_SCOPES.PAGE],
  bindings = [],
  active = true,
}) {
  const { registerScope } = useShortcutContext();

  useEffect(() => {
    if (!active) return undefined;
    return registerScope({ id, priority, bindings });
  }, [registerScope, id, priority, active, bindings]);
}
