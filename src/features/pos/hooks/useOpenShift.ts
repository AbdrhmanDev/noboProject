import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openPosShift } from "../api/posApi";
import type { OpenShiftRequest } from "../types/pos.types";
import { posQueryKeys } from "./usePosTerminals";

type UseOpenShiftArgs = {
  companyId: string;
  branchId: string;
  posTerminalId: string;
};

export function useOpenShift({
  companyId,
  branchId,
  posTerminalId,
}: UseOpenShiftArgs) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OpenShiftRequest) =>
      openPosShift(companyId, branchId, posTerminalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: posQueryKeys.terminals(companyId, branchId),
      });
      queryClient.invalidateQueries({
        queryKey: posQueryKeys.openShift(companyId, branchId, posTerminalId),
      });
      queryClient.invalidateQueries({
        queryKey: posQueryKeys.terminal(companyId, branchId, posTerminalId),
      });
    },
  });
}
