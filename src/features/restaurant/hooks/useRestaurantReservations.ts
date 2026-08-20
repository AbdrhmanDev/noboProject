import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelRestaurantReservation,
  createRestaurantReservation,
  getRestaurantReservations,
  noShowRestaurantReservation,
  seatRestaurantReservation,
  updateRestaurantReservation,
} from "../api/restaurantFloorOpsApi";
import type {
  CreateRestaurantReservationRequest,
  RestaurantReservationsListFilters,
  SeatRestaurantReservationRequest,
  UpdateRestaurantReservationRequest,
} from "../types/restaurantFloorOps.types";

export const reservationQueryKeys = {
  all: ["restaurant", "reservations"] as const,
  list: (companyId: string, branchId: string, filters: RestaurantReservationsListFilters = {}) =>
    ["restaurant", "reservations", companyId, branchId, filters] as const,
};

export function useRestaurantReservations(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: RestaurantReservationsListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: reservationQueryKeys.list(companyId || "", branchId || "", filters),
    queryFn: () => getRestaurantReservations(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

// A reservation mutation can change table availability (new booking,
// cancel, no-show, seat all affect what floor-state would currently show),
// so every one of these invalidates both caches — never just its own list.
function invalidateReservationsAndFloor(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  if (!companyId || !branchId) return;
  queryClient.invalidateQueries({ queryKey: ["restaurant", "reservations", companyId, branchId] });
  queryClient.invalidateQueries({ queryKey: ["restaurant", "floor-state", companyId, branchId] });
}

export function useCreateRestaurantReservation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRestaurantReservationRequest) =>
      createRestaurantReservation(companyId as string, branchId as string, payload),
    onSuccess: () => invalidateReservationsAndFloor(queryClient, companyId, branchId),
  });
}

export function useUpdateRestaurantReservation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      payload,
    }: {
      reservationId: string;
      payload: UpdateRestaurantReservationRequest;
    }) => updateRestaurantReservation(companyId as string, branchId as string, reservationId, payload),
    onSuccess: () => invalidateReservationsAndFloor(queryClient, companyId, branchId),
  });
}

export function useCancelRestaurantReservation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) =>
      cancelRestaurantReservation(companyId as string, branchId as string, reservationId),
    onSuccess: () => invalidateReservationsAndFloor(queryClient, companyId, branchId),
  });
}

export function useNoShowRestaurantReservation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) =>
      noShowRestaurantReservation(companyId as string, branchId as string, reservationId),
    onSuccess: () => invalidateReservationsAndFloor(queryClient, companyId, branchId),
  });
}

export function useSeatRestaurantReservation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      payload,
    }: {
      reservationId: string;
      payload: SeatRestaurantReservationRequest;
    }) => seatRestaurantReservation(companyId as string, branchId as string, reservationId, payload),
    onSuccess: () => invalidateReservationsAndFloor(queryClient, companyId, branchId),
  });
}
