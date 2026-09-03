import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEdgeAgent,
  getEdgeAgentDetails,
  getEdgeAgents,
  issueEdgeAgentEnrollment,
  updateEdgeAgentStatus,
} from "../api/edgeAgentsApi";
import type {
  CreateEdgeAgentRequest,
  EdgeAgentsListFilters,
  UpdateEdgeAgentStatusRequest,
} from "../types/devices.types";

export const edgeAgentQueryKeys = {
  all: ["devices", "edge-agents"] as const,
  list: (companyId: string, branchId: string, filters: EdgeAgentsListFilters = {}) =>
    ["devices", "edge-agents", companyId, branchId, filters] as const,
  details: (companyId: string, branchId: string, edgeAgentId: string) =>
    ["devices", "edge-agents", companyId, branchId, "detail", edgeAgentId] as const,
};

function invalidateEdgeAgents(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  edgeAgentId?: string | null,
) {
  if (!companyId || !branchId) return;

  queryClient.invalidateQueries({ queryKey: ["devices", "edge-agents", companyId, branchId] });

  if (edgeAgentId) {
    queryClient.invalidateQueries({
      queryKey: edgeAgentQueryKeys.details(companyId, branchId, edgeAgentId),
    });
  }
}

export function useEdgeAgents(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: EdgeAgentsListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: edgeAgentQueryKeys.list(companyId || "", branchId || "", filters),
    queryFn: () => getEdgeAgents(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useEdgeAgentDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  edgeAgentId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: edgeAgentQueryKeys.details(companyId || "", branchId || "", edgeAgentId || ""),
    queryFn: () =>
      getEdgeAgentDetails(companyId as string, branchId as string, edgeAgentId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(edgeAgentId) && enabled,
  });
}

export function useCreateEdgeAgent(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEdgeAgentRequest) =>
      createEdgeAgent(companyId as string, branchId as string, payload),
    onSuccess: () => invalidateEdgeAgents(queryClient, companyId, branchId),
  });
}

// Result is a one-time secret — the caller must hold it in React state only
// (for the EnrollmentCredentialDialog) and never persist it to storage.
//
// edgeAgentId is passed to mutateAsync(edgeAgentId) rather than bound at the
// hook call site: a caller that just created the agent (e.g.
// EdgeAgentsListPage) only learns the id from the create response and calls
// mutateAsync in the same handler — binding it via the hook's own render-time
// argument would close over the pre-update state value (still null/undefined)
// since the setState that stores it hasn't re-rendered yet.
export function useIssueEdgeAgentEnrollment(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (edgeAgentId: string) =>
      issueEdgeAgentEnrollment(companyId as string, branchId as string, edgeAgentId),
    onSuccess: (_data, edgeAgentId) => invalidateEdgeAgents(queryClient, companyId, branchId, edgeAgentId),
  });
}

export function useUpdateEdgeAgentStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  edgeAgentId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEdgeAgentStatusRequest) =>
      updateEdgeAgentStatus(
        companyId as string,
        branchId as string,
        edgeAgentId as string,
        payload,
      ),
    onSuccess: () => invalidateEdgeAgents(queryClient, companyId, branchId, edgeAgentId),
  });
}
