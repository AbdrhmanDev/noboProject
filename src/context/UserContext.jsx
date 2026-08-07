import { createContext, useContext, useState, useCallback } from "react";
import { loadUser, saveUser, buildAvatar } from "../utils/user";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUserState] = useState(loadUser);

  const updateUser = useCallback((patch) => {
    setUserState((prev) => {
      const next = { ...prev, ...patch };
      // If no custom avatar uploaded, derive from seed
      if (!next.avatarFile && next.avatarSeed) {
        next.avatar = buildAvatar(next.avatarSeed);
      }
      saveUser(next);
      return next;
    });
  }, []);

  const value = { user, updateUser };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
