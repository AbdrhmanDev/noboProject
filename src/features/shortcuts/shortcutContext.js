import { createContext } from "react";

// Plain context object, kept in its own file (no component, no hooks) so
// both the Provider and the hook-only module below can import it without
// tripping react-refresh/only-export-components in either direction.
export const ShortcutContext = createContext(null);
