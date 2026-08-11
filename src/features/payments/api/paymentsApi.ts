import { httpClient } from "../../../shared/api/httpClient";
import type {
  ActivePaymentMethod,
  ReceiveSalesOrderPaymentRequest,
  RefundSalesOrderPaymentRequest,
  SalesOrderPaymentHistory,
  SalesOrderPaymentRefundResponse,
  SalesOrderPaymentResponse,
} from "../types/payment.types";

function salesOrderPaymentsUrl(
  companyId: string,
  branchId: string,
  salesOrderId: string,
) {
  return `/api/companies/${companyId}/branches/${branchId}/sales-orders/${salesOrderId}/payments`;
}

function createPaymentIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getActivePaymentMethods(companyId: string) {
  const response = await httpClient.get<ActivePaymentMethod[]>(
    `/api/companies/${companyId}/payments/methods`,
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
