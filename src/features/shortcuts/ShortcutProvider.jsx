import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../companies/context/CompanyContext";
import { hasEffectivePermission, useCompanyPermissions } from "../companies/hooks/useCompanies";
import { SCOPE_PRIORITY, SHORTCUT_REGISTRY, SHORTCUT_SCOPES } from "./registry";
import { getEventCombo, isEditableTarget, matchesCombo } from "./keyUtils";
import { ShortcutContext } from "./shortcutContext";

// Serializable, frontend-only preference shape. Nothing here is persisted in
// Phase 1/2 (resets on reload) — the shape is what a future backend
// preferences payload would look like:
//   { enabled: true, overrides: { "navigation.inventory": { enabled, binding } } }
const DEFAULT_PREFERENCES = {
  enabled: true,
  overrides: {},
};

// default binding -> user override -> disabled. This is the one place that
// merges those three layers into what the UI/dispatcher actually use.
function resolveEntry(entry, preferences, hasAccess) {
  const override = preferences.overrides[entry.id];
  const resolvedBinding = override?.binding ?? entry.defaultBinding;
  const overrideEnabled = override?.enabled;
  const enabled =
    preferences.enabled &&
    (overrideEnabled === undefined ? entry.enabledByDefault : overrideEnabled) &&
    hasAccess;

  return {
    ...entry,
    binding: resolvedBinding,
    hasAccess,
    enabled,
  };
}

export function ShortcutProvider({ children }) {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const permissionsQuery = useCompanyPermissions(currentCompanyId);
  const effectivePermissions = permissionsQuery.data;

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const scopesRef = useRef([]);

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);

  // Unused by any UI in Phase 1/2 — present so Phase 3's Settings screen can
  // start calling them without touching the resolver/dispatcher below.
  const setGlobalEnabled = useCallback((enabled) => {
    setPreferences((prev) => ({ ...prev, enabled }));
  }, []);

  const setOverride = useCallback((actionId, override) => {
    setPreferences((prev) => ({
      ...prev,
      overrides: { ...prev.overrides, [actionId]: { ...prev.overrides[actionId], ...override } },
    }));
  }, []);

  const clearOverride = useCallback((actionId) => {
    setPreferences((prev) => {
      const overrides = { ...prev.overrides };
      delete overrides[actionId];
      return { ...prev, overrides };
    });
  }, []);

  const resolvedShortcuts = useMemo(() => {
    return SHORTCUT_REGISTRY.map((entry) => {
      const hasAccess =
        entry.permission === null
          ? true
          : Boolean(currentCompanyId) && hasEffectivePermission(effectivePermissions, entry.permission);
      return resolveEntry(entry, preferences, hasAccess);
    });
  }, [currentCompanyId, effectivePermissions, preferences]);

  const resolvedById = useMemo(() => {
    const map = new Map();
    resolvedShortcuts.forEach((shortcut) => map.set(shortcut.id, shortcut));
    return map;
  }, [resolvedShortcuts]);

  const getShortcut = useCallback((actionId) => resolvedById.get(actionId), [resolvedById]);

  // Future/POS Modal/Page scopes register here; higher-priority scopes are
  // checked first by the dispatcher below, so an open modal can claim a key
  // combo (e.g. Escape) without a global/page binding ever seeing it.
  const registerScope = useCallback((scopeEntry) => {
    scopesRef.current = [...scopesRef.current, scopeEntry];
    return () => {
      scopesRef.current = scopesRef.current.filter((entry) => entry !== scopeEntry);
    };
  }, []);

  const runAction = useCallback(
    (shortcut) => {
      if (shortcut.action.type === "navigate") {
        navigate(shortcut.action.to);
      } else if (shortcut.action.type === "openShortcutHelp") {
        openHelp();
      }
    },
    [navigate, openHelp],
  );

  // ONE window listener for the whole app (item 16) instead of one per nav
  // item/page, so there is nothing to leak and nothing to double-fire.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.defaultPrevented) return;

      const combo = getEventCombo(event);
      const editable = isEditableTarget(event.target);
      const activeScopes = [...scopesRef.current].sort((a, b) => b.priority - a.priority);
      const topPriority = activeScopes.length
        ? activeScopes[0].priority
        : SCOPE_PRIORITY[SHORTCUT_SCOPES.GLOBAL];
      // Same-priority scopes (e.g. a dialog's own bindings layered on top of
      // the shared PosModal Escape binding) are tried most-recently-mounted
      // first; every one of them binds a disjoint key set by convention, so
      // order only matters as a tiebreaker, never for correctness.
      const topScopes = activeScopes.filter((scope) => scope.priority === topPriority).reverse();

      for (const scope of topScopes) {
        const match = scope.bindings?.find((entry) => matchesCombo(entry.binding, combo));
        if (!match) continue;
        // Typing in a field blocks every shortcut by default — the shared
        // guard — except a binding that opts in via `allowInEditable`
        // (reserved for genuine "submit" combos like Ctrl+Enter, which can't
        // be produced by normal typing and are meant to fire while the
        // field the cashier just typed into still has focus).
        if (editable && !match.allowInEditable) continue;
        event.preventDefault();
        match.onTrigger(event);
        return;
      }

      if (editable) return;

      // An open modal owns the keyboard exclusively: keys it doesn't bind
      // fall through to nothing, not to the page or the global registry
      // underneath it (so Ctrl+Alt+P can't navigate away out from under an
      // open Payment modal, for example).
      const modalActive = activeScopes.some(
        (scope) => scope.priority === SCOPE_PRIORITY[SHORTCUT_SCOPES.MODAL],
      );
      if (modalActive) return;

      const globalMatch = resolvedShortcuts.find(
        (shortcut) =>
          shortcut.scope === SHORTCUT_SCOPES.GLOBAL &&
          shortcut.enabled &&
          matchesCombo(shortcut.binding, combo),
      );

      if (globalMatch) {
        event.preventDefault();
        runAction(globalMatch);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvedShortcuts, runAction]);

  const value = useMemo(
    () => ({
      shortcuts: resolvedShortcuts,
      getShortcut,
      isHelpOpen,
      openHelp,
      closeHelp,
      preferences,
      setGlobalEnabled,
      setOverride,
      clearOverride,
      registerScope,
    }),
    [
      resolvedShortcuts,
      getShortcut,
      isHelpOpen,
      openHelp,
      closeHelp,
      preferences,
      setGlobalEnabled,
      setOverride,
      clearOverride,
      registerScope,
    ],
  );

  return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>;
}
