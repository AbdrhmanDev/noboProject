import { useQuery } from "@tanstack/react-query";
import { getCurrentUserProfileApi } from "../api/authApi";
import { useAuth } from "./useAuth";

export const currentUserProfileQueryKey = ["auth", "me"] as const;

// The single real source for "who is currently logged in" display data (name/email) -- used
// wherever the app previously showed a hardcoded/fake identity (sidebar profile footer, POS
// toolbar, My Profile page). Cashier Real Identity task.
export function useCurrentUserProfile() {
  const { status } = useAuth();

  return useQuery({
    queryKey: currentUserProfileQueryKey,
    queryFn: getCurrentUserProfileApi,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });
}
