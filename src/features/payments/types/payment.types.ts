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
