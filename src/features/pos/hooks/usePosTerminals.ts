import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPosTerminal,
  getPosShiftDetails,
  getPosShifts,
  getPosTerminalDetails,
  getPosTerminals,
  updatePosTerminal,
} from "../api/posApi";
import type {
  CreatePosTerminalRequest,
  PosShiftHistoryFilters,
  PosTerminalFilters,
  UpdatePosTerminalRequest,
} from "../types/pos.types";

export const posQueryKeys = {
  all: ["pos"] as const,
  terminals: (
    companyId: string,
    branchId: string,
    filters: PosTerminalFilters = {},
  ) => ["pos", "terminals", companyId, branchId, filters] as const,
  terminal: (companyId: string, branchId: string, posTerminalId: string) =>
    ["pos", "terminal", companyId, branchId, posTerminalId] as const,
  openShift: (companyId: string, branchId: string, posTerminalId: string) =>
    ["pos", "open-shift", companyId, branchId, posTerminalId] as const,
  shifts: (
    companyId: string,
    branchId: string,
    filters: PosShiftHistoryFilters,
  ) => ["pos", "shifts", companyId, branchId, filters] as const,
  shiftDetails: (companyId: string, branchId: string, posShiftId: string) =>
    ["pos", "shift", companyId, branchId, posShiftId] as const,
};

export function isTerminalEnterable(status: string) {
  return status === "Active";
}

export function usePosTerminals(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
  filters: PosTerminalFilters = {},
) {
  return useQuery({
    queryKey: posQueryKeys.terminals(companyId || "", branchId || "", filters),
    queryFn: () =>
      getPosTerminals(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function usePosTerminalDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  posTerminalId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: posQueryKeys.terminal(
      companyId || "",
      branchId || "",
      posTerminalId || "",
    ),
    queryFn: () =>
      getPosTerminalDetails(
        companyId as string,
        branchId as string,
        posTerminalId as string,
      ),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(posTerminalId) && enabled,
  });
}

export function usePosShifts(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: PosShiftHistoryFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: posQueryKeys.shifts(companyId || "", branchId || "", filters),
    queryFn: () => getPosShifts(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function usePosShiftDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  posShiftId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: posQueryKeys.shiftDetails(
      companyId || "",
      branchId || "",
      posShiftId || "",
    ),
    queryFn: () =>
      getPosShiftDetails(
        companyId as string,
        branchId as string,
        posShiftId as string,
      ),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(posShiftId) && enabled,
  });
}

export function useCreatePosTerminal(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePosTerminalRequest) =>
      createPosTerminal(companyId as string, branchId as string, payload),
    onSuccess: () => {
      if (!companyId || !branchId) return;

      queryClient.invalidateQueries({
        queryKey: ["pos", "terminals", companyId, branchId],
      });
    },
  });
}

export function useUpdatePosTerminal(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  posTerminalId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePosTerminalRequest) =>
      updatePosTerminal(
        companyId as string,
        branchId as string,
        posTerminalId as string,
        payload,
      ),
    onSuccess: () => {
      if (!companyId || !branchId) return;

      queryClient.invalidateQueries({
        queryKey: ["pos", "terminals", companyId, branchId],
      });

      if (posTerminalId) {
        queryClient.invalidateQueries({
          queryKey: posQueryKeys.terminal(companyId, branchId, posTerminalId),
        });
        queryClient.invalidateQueries({
          queryKey: posQueryKeys.openShift(companyId, branchId, posTerminalId),
        });
      }
    },
  });
}
