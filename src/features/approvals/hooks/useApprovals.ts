import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidatePaymentState } from "../../payments/hooks/usePayments";
import { draftSalesOrderQueryKeys } from "../../sales-orders/hooks/useDraftSalesOrder";
import {
  approveSalesOrderDiscount,
  approveSalesOrderPaymentRefund,
  getApprovalRequests,
  getSalesOrderDiscountApproval,
  getSalesOrderPaymentRefundApproval,
} from "../api/approvalsApi";

export const approvalQueryKeys = {
  discount: (companyId: string, approvalRequestId: string) =>
    ["approvals", companyId, "discount", approvalRequestId] as const,
  refund: (companyId: string, approvalRequestId: string) =>
    ["approvals", companyId, "refund", approvalRequestId] as const,
  // Deliberately does NOT include page/pageSize -- this is the prefix used to invalidate every
  // page of a given filter set at once (e.g. after an approval, the whole Pending inbox for this
  // company+action needs refetching, not just whichever page happened to be open).
  list: (companyId: string, actionCode: string, status: string) =>
    ["approvals", companyId, "list", actionCode, status] as const,
};

export type ApprovalRequestListParams = {
  actionCode: string;
  status: string;
  page: number;
  pageSize: number;
};

// companyId is part of the query key (via approvalQueryKeys.list) -- switching companies always
// produces a distinct cache entry, never a stale re-read of the previous company's inbox.
export function useApprovalRequestsList(
  companyId: string | null | undefined,
  params: ApprovalRequestListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...approvalQueryKeys.list(companyId || "", params.actionCode, params.status),
      params.page,
      params.pageSize,
    ],
    queryFn: () => getApprovalRequests(companyId as string, params),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useSalesOrderPaymentRefundApproval(
  companyId: string | null | undefined,
  approvalRequestId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: approvalQueryKeys.refund(companyId || "", approvalRequestId || ""),
    queryFn: () =>
      getSalesOrderPaymentRefundApproval(companyId as string, approvalRequestId as string),
    enabled: Boolean(companyId) && Boolean(approvalRequestId) && enabled,
  });
}

// Approving here always means "approve AND execute the refund" -- the backend performs both in
// one operation (Refund Approval Integration), so on success this refreshes the same payment/order
// query state a direct refund would.
export function useApproveSalesOrderPaymentRefund(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
  posTerminalId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      approvalRequestId,
      pin,
    }: {
      approvalRequestId: string;
      pin: string;
    }) => approveSalesOrderPaymentRefund(companyId as string, approvalRequestId, pin),
    onSuccess: () => {
      invalidatePaymentState(queryClient, companyId, branchId, salesOrderId, posTerminalId);
    },
  });
}

// Inbox rows and the selected detail share ONE query key, so each request is fetched once and
// deduplicated (global staleTime is 5 minutes). `alwaysRefetchOnMount` is used only by the detail
// panel: opening a request re-validates it against the server (one extra request per open) so a
// request decided elsewhere is never shown as actionable from a cached row.
export function useSalesOrderDiscountApproval(
  companyId: string | null | undefined,
  approvalRequestId: string | null | undefined,
  enabled = true,
  alwaysRefetchOnMount = false,
) {
  return useQuery({
    queryKey: approvalQueryKeys.discount(companyId || "", approvalRequestId || ""),
    queryFn: () => getSalesOrderDiscountApproval(companyId as string, approvalRequestId as string),
    enabled: Boolean(companyId) && Boolean(approvalRequestId) && enabled,
    refetchOnMount: alwaysRefetchOnMount ? "always" : true,
  });
}

// Approving means "approve AND apply the discount" -- one backend operation. On success the
// affected draft/order state and every approvals view for this company are refetched from the
// server (never optimistic).
export function useApproveSalesOrderDiscount(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ approvalRequestId, pin }: { approvalRequestId: string; pin: string }) =>
      approveSalesOrderDiscount(companyId as string, approvalRequestId, pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftSalesOrderQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["approvals", companyId || ""] });
    },
  });
}
