export type PaymentMethodKind = "Cash" | "Card" | "BankTransfer" | "Other";

export type PaymentMethodAdminStatus = "Active" | "Suspended";

export type PaymentMethodAdminFilters = {
  status?: PaymentMethodAdminStatus | "";
  kind?: PaymentMethodKind | "";
  search?: string;
};

export type ActivePaymentMethod = {
  paymentMethodId: string;
  companyId: string;
  code: string;
  name: string;
  kind: PaymentMethodKind;
  sortOrder: number;
};

export type PaymentMethodAdmin = ActivePaymentMethod & {
  status: PaymentMethodAdminStatus;
  isActive: boolean;
  createdAtUtc: string;
};

export type CreatePaymentMethodRequest = {
  code: string;
  name: string;
  kind: PaymentMethodKind;
  sortOrder: number;
};

export type PaymentMethodResponse = ActivePaymentMethod & {
  isActive: boolean;
  createdAtUtc: string;
};

export type UpdatePaymentMethodRequest = {
  code: string;
  name: string;
  sortOrder: number;
};

export type ChangePaymentMethodStatusRequest = {
  status: PaymentMethodAdminStatus;
};

export type SalesOrderPaymentMethod = {
  id: string;
  code: string;
  name: string;
  kind: PaymentMethodKind;
};

export type ReceiveSalesOrderPaymentRequest = {
  paymentMethodId: string;
  amount: number;
  posShiftId: string | null;
};

export type SalesOrderPaymentResponse = {
  salesOrderPaymentId: string;
  salesOrderId: string;
  paymentMethod: SalesOrderPaymentMethod;
  currencyCode: string;
  currencyMinorUnitDigits: number;
  amount: number;
  posShiftId: string | null;
  receivedByUserId: string;
  receivedAtUtc: string;
  grossPaidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  wasAlreadyProcessed: boolean;
};

export type RefundSalesOrderPaymentRequest = {
  amount: number;
  posShiftId: string | null;
  reason: string;
};

export type SalesOrderPaymentRefundResponse = {
  salesOrderPaymentRefundId: string;
  salesOrderPaymentId: string;
  salesOrderId: string;
  amount: number;
  posShiftId: string | null;
  reason: string;
  refundedByUserId: string;
  refundedAtUtc: string;
  paymentAmount: number;
  paymentRefundedAmount: number;
  paymentRefundableAmount: number;
  grossPaidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
  remainingAmount: number;
  wasAlreadyProcessed: boolean;
};

// Refund Approval Integration: the refund submission endpoint no longer always returns a refund
// directly -- when the caller lacks direct refund authority and the company's approval policy
// applies, it instead returns a Pending approval reference. Both branches must be handled
// explicitly; never assume "Refunded".
export type PendingRefundApprovalResult = {
  approvalRequestId: string;
  status: string;
  expiresAtUtc: string;
  amount: number;
  currencyCode: string;
};

export type RefundOrApprovalResponse =
  | { outcome: "Refunded"; refund: SalesOrderPaymentRefundResponse; approval: null }
  | { outcome: "ApprovalRequired"; refund: null; approval: PendingRefundApprovalResult };

export type SalesOrderPaymentRefundHistoryItem = {
  salesOrderPaymentRefundId: string;
  amount: number;
  reason: string;
  refundedByUserId: string;
  refundedAtUtc: string;
};

export type SalesOrderPaymentHistoryItem = {
  salesOrderPaymentId: string;
  paymentMethod: SalesOrderPaymentMethod;
  currencyCode: string;
  currencyMinorUnitDigits: number;
  amount: number;
  refundedAmount: number;
  refundableAmount: number;
  receivedByUserId: string;
  receivedAtUtc: string;
  refunds: SalesOrderPaymentRefundHistoryItem[];
};

export type SalesOrderPaymentHistory = {
  salesOrderId: string;
  currencyCode: string;
  currencyMinorUnitDigits: number;
  payableAmount: number;
  grossPaidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  payments: SalesOrderPaymentHistoryItem[];
};

// ---- P9.1: receipt printing ----
// Mirrors Nobo.Api.Sales.SalesOrders.SalesOrderEndpointContracts.CustomerReceiptResponse. Only the
// top-level fields the print UI actually needs are typed in full; Lines/Payments are the source
// data for the backend's own rendering pipeline (Invoice -> Effective Template -> RenderedDocument
// -> PrintJob -> Printer) and are never rendered independently here -- kept as unknown[] on
// purpose, not omitted, so the shape stays honest about what the response actually contains.
export type CustomerReceiptResponse = {
  customerReceiptId: string;
  receiptNumber: number;
  receiptNumberFormatted: string;
  companyId: string;
  branchId: string;
  salesOrderId: string;
  salesOrderNumber: number;
  salesOrderNumberFormatted: string;
  customerId: string | null;
  issuedByUserId: string;
  issuedAtUtc: string;
  posShiftId: string | null;
  posTerminalId: string | null;
  posTerminalCode: string | null;
  posTerminalName: string | null;
  currencyCode: string;
  currencyMinorUnitDigits: number;
  payableAmount: number;
  grossPaidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
  lines: unknown[];
  payments: unknown[];
};

// POST .../sales-orders/receipts/{customerReceiptId}/print -- DeviceId is always explicit; the
// manual-print endpoint has no "resolve it for me" mode (that only exists internally, for
// auto-print). The frontend must therefore already know which device to send, typically the
// branch's single active ReceiptPrinter (see features/devices' branch-routing status).
export type PrintCustomerReceiptRequest = {
  deviceId: string;
};

export type PrintCustomerReceiptResponse = {
  printJobId: string;
  customerReceiptId: string;
  documentId: string;
  documentType: string;
  status: string;
  createdAtUtc: string;
  wasAlreadyProcessed: boolean;
};
