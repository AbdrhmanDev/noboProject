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

export type PosTerminalResponse = Omit<PosTerminal, "openShift">;

export type PosTerminalFilters = {
  status?: PosTerminalStatus | "";
  search?: string;
};

export type CreatePosTerminalRequest = {
  code: string;
  name: string;
};

export type UpdatePosTerminalRequest = {
  code: string;
  name: string;
  status: PosTerminalStatus;
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

export type PosCashMovementType = "CashPayment" | "CashRefund" | "CashIn" | "CashOut";

export type PosShiftCashMovement = {
  id: string;
  type: PosCashMovementType;
  amountDelta: number;
  reason: string | null;
  sourceSalesOrderPaymentId: string | null;
  sourceSalesOrderPaymentRefundId: string | null;
  createdByUserId: string;
  createdAtUtc: string;
};

export type PosShiftPaymentMethodSettlement = {
  paymentMethodId: string;
  code: string;
  name: string;
  kind: string;
  grossPaidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
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
  cashMovements: PosShiftCashMovement[];
  paymentMethods: PosShiftPaymentMethodSettlement[];
};

export type ManualPosCashMovementType = "CashIn" | "CashOut";

export type CreateManualPosCashMovementRequest = {
  type: ManualPosCashMovementType;
  amount: number;
  reason: string;
};

export type PosCashMovementResponse = {
  posCashMovementId: string;
  posShiftId: string;
  type: ManualPosCashMovementType;
  amountDelta: number;
  reason: string;
  createdByUserId: string;
  createdAtUtc: string;
  expectedCashAmount: number;
  wasAlreadyProcessed: boolean;
};

export type ClosePosShiftRequest = {
  countedCashAmount: number;
  closingNote: string | null;
};

export type ClosePosShiftResponse = {
  posShiftId: string;
  status: "Closed";
  expectedCashAmountAtClose: number;
  countedCashAmount: number;
  cashVarianceAmount: number;
  closingNote: string | null;
  closedByUserId: string;
  closedAtUtc: string;
  wasAlreadyClosed: boolean;
};

export type PosShiftStatus = "Open" | "Closed";

export type PosPagedResponse<T> = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: T[];
};

export type PosShiftHistoryFilters = {
  posTerminalId?: string;
  status?: PosShiftStatus | "";
  openedFromUtc?: string;
  openedToUtc?: string;
  openedByUserId?: string;
  closedFromUtc?: string;
  closedToUtc?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type PosShiftHistoryListItem = {
  posShiftId: string;
  companyId: string;
  branchId: string;
  posTerminalId: string;
  terminalCode: string;
  terminalName: string;
  status: PosShiftStatus;
  currencyCode: string;
  currencyMinorUnitDigits: number;
  openingFloatAmount: number;
  openedByUserId: string;
  openedAtUtc: string;
  closedByUserId: string | null;
  closedAtUtc: string | null;
  expectedCashAmount: number;
  expectedCashAmountAtClose: number | null;
  countedCashAmount: number | null;
  cashVarianceAmount: number | null;
  cashMovementCount: number;
};

export type PosShiftDetails = OpenPosShift;
