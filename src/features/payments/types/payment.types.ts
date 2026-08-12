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
