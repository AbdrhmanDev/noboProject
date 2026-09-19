import type { SalesOrderPaymentRefundResponse } from "../../payments/types/payment.types";

// Approval UX contract (Refund Approval Integration): exactly enough for an approver to decide --
// order/payment reference, amount, currency, reason, requester, branch, created time, expiry --
// nothing sensitive beyond that (no PIN/hash/lockout internals are ever returned by the backend).
export type SalesOrderPaymentRefundApprovalDetails = {
  approvalRequestId: string;
  status: string;
  companyId: string;
  branchId: string;
  salesOrderId: string;
  salesOrderPaymentId: string;
  amount: number;
  currencyCode: string;
  reason: string | null;
  requestedByUserId: string;
  approvedByUserId: string | null;
  createdAtUtc: string;
  decidedAtUtc: string | null;
  expiresAtUtc: string;
};

export type ApproveSalesOrderPaymentRefundResponse = {
  approvalRequestId: string;
  status: string;
  approvedByUserId: string;
  decidedAtUtc: string;
  refund: SalesOrderPaymentRefundResponse;
};

// Manager Pending Approvals Inbox -- lightweight list row. Never includes PIN/hash/lockout or any
// other internal/sensitive field; GET .../approvals/{id}/refund remains authoritative for full
// detail (list data is never trusted as final approval state).
export type ApprovalRequestListItem = {
  approvalRequestId: string;
  actionCode: string;
  status: string;
  requesterId: string;
  requesterDisplayName: string | null;
  salesOrderId: string | null;
  orderReference: string | null;
  branchId: string;
  branchName: string | null;
  amount: number | null;
  currencyCode: string | null;
  reason: string | null;
  createdAtUtc: string;
  expiresAtUtc: string;
};

export type PagedApprovalRequestList = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: ApprovalRequestListItem[];
};

// Discount Approval Integration. estimated* fields are display-only -- the backend recomputes the
// real applied amount from the live order lines at approval time.
export type SalesOrderDiscountApprovalDetails = {
  approvalRequestId: string;
  status: string;
  companyId: string;
  branchId: string;
  salesOrderId: string;
  discountType: string;
  requestedValue: number;
  reason: string;
  estimatedAppliedAmount: number;
  estimatedEffectivePercent: number;
  requestedByUserId: string;
  approvedByUserId: string | null;
  createdAtUtc: string;
  decidedAtUtc: string | null;
  expiresAtUtc: string;
};

export type ApproveSalesOrderDiscountResponse = {
  approvalRequestId: string;
  status: string;
  approvedByUserId: string;
  decidedAtUtc: string;
  discount: {
    salesOrderDiscountId: string;
    discountType: string;
    requestedValue: number;
    appliedAmount: number;
    reason: string;
    netAmount: number;
    taxAmount: number;
    grossAmount: number;
    payableAmount: number;
    draftVersion: number;
  };
};
