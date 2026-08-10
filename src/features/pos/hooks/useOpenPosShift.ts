import { useQuery } from "@tanstack/react-query";
import { getOpenPosShift } from "../api/posApi";
import { posQueryKeys } from "./usePosTerminals";

export function useOpenPosShift(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  posTerminalId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: posQueryKeys.openShift(
      companyId || "",
      branchId || "",
      posTerminalId || "",
    ),
    queryFn: () =>
      getOpenPosShift(
        companyId as string,
        branchId as string,
        posTerminalId as string,
      ),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(posTerminalId) && enabled,
  });
}
