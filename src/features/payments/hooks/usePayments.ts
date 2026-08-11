import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posQueryKeys } from "../../pos/hooks/usePosTerminals";
import { draftSalesOrderQueryKeys } from "../../sales-orders/hooks/useDraftSalesOrder";
import {
  getActivePaymentMethods,
  getSalesOrderPayments,
  receiveSalesOrderPayment,
  refundSalesOrderPayment,
} from "../api/paymentsApi";
import type {
  ReceiveSalesOrderPaymentRequest,
  RefundSalesOrderPaymentRequest,
} from "../types/payment.types";

export const paymentQueryKeys = {
  all: ["payments"] as const,
  activeMethods: (companyId: string) =>
    ["payments", companyId, "methods", "active"] as const,
  salesOrderPayments: (
    companyId: string,
    branchId: string,
    salesOrderId: string,
  ) => ["payments", companyId, branchId, salesOrderId, "history"] as const,
};

function invalidatePaymentState(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
  posTerminalId: string | null | undefined,
) {
  if (!companyId || !branchId || !salesOrderId) return;

  queryClient.invalidateQueries({
    queryKey: paymentQueryKeys.salesOrderPayments(
      companyId,
      branchId,
      salesOrderId,
    ),
  });
  queryClient.invalidateQueries({
    queryKey: draftSalesOrderQueryKeys.details(companyId, branchId, salesOrderId),
  });

  if (posTerminalId) {
    queryClient.invalidateQueries({
      queryKey: posQueryKeys.openShift(companyId, branchId, posTerminalId),
    });
  }
}

export function useActivePaymentMethods(
  companyId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: paymentQueryKeys.activeMethods(companyId || ""),
    queryFn: () => getActivePaymentMethods(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useSalesOrderPayments(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: paymentQueryKeys.salesOrderPayments(
      companyId || "",
      branchId || "",
      salesOrderId || "",
    ),
    queryFn: () =>
      getSalesOrderPayments(
        companyId as string,
        branchId as string,
        salesOrderId as string,
      ),
    enabled:
      Boolean(companyId) && Boolean(branchId) && Boolean(salesOrderId) && enabled,
  });
}

export function useReceiveSalesOrderPayment(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
  posTerminalId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReceiveSalesOrderPaymentRequest) =>
      receiveSalesOrderPayment(
        companyId as string,
        branchId as string,
        salesOrderId as string,
        payload,
      ),
    onSuccess: () => {
      invalidatePaymentState(
        queryClient,
        companyId,
        branchId,
        salesOrderId,
        posTerminalId,
      );
    },
  });
}

export function useRefundSalesOrderPayment(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
  posTerminalId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      salesOrderPaymentId,
      payload,
    }: {
      salesOrderPaymentId: string;
      payload: RefundSalesOrderPaymentRequest;
    }) =>
      refundSalesOrderPayment(
        companyId as string,
        branchId as string,
        salesOrderId as string,
        salesOrderPaymentId,
        payload,
      ),
    onSuccess: () => {
      invalidatePaymentState(
        queryClient,
        companyId,
        branchId,
        salesOrderId,
        posTerminalId,
      );
    },
  });
}
