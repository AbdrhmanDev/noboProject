export type PosTerminalStatus = "Active" | "Suspended";

export type PosShiftSummary = {
  posShiftId: string;
  openedAtUtc: string;
  openedByUserId: string;
  openingFloatAmount: number;
  expectedCashAmount: number;
};

export type PosTerminal = {
  posTerminalId: string;
  branchId: string;
  code: string;
  name: string;
  status: PosTerminalStatus;
  createdAtUtc: string;
  openShift: PosShiftSummary | null;
};

export type OpenShiftRequest = {
  openingFloatAmount: number;
};

export type OpenShiftResponse = {
  posShiftId: string;
  companyId: string;
  branchId: string;
  posTerminalId: string;
  status: "Open";
  currencyCode: string;
  currencyMinorUnitDigits: number;
  openingFloatAmount: number;
  openedByUserId: string;
  openedAtUtc: string;
  expectedCashAmount: number;
  wasAlreadyOpen: boolean;
};

export type OpenPosShift = {
  posShiftId: string;
  posTerminalId: string;
  terminalCode: string;
  terminalName: string;
  status: "Open";
  currencyCode: string;
  currencyMinorUnitDigits: number;
  openingFloatAmount: number;
  openedByUserId: string;
  openedAtUtc: string;
  closedByUserId: string | null;
  closedAtUtc: string | null;
  cashPaymentsAmount: number;
  cashRefundsAmount: number;
  cashInAmount: number;
  cashOutAmount: number;
  expectedCashAmount: number;
  expectedCashAmountAtClose: number | null;
  countedCashAmount: number | null;
  cashVarianceAmount: number | null;
  closingNote: string | null;
  cashMovements: unknown[];
  paymentMethods: unknown[];
};
