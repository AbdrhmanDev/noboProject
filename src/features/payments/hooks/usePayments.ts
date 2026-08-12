import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posQueryKeys } from "../../pos/hooks/usePosTerminals";
import { draftSalesOrderQueryKeys } from "../../sales-orders/hooks/useDraftSalesOrder";
import {
  changePaymentMethodStatus,
  createPaymentMethod,
  getActivePaymentMethods,
  getPaymentMethodDetails,
  getPaymentMethods,
  getSalesOrderPayments,
  receiveSalesOrderPayment,
  refundSalesOrderPayment,
  updatePaymentMethod,
} from "../api/paymentsApi";
import type {
  ChangePaymentMethodStatusRequest,
  CreatePaymentMethodRequest,
  PaymentMethodAdminFilters,
  ReceiveSalesOrderPaymentRequest,
  RefundSalesOrderPaymentRequest,
  UpdatePaymentMethodRequest,
} from "../types/payment.types";

export const paymentQueryKeys = {
  all: ["payments"] as const,
  activeMethods: (companyId: string) =>
    ["payments", companyId, "methods", "active"] as const,
  adminMethods: (companyId: string, filters: PaymentMethodAdminFilters = {}) =>
    ["payments", companyId, "admin", "methods", filters] as const,
  adminMethod: (companyId: string, paymentMethodId: string) =>
    ["payments", companyId, "admin", "methods", paymentMethodId] as const,
  salesOrderPayments: (
    companyId: string,
    branchId: string,
    salesOrderId: string,
  ) => ["payments", companyId, branchId, salesOrderId, "history"] as const,
};

function invalidatePaymentMethodAdmin(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  paymentMethodId?: string | null,
) {
  if (!companyId) return;

  queryClient.invalidateQueries({
    queryKey: ["payments", companyId, "admin", "methods"],
  });
  queryClient.invalidateQueries({
    queryKey: paymentQueryKeys.activeMethods(companyId),
  });

  if (paymentMethodId) {
    queryClient.invalidateQueries({
      queryKey: paymentQueryKeys.adminMethod(companyId, paymentMethodId),
    });
  }
}

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

export function usePaymentMethods(
  companyId: string | null | undefined,
  filters: PaymentMethodAdminFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: paymentQueryKeys.adminMethods(companyId || "", filters),
    queryFn: () => getPaymentMethods(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function usePaymentMethodDetails(
  companyId: string | null | undefined,
  paymentMethodId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: paymentQueryKeys.adminMethod(companyId || "", paymentMethodId || ""),
    queryFn: () =>
      getPaymentMethodDetails(companyId as string, paymentMethodId as string),
    enabled: Boolean(companyId) && Boolean(paymentMethodId) && enabled,
  });
}

export function useCreatePaymentMethod(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePaymentMethodRequest) =>
      createPaymentMethod(companyId as string, payload),
    onSuccess: () => invalidatePaymentMethodAdmin(queryClient, companyId),
  });
}

export function useUpdatePaymentMethod(
  companyId: string | null | undefined,
  paymentMethodId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePaymentMethodRequest) =>
      updatePaymentMethod(companyId as string, paymentMethodId as string, payload),
    onSuccess: () =>
      invalidatePaymentMethodAdmin(queryClient, companyId, paymentMethodId),
  });
}

export function useChangePaymentMethodStatus(
  companyId: string | null | undefined,
  paymentMethodId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePaymentMethodStatusRequest) =>
      changePaymentMethodStatus(
        companyId as string,
        paymentMethodId as string,
        payload,
      ),
    onSuccess: () =>
      invalidatePaymentMethodAdmin(queryClient, companyId, paymentMethodId),
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
