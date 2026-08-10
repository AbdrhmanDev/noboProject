import { httpClient } from "../../../shared/api/httpClient";
import type { ApiError } from "../../../shared/api/apiError";
import type {
  OpenPosShift,
  OpenShiftRequest,
  OpenShiftResponse,
  PosTerminal,
} from "../types/pos.types";

function terminalBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/pos/terminals`;
}

export async function getPosTerminals(companyId: string, branchId: string) {
  const response = await httpClient.get<PosTerminal[]>(
    terminalBaseUrl(companyId, branchId),
  );

  return response.data;
}

export async function getPosTerminalDetails(
  companyId: string,
  branchId: string,
  posTerminalId: string,
) {
  const response = await httpClient.get<PosTerminal>(
    `${terminalBaseUrl(companyId, branchId)}/${posTerminalId}`,
  );

  return response.data;
}

export async function getOpenPosShift(
  companyId: string,
  branchId: string,
  posTerminalId: string,
) {
  try {
    const response = await httpClient.get<OpenPosShift>(
      `${terminalBaseUrl(companyId, branchId)}/${posTerminalId}/open-shift`,
    );

    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.status === 404) return null;
    throw error;
  }
}

export async function openPosShift(
  companyId: string,
  branchId: string,
  posTerminalId: string,
  payload: OpenShiftRequest,
) {
  const response = await httpClient.post<OpenShiftResponse>(
    `${terminalBaseUrl(companyId, branchId)}/${posTerminalId}/shifts/open`,
    payload,
  );

  return response.data;
}
