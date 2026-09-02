import { httpClient } from "../../../shared/api/httpClient";
import type {
  CreateEdgeAgentRequest,
  EdgeAgentEnrollmentResponse,
  EdgeAgentResponse,
  EdgeAgentsListFilters,
  UpdateEdgeAgentStatusRequest,
} from "../types/devices.types";

function edgeAgentsBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/edge-agents`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getEdgeAgents(
  companyId: string,
  branchId: string,
  filters: EdgeAgentsListFilters = {},
) {
  const response = await httpClient.get<EdgeAgentResponse[]>(
    edgeAgentsBaseUrl(companyId, branchId),
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getEdgeAgentDetails(
  companyId: string,
  branchId: string,
  edgeAgentId: string,
) {
  const response = await httpClient.get<EdgeAgentResponse>(
    `${edgeAgentsBaseUrl(companyId, branchId)}/${edgeAgentId}`,
  );

  return response.data;
}

export async function createEdgeAgent(
  companyId: string,
  branchId: string,
  payload: CreateEdgeAgentRequest,
) {
  const response = await httpClient.post<EdgeAgentResponse>(
    edgeAgentsBaseUrl(companyId, branchId),
    payload,
  );

  return response.data;
}

// One-time secret, 15-minute lifetime, cannot be re-fetched — caller must
// hold the response in React state only, never persist it.
export async function issueEdgeAgentEnrollment(
  companyId: string,
  branchId: string,
  edgeAgentId: string,
) {
  const response = await httpClient.post<EdgeAgentEnrollmentResponse>(
    `${edgeAgentsBaseUrl(companyId, branchId)}/${edgeAgentId}/enrollment`,
  );

  return response.data;
}

export async function updateEdgeAgentStatus(
  companyId: string,
  branchId: string,
  edgeAgentId: string,
  payload: UpdateEdgeAgentStatusRequest,
) {
  const response = await httpClient.put<EdgeAgentResponse>(
    `${edgeAgentsBaseUrl(companyId, branchId)}/${edgeAgentId}/status`,
    payload,
  );

  return response.data;
}
