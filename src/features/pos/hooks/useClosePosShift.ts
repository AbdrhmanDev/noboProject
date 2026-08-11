import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closePosShift } from "../api/posApi";
import type { ClosePosShiftRequest } from "../types/pos.types";
import { posQueryKeys } from "./usePosTerminals";

export function useClosePosShift(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  posTerminalId: string | null | undefined,
  posShiftId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClosePosShiftRequest) =>
      closePosShift(
        companyId as string,
        branchId as string,
        posShiftId as string,
        payload,
      ),
    onSuccess: () => {
      if (!companyId || !branchId) return;

      queryClient.invalidateQueries({
        queryKey: posQueryKeys.terminals(companyId, branchId),
      });

      if (posTerminalId) {
        queryClient.invalidateQueries({
          queryKey: posQueryKeys.openShift(companyId, branchId, posTerminalId),
        });
        queryClient.invalidateQueries({
          queryKey: posQueryKeys.terminal(companyId, branchId, posTerminalId),
        });
      }
    },
  });
}
