import { httpClient } from "../../../shared/api/httpClient";
import type {
  ActivePaymentMethod,
  ChangePaymentMethodStatusRequest,
  CreatePaymentMethodRequest,
  PaymentMethodAdmin,
  PaymentMethodAdminFilters,
  PaymentMethodResponse,
  ReceiveSalesOrderPaymentRequest,
  RefundSalesOrderPaymentRequest,
  SalesOrderPaymentHistory,
  SalesOrderPaymentRefundResponse,
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

export async function refundSalesOrderPayment(
  companyId: string,
  branchId: string,
  salesOrderId: string,
  salesOrderPaymentId: string,
  payload: RefundSalesOrderPaymentRequest,
) {
  const response = await httpClient.post<SalesOrderPaymentRefundResponse>(
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
