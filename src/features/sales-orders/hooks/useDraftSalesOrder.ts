import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelSalesOrder,
  closeSalesOrder,
  confirmSalesOrder,
  createDraftSalesOrder,
  getSalesOrderDetails,
  updateDraftSalesOrder,
  voidPreparedSalesOrder,
} from "../api/draftSalesOrdersApi";
import type {
  CancelSalesOrderRequest,
  CreateDraftSalesOrderRequest,
  UpdateDraftSalesOrderRequest,
  VoidPreparedSalesOrderRequest,
} from "../types/draftSalesOrder.types";

export const draftSalesOrderQueryKeys = {
  all: ["sales-orders"] as const,
  details: (companyId: string, branchId: string, salesOrderId: string) =>
    ["sales-orders", companyId, branchId, salesOrderId] as const,
};

export function useDraftSalesOrderDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: draftSalesOrderQueryKeys.details(
      companyId || "",
      branchId || "",
      salesOrderId || "",
    ),
    queryFn: () =>
      getSalesOrderDetails(
        companyId as string,
        branchId as string,
        salesOrderId as string,
      ),
    enabled:
      Boolean(companyId) && Boolean(branchId) && Boolean(salesOrderId) && enabled,
  });
}

export function useCreateDraftSalesOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDraftSalesOrderRequest) =>
      createDraftSalesOrder(companyId as string, branchId as string, payload),
    onSuccess: (draft) => {
      queryClient.setQueryData(
        draftSalesOrderQueryKeys.details(
          draft.companyId,
          draft.branchId,
          draft.salesOrderId,
        ),
        draft,
      );
    },
  });
}

export function useUpdateDraftSalesOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDraftSalesOrderRequest) =>
      updateDraftSalesOrder(
        companyId as string,
        branchId as string,
        salesOrderId as string,
        payload,
      ),
    onSuccess: (draft) => {
      queryClient.setQueryData(
        draftSalesOrderQueryKeys.details(
          draft.companyId,
          draft.branchId,
          draft.salesOrderId,
        ),
        draft,
      );
    },
  });
}

export function useConfirmSalesOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      confirmSalesOrder(
        companyId as string,
        branchId as string,
        salesOrderId as string,
      ),
    onSuccess: async () => {
      if (!companyId || !branchId || !salesOrderId) return;

      await queryClient.invalidateQueries({
        queryKey: draftSalesOrderQueryKeys.details(
          companyId,
          branchId,
          salesOrderId,
        ),
      });
    },
  });
}

export function useCloseSalesOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      closeSalesOrder(
        companyId as string,
        branchId as string,
        salesOrderId as string,
      ),
    onSuccess: async () => {
      if (!companyId || !branchId || !salesOrderId) return;

      await queryClient.invalidateQueries({
        queryKey: draftSalesOrderQueryKeys.details(
          companyId,
          branchId,
          salesOrderId,
        ),
      });
    },
  });
}

export function useCancelSalesOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CancelSalesOrderRequest) =>
      cancelSalesOrder(
        companyId as string,
        branchId as string,
        salesOrderId as string,
        payload,
      ),
    onSuccess: async () => {
      if (!companyId || !branchId || !salesOrderId) return;

      await queryClient.invalidateQueries({
        queryKey: draftSalesOrderQueryKeys.details(
          companyId,
          branchId,
          salesOrderId,
        ),
      });
    },
  });
}

export function useVoidPreparedSalesOrder(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  salesOrderId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VoidPreparedSalesOrderRequest) =>
      voidPreparedSalesOrder(
        companyId as string,
        branchId as string,
        salesOrderId as string,
        payload,
      ),
    onSuccess: async () => {
      if (!companyId || !branchId || !salesOrderId) return;

      await queryClient.invalidateQueries({
        queryKey: draftSalesOrderQueryKeys.details(
          companyId,
          branchId,
          salesOrderId,
        ),
      });
    },
  });
}
