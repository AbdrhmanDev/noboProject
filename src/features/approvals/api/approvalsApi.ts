import { httpClient } from "../../../shared/api/httpClient";
import type {
  ApproveSalesOrderDiscountResponse,
  ApproveSalesOrderPaymentRefundResponse,
  PagedApprovalRequestList,
  SalesOrderDiscountApprovalDetails,
  SalesOrderPaymentRefundApprovalDetails,
} from "../types/approval.types";

function approvalsUrl(companyId: string) {
  return `/api/companies/${companyId}/approvals`;
}

export type GetApprovalRequestsParams = {
  actionCode: string;
  status: string;
  page: number;
  pageSize: number;
};

export async function getApprovalRequests(companyId: string, params: GetApprovalRequestsParams) {
  const response = await httpClient.get<PagedApprovalRequestList>(approvalsUrl(companyId), {
    params: {
      actionCode: params.actionCode,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize,
    },
  });

  return response.data;
}

export async function getSalesOrderPaymentRefundApproval(
  companyId: string,
  approvalRequestId: string,
) {
  const response = await httpClient.get<SalesOrderPaymentRefundApprovalDetails>(
    `${approvalsUrl(companyId)}/${approvalRequestId}/refund`,
  );

  return response.data;
}

// PIN travels in the request body only -- never logged, never stored, never echoed back by the
// backend (the response never carries it either).
export async function approveSalesOrderPaymentRefund(
  companyId: string,
  approvalRequestId: string,
  pin: string,
) {
  const response = await httpClient.post<ApproveSalesOrderPaymentRefundResponse>(
    `${approvalsUrl(companyId)}/${approvalRequestId}/approve-refund`,
    { pin },
  );

  return response.data;
}

export async function getSalesOrderDiscountApproval(companyId: string, approvalRequestId: string) {
  const response = await httpClient.get<SalesOrderDiscountApprovalDetails>(
    `${approvalsUrl(companyId)}/${approvalRequestId}/discount`,
  );

  return response.data;
}

// PIN travels in the request body only -- never logged, stored, or echoed back.
export async function approveSalesOrderDiscount(
  companyId: string,
  approvalRequestId: string,
  pin: string,
) {
  const response = await httpClient.post<ApproveSalesOrderDiscountResponse>(
    `${approvalsUrl(companyId)}/${approvalRequestId}/approve-discount`,
    { pin },
  );

  return response.data;
}
