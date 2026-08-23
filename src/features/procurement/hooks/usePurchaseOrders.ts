import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryQueryKeys } from "../../inventory/hooks/useInventory";
import {
  cancelPurchaseOrder,
  closePurchaseOrder,
  createPurchaseOrder,
  getPurchaseGoodsReceipts,
  getPurchaseOrderDetails,
  getPurchaseOrders,
  postPurchaseGoodsReceipt,
  submitPurchaseOrder,
  updatePurchaseOrder,
} from "../api/purchaseOrdersApi";
import type {
  CreatePurchaseOrderRequest,
  PostPurchaseGoodsReceiptRequest,
  PurchaseOrdersListFilters,
  UpdatePurchaseOrderRequest,
} from "../types/procurement.types";

export const purchaseOrderQueryKeys = {
  all: ["procurement", "purchase-orders"] as const,
  list: (companyId: string, branchId: string, filters: PurchaseOrdersListFilters = {}) =>
    ["procurement", "purchase-orders", companyId, branchId, filters] as const,
  details: (companyId: string, branchId: string, purchaseOrderId: string) =>
    ["procurement", "purchase-orders", companyId, branchId, "detail", purchaseOrderId] as const,
  receipts: (companyId: string, branchId: string, purchaseOrderId: string) =>
    ["procurement", "purchase-orders", companyId, branchId, "receipts", purchaseOrderId] as const,
};

function invalidatePurchaseOrders(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  purchaseOrderId?: string | null,
) {
  if (!companyId || !branchId) return;

  queryClient.invalidateQueries({
    queryKey: ["procurement", "purchase-orders", companyId, branchId],
  });

  if (purchaseOrderId) {
    queryClient.invalidateQueries({
      queryKey: purchaseOrderQueryKeys.details(companyId, branchId, purchaseOrderId),
    });
    queryClient.invalidateQueries({
      queryKey: purchaseOrderQueryKeys.receipts(companyId, branchId, purchaseOrderId),
    });
  }
}

// Goods Receipt is the only Procurement action that actually moves stock —
// invalidating these existing Inventory query keys is deliberately the only
// way this feature touches Inventory: no manual adjustment call, no
// frontend stock math, just "go refetch the real numbers".
function invalidateInventoryAfterReceipt(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  inventoryLocationId: string | null | undefined,
) {
  if (!companyId || !branchId) return;

  if (inventoryLocationId) {
    queryClient.invalidateQueries({
      queryKey: inventoryQueryKeys.locationStock(companyId, branchId, inventoryLocationId),
    });
  }
  queryClient.invalidateQueries({ queryKey: ["inventory", companyId, branchId, "transactions"] });
}

export function usePurchaseOrders(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: PurchaseOrdersListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: purchaseOrderQueryKeys.list(companyId || "", branchId || "", filters),
    queryFn: () => getPurchaseOrders(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function usePurchaseOrderDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  purchaseOrderId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: purchaseOrderQueryKeys.details(companyId || "", branchId || "", purchaseOrderId || ""),
    queryFn: () =>
      getPurchaseOrderDetails(companyId as string, branchId as string, purchaseOrderId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(purchaseOrderId) && enabled,
  });
}

export function usePurchaseGoodsReceipts(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  purchaseOrderId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: purchaseOrderQueryKeys.receipts(companyId || "", branchId || "", purchaseOrderId || ""),
    queryFn: () =>
      getPurchaseGoodsReceipts(companyId as string, branchId as string, purchaseOrderId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(purchaseOrderId) && enabled,
  });
}

export function useCreatePurchaseOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseOrderRequest) =>
      createPurchaseOrder(companyId as string, branchId as string, payload),
    onSuccess: () => invalidatePurchaseOrders(queryClient, companyId, branchId),
  });
}

export function useUpdatePurchaseOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  purchaseOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePurchaseOrderRequest) =>
      updatePurchaseOrder(companyId as string, branchId as string, purchaseOrderId as string, payload),
    onSuccess: () => invalidatePurchaseOrders(queryClient, companyId, branchId, purchaseOrderId),
  });
}

export function useSubmitPurchaseOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  purchaseOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitPurchaseOrder(companyId as string, branchId as string, purchaseOrderId as string),
    onSuccess: () => invalidatePurchaseOrders(queryClient, companyId, branchId, purchaseOrderId),
  });
}

export function useCancelPurchaseOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  purchaseOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelPurchaseOrder(companyId as string, branchId as string, purchaseOrderId as string),
    onSuccess: () => invalidatePurchaseOrders(queryClient, companyId, branchId, purchaseOrderId),
  });
}

export function useClosePurchaseOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  purchaseOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => closePurchaseOrder(companyId as string, branchId as string, purchaseOrderId as string),
    onSuccess: () => invalidatePurchaseOrders(queryClient, companyId, branchId, purchaseOrderId),
  });
}

export function usePostPurchaseGoodsReceipt(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  purchaseOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PostPurchaseGoodsReceiptRequest) =>
      postPurchaseGoodsReceipt(companyId as string, branchId as string, purchaseOrderId as string, payload),
    // A rejection (e.g. PurchaseGoodsReceipt.ExceedsOrderedQuantity from a
    // concurrent receipt) means local Ordered/Received/Remaining figures
    // were stale — PO details gets invalidated below even on failure so the
    // UI reflects reality. Inventory is only invalidated on real success,
    // since a rejected receipt never touched stock.
    onSuccess: (receipt) => {
      invalidateInventoryAfterReceipt(queryClient, companyId, branchId, receipt.inventoryLocationId);
    },
    onSettled: () => {
      invalidatePurchaseOrders(queryClient, companyId, branchId, purchaseOrderId);
    },
  });
}
