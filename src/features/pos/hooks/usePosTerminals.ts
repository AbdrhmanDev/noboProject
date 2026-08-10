import { useQuery } from "@tanstack/react-query";
import { getPosTerminalDetails, getPosTerminals } from "../api/posApi";

export const posQueryKeys = {
  all: ["pos"] as const,
  terminals: (companyId: string, branchId: string) =>
    ["pos", "terminals", companyId, branchId] as const,
  terminal: (companyId: string, branchId: string, posTerminalId: string) =>
    ["pos", "terminal", companyId, branchId, posTerminalId] as const,
  openShift: (companyId: string, branchId: string, posTerminalId: string) =>
    ["pos", "open-shift", companyId, branchId, posTerminalId] as const,
};

export function isTerminalEnterable(status: string) {
  return status === "Active";
}

export function usePosTerminals(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: posQueryKeys.terminals(companyId || "", branchId || ""),
    queryFn: () => getPosTerminals(companyId as string, branchId as string),
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
