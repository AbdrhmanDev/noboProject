import { httpClient } from "../../../shared/api/httpClient";
import type {
  ActivePaymentMethod,
  ChangePaymentMethodStatusRequest,
  CreatePaymentMethodRequest,
  CustomerReceiptResponse,
  PaymentMethodAdmin,
  PaymentMethodAdminFilters,
  PaymentMethodResponse,
  PrintCustomerReceiptRequest,
  PrintCustomerReceiptResponse,
  ReceiveSalesOrderPaymentRequest,
  RefundOrApprovalResponse,
  RefundSalesOrderPaymentRequest,
  SalesOrderPaymentHistory,
  SalesOrderPaymentResponse,
  UpdatePaymentMethodRequest,
} from "../types/payment.types";

function salesOrderPaymentsUrl(
  companyId: string,
  branchId: string,
  salesOrderId: string,
) {
  return `/api/companies/${companyId}/branches/${branchId}/sales-orders/${salesOrderId}/payments`;
}

function salesOrdersUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/sales-orders`;
}

function paymentsUrl(companyId: string) {
  return `/api/companies/${companyId}/payments`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

function createPaymentIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getActivePaymentMethods(companyId: string) {
  const response = await httpClient.get<ActivePaymentMethod[]>(
    `${paymentsUrl(companyId)}/methods`,
  );

  return response.data;
}

export async function getPaymentMethods(
  companyId: string,
  filters: PaymentMethodAdminFilters = {},
) {
  const response = await httpClient.get<PaymentMethodAdmin[]>(
    `${paymentsUrl(companyId)}/admin/methods`,
    {
      params: compactParams(filters),
    },
  );

  return response.data;
}

export async function getPaymentMethodDetails(
  companyId: string,
  paymentMethodId: string,
) {
  const response = await httpClient.get<PaymentMethodAdmin>(
    `${paymentsUrl(companyId)}/admin/methods/${paymentMethodId}`,
  );

  return response.data;
}

export async function createPaymentMethod(
  companyId: string,
  payload: CreatePaymentMethodRequest,
) {
  const response = await httpClient.post<PaymentMethodResponse>(
    `${paymentsUrl(companyId)}/methods`,
    payload,
  );

  return response.data;
}

export async function updatePaymentMethod(
  companyId: string,
  paymentMethodId: string,
  payload: UpdatePaymentMethodRequest,
) {
  const response = await httpClient.put<PaymentMethodAdmin>(
    `${paymentsUrl(companyId)}/admin/methods/${paymentMethodId}`,
    payload,
  );

  return response.data;
}

export async function changePaymentMethodStatus(
  companyId: string,
  paymentMethodId: string,
  payload: ChangePaymentMethodStatusRequest,
) {
  const response = await httpClient.put<PaymentMethodAdmin>(
    `${paymentsUrl(companyId)}/admin/methods/${paymentMethodId}/status`,
    payload,
  );

  return response.data;
}

export async function getSalesOrderPayments(
  companyId: string,
  branchId: string,
  salesOrderId: string,
) {
  const response = await httpClient.get<SalesOrderPaymentHistory>(
    salesOrderPaymentsUrl(companyId, branchId, salesOrderId),
  );

  return response.data;
}

export async function receiveSalesOrderPayment(
  companyId: string,
  branchId: string,
  salesOrderId: string,
  payload: ReceiveSalesOrderPaymentRequest,
) {
  const response = await httpClient.post<SalesOrderPaymentResponse>(
    salesOrderPaymentsUrl(companyId, branchId, salesOrderId),
    payload,
    {
      headers: {
        "Idempotency-Key": createPaymentIdempotencyKey("payment"),
      },
    },
  );

  return response.data;
}

// GET .../sales-orders/{salesOrderId}/receipt -- the receipt already issued (idempotently, exactly
// once) by ReceiveSalesOrderPaymentHandler on full settlement. 404-shaped errors (via the shared
// error normalizer) mean the order is not yet fully paid; the caller decides what that means.
export async function getCustomerReceiptForSalesOrder(
  companyId: string,
  branchId: string,
  salesOrderId: string,
) {
  const response = await httpClient.get<CustomerReceiptResponse>(
    `${salesOrdersUrl(companyId, branchId)}/${salesOrderId}/receipt`,
  );

  return response.data;
}

// POST .../sales-orders/receipts/{customerReceiptId}/print -- manual print/reprint. A fresh
// Idempotency-Key is generated on every call (same convention as receiveSalesOrderPayment/
// refundSalesOrderPayment above), so every explicit click is a genuinely new, intentional reprint
// request -- never silently deduplicated the way a real network retry of the SAME request would be.
export async function printCustomerReceipt(
  companyId: string,
  branchId: string,
  customerReceiptId: string,
  payload: PrintCustomerReceiptRequest,
) {
  const response = await httpClient.post<PrintCustomerReceiptResponse>(
    `${salesOrdersUrl(companyId, branchId)}/receipts/${customerReceiptId}/print`,
    payload,
    {
      headers: {
        "Idempotency-Key": createPaymentIdempotencyKey("receipt-print"),
      },
    },
  );

  return response.data;
}

export async function refundSalesOrderPayment(
  companyId: string,
  branchId: string,
  salesOrderId: string,
  salesOrderPaymentId: string,
  payload: RefundSalesOrderPaymentRequest,
) {
  const response = await httpClient.post<RefundOrApprovalResponse>(
    `${salesOrderPaymentsUrl(
      companyId,
      branchId,
      salesOrderId,
    )}/${salesOrderPaymentId}/refunds`,
    payload,
    {
      headers: {
        "Idempotency-Key": createPaymentIdempotencyKey("refund"),
      },
    },
  );

  return response.data;
}
