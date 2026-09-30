import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posQueryKeys } from "../../pos/hooks/usePosTerminals";
import { draftSalesOrderQueryKeys } from "../../sales-orders/hooks/useDraftSalesOrder";
import { getPrintJobs } from "../../devices/api/printJobsApi";
import {
  changePaymentMethodStatus,
  createPaymentMethod,
  getActivePaymentMethods,
  getCustomerReceiptForSalesOrder,
  getPaymentMethodDetails,
  getPaymentMethods,
  getSalesOrderPayments,
  printCustomerReceipt,
  receiveSalesOrderPayment,
  refundSalesOrderPayment,
  updatePaymentMethod,
} from "../api/paymentsApi";
import type {
  ChangePaymentMethodStatusRequest,
  CreatePaymentMethodRequest,
  PaymentMethodAdminFilters,
  PrintCustomerReceiptRequest,
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
  // P9.1
  customerReceipt: (companyId: string, branchId: string, salesOrderId: string) =>
    ["payments", companyId, branchId, salesOrderId, "receipt"] as const,
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

// Exported so the approvals feature's approve-refund mutation (which also results in an executed
// refund, just via a different endpoint) can refresh the exact same query state without
// duplicating this invalidation list.
export function invalidatePaymentState(
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
  // P9.1: the receipt now exists (or was already issued, on a retried request) once payment fully
  // settles -- the backend already creates the auto-print PrintJob itself; the frontend's only job
  // is to let the receipt query refetch so a Print/Reprint action can appear. Never call the print
  // endpoint from here -- that would create a second, duplicate PrintJob alongside the auto-print one.
  queryClient.invalidateQueries({
    queryKey: paymentQueryKeys.customerReceipt(companyId, branchId, salesOrderId),
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
    onSuccess: (data) => {
      // Only an executed refund actually changed payment/order state -- an ApprovalRequired
      // outcome hasn't refunded anything yet, so invalidating here would just be a no-op refetch
      // and, worse, could visually imply something changed when nothing has.
      if (data.outcome === "Refunded") {
        invalidatePaymentState(
          queryClient,
          companyId,
          branchId,
          salesOrderId,
          posTerminalId,
        );
      }
    },
  });
}

// ---- P9.1: receipt printing ----

// The receipt only exists once the order is fully settled (ReceiveSalesOrderPaymentHandler issues
// it exactly once, idempotently). `enabled` should be gated on the caller's own knowledge that
// payment succeeded (e.g. IsFullyPaid on the payment result) so this never renders a spurious error
// state while the order is still open -- retry is disabled for the same reason: "not found yet" is
// an expected state here, not a transient failure to retry through.
export function useCustomerReceiptForSalesOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: paymentQueryKeys.customerReceipt(companyId || "", branchId || "", salesOrderId || ""),
    queryFn: () =>
      getCustomerReceiptForSalesOrder(companyId as string, branchId as string, salesOrderId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(salesOrderId) && enabled,
    retry: false,
  });
}

const IN_FLIGHT_PRINT_JOB_STATUSES = ["Queued", "Claimed", "Printing"];
const PRINT_JOB_POLL_INTERVAL_MS = 1500;

// The PrintJob(s) already created for this receipt -- either the backend's own auto-print job
// (created inside ReceiveSalesOrderPaymentHandler, Section 5/6 of P9.1) or a manual reprint. There
// is no "get print jobs for this document" endpoint, so this reuses the existing branch print-jobs
// LIST (GetPrintJobs, filtered server-side by documentType) and matches documentId client-side --
// no new endpoint was added. Polls only while the most recent job is still in flight, same interval
// convention as features/devices' usePrintJobDetails.
export function useCustomerReceiptPrintJobs(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  customerReceiptId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["payments", companyId || "", branchId || "", "receipt-print-jobs", customerReceiptId || ""],
    queryFn: async () => {
      const jobs = await getPrintJobs(companyId as string, branchId as string, { documentType: "CustomerReceipt" });
      return jobs
        .filter((job) => job.documentId === customerReceiptId)
        .sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime());
    },
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(customerReceiptId) && enabled,
    refetchInterval: (query) => {
      const latest = query.state.data?.[0];
      return latest && IN_FLIGHT_PRINT_JOB_STATUSES.includes(latest.status) ? PRINT_JOB_POLL_INTERVAL_MS : false;
    },
  });
}

// Manual print/reprint (Section 4/7 of P9.1). Never called automatically after a successful
// payment -- the backend's own auto-print already created that PrintJob; this is only for an
// explicit user action (the branch had no printer at settlement time, the first print failed, or
// the cashier wants an intentional extra copy).
export function usePrintCustomerReceipt(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  return useMutation({
    mutationFn: ({
      customerReceiptId,
      payload,
    }: {
      customerReceiptId: string;
      payload: PrintCustomerReceiptRequest;
    }) => printCustomerReceipt(companyId as string, branchId as string, customerReceiptId, payload),
  });
}
