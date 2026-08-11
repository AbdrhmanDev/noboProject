import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRestaurantSeating } from "../api/restaurantSeatingApi";

export const restaurantSeatingQueryKeys = {
  all: ["restaurant-seating"] as const,
  list: (companyId: string, branchId: string) =>
    ["restaurant-seating", companyId, branchId] as const,
};

export function useRestaurantSeating(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: restaurantSeatingQueryKeys.list(companyId || "", branchId || ""),
    queryFn: () => getRestaurantSeating(companyId as string, branchId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useInvalidateRestaurantSeating() {
  const queryClient = useQueryClient();

  return (companyId: string | null | undefined, branchId: string | null | undefined) => {
    if (!companyId || !branchId) return;

    queryClient.invalidateQueries({
      queryKey: restaurantSeatingQueryKeys.list(companyId, branchId),
    });
  };
}
