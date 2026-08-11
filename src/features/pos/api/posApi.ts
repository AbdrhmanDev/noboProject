import { httpClient } from "../../../shared/api/httpClient";
import type { ApiError } from "../../../shared/api/apiError";
import type {
  ClosePosShiftRequest,
  ClosePosShiftResponse,
  CreateManualPosCashMovementRequest,
  CreatePosTerminalRequest,
  OpenPosShift,
  OpenShiftRequest,
  OpenShiftResponse,
  PosCashMovementResponse,
  PosPagedResponse,
  PosShiftDetails,
  PosShiftHistoryFilters,
  PosShiftHistoryListItem,
  PosTerminal,
  PosTerminalFilters,
  PosTerminalResponse,
  UpdatePosTerminalRequest,
} from "../types/pos.types";

function terminalBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/pos/terminals`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getPosTerminals(
  companyId: string,
  branchId: string,
  filters: PosTerminalFilters = {},
) {
  const response = await httpClient.get<PosTerminal[]>(
    terminalBaseUrl(companyId, branchId),
    {
      params: compactParams(filters),
    },
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

export async function createPosTerminal(
  companyId: string,
  branchId: string,
  payload: CreatePosTerminalRequest,
) {
  const response = await httpClient.post<PosTerminalResponse>(
    terminalBaseUrl(companyId, branchId),
    payload,
  );

  return response.data;
}

export async function updatePosTerminal(
  companyId: string,
  branchId: string,
  posTerminalId: string,
  payload: UpdatePosTerminalRequest,
) {
  const response = await httpClient.put<PosTerminalResponse>(
    `${terminalBaseUrl(companyId, branchId)}/${posTerminalId}`,
    payload,
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

function createCashMovementIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cash-movement-${crypto.randomUUID()}`;
  }

  return `cash-movement-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function createManualPosCashMovement(
  companyId: string,
  branchId: string,
  posShiftId: string,
  payload: CreateManualPosCashMovementRequest,
) {
  const response = await httpClient.post<PosCashMovementResponse>(
    `/api/companies/${companyId}/branches/${branchId}/pos/shifts/${posShiftId}/cash-movements`,
    payload,
    {
      headers: {
        "Idempotency-Key": createCashMovementIdempotencyKey(),
      },
    },
  );

  return response.data;
}

export async function closePosShift(
  companyId: string,
  branchId: string,
  posShiftId: string,
  payload: ClosePosShiftRequest,
) {
  const response = await httpClient.post<ClosePosShiftResponse>(
    `/api/companies/${companyId}/branches/${branchId}/pos/shifts/${posShiftId}/close`,
    payload,
  );

  return response.data;
}

export async function getPosShifts(
  companyId: string,
  branchId: string,
  filters: PosShiftHistoryFilters = {},
) {
  const response = await httpClient.get<PosPagedResponse<PosShiftHistoryListItem>>(
    `/api/companies/${companyId}/branches/${branchId}/pos/shifts`,
    {
      params: compactParams(filters),
    },
  );

  return response.data;
}

export async function getPosShiftDetails(
  companyId: string,
  branchId: string,
  posShiftId: string,
) {
  const response = await httpClient.get<PosShiftDetails>(
    `/api/companies/${companyId}/branches/${branchId}/pos/shifts/${posShiftId}`,
  );

  return response.data;
}
