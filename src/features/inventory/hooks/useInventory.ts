import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeInventoryItemStatus,
  changeInventoryLocationStatus,
  createInventoryItem,
  createInventoryLocation,
  getActiveInventoryItems,
  getInventoryItemDetails,
  getInventoryItems,
  getInventoryLocationDetails,
  getInventoryLocations,
  getModifierOptionInventoryAdjustments,
  getOperationalInventoryLocations,
  getProductVariantInventoryConsumption,
  removeModifierOptionInventoryAdjustment,
  removeProductVariantInventoryComponent,
  setModifierOptionInventoryAdjustment,
  setProductVariantInventoryComponent,
  updateInventoryItem,
  updateInventoryLocation,
} from "../api/inventoryApi";
import type {
  ChangeInventoryItemStatusRequest,
  ChangeInventoryLocationStatusRequest,
  CreateInventoryItemRequest,
  CreateInventoryLocationRequest,
  InventoryItemFilters,
  InventoryLocationFilters,
  SetModifierOptionInventoryAdjustmentRequest,
  SetProductVariantInventoryComponentRequest,
  UpdateInventoryItemRequest,
  UpdateInventoryLocationRequest,
} from "../types/inventory.types";

export const inventoryQueryKeys = {
  all: ["inventory"] as const,
  activeItems: (companyId: string) => ["inventory", companyId, "items", "active"] as const,
  items: (companyId: string, filters: InventoryItemFilters = {}) =>
    ["inventory", companyId, "items", filters] as const,
  item: (companyId: string, inventoryItemId: string) =>
    ["inventory", companyId, "items", "detail", inventoryItemId] as const,
  operationalLocations: (companyId: string, branchId: string) =>
    ["inventory", companyId, branchId, "locations", "active"] as const,
  locations: (companyId: string, branchId: string, filters: InventoryLocationFilters = {}) =>
    ["inventory", companyId, branchId, "locations", filters] as const,
  location: (companyId: string, branchId: string, inventoryLocationId: string) =>
    ["inventory", companyId, branchId, "locations", "detail", inventoryLocationId] as const,
  variantConsumption: (companyId: string, productVariantId: string) =>
    ["inventory", companyId, "consumption", "variants", productVariantId] as const,
  modifierAdjustments: (companyId: string, modifierOptionId: string) =>
    ["inventory", companyId, "consumption", "modifier-options", modifierOptionId] as const,
};

function invalidateInventoryItems(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  inventoryItemId?: string | null,
) {
  if (!companyId) return;

  queryClient.invalidateQueries({ queryKey: ["inventory", companyId, "items"] });

  if (inventoryItemId) {
    queryClient.invalidateQueries({
      queryKey: inventoryQueryKeys.item(companyId, inventoryItemId),
    });
  }
}

function invalidateInventoryLocations(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  inventoryLocationId?: string | null,
) {
  if (!companyId || !branchId) return;

  queryClient.invalidateQueries({ queryKey: ["inventory", companyId, branchId, "locations"] });

  if (inventoryLocationId) {
    queryClient.invalidateQueries({
      queryKey: inventoryQueryKeys.location(companyId, branchId, inventoryLocationId),
    });
  }
}

function invalidateVariantConsumption(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  productVariantId: string | null | undefined,
) {
  if (!companyId || !productVariantId) return;

  queryClient.invalidateQueries({
    queryKey: inventoryQueryKeys.variantConsumption(companyId, productVariantId),
  });
}

function invalidateModifierAdjustments(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  modifierOptionId: string | null | undefined,
) {
  if (!companyId || !modifierOptionId) return;

  queryClient.invalidateQueries({
    queryKey: inventoryQueryKeys.modifierAdjustments(companyId, modifierOptionId),
  });
}

// Inventory Items

export function useActiveInventoryItems(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: inventoryQueryKeys.activeItems(companyId || ""),
    queryFn: () => getActiveInventoryItems(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useInventoryItems(
  companyId: string | null | undefined,
  filters: InventoryItemFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.items(companyId || "", filters),
    queryFn: () => getInventoryItems(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useInventoryItemDetails(
  companyId: string | null | undefined,
  inventoryItemId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.item(companyId || "", inventoryItemId || ""),
    queryFn: () => getInventoryItemDetails(companyId as string, inventoryItemId as string),
    enabled: Boolean(companyId) && Boolean(inventoryItemId) && enabled,
  });
}

export function useCreateInventoryItem(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInventoryItemRequest) =>
      createInventoryItem(companyId as string, payload),
    onSuccess: () => invalidateInventoryItems(queryClient, companyId),
  });
}

export function useUpdateInventoryItem(
  companyId: string | null | undefined,
  inventoryItemId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateInventoryItemRequest) =>
      updateInventoryItem(companyId as string, inventoryItemId as string, payload),
    onSuccess: () => invalidateInventoryItems(queryClient, companyId, inventoryItemId),
  });
}

export function useChangeInventoryItemStatus(
  companyId: string | null | undefined,
  inventoryItemId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeInventoryItemStatusRequest) =>
      changeInventoryItemStatus(companyId as string, inventoryItemId as string, payload),
    onSuccess: () => invalidateInventoryItems(queryClient, companyId, inventoryItemId),
  });
}

// Inventory Locations

export function useOperationalInventoryLocations(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.operationalLocations(companyId || "", branchId || ""),
    queryFn: () => getOperationalInventoryLocations(companyId as string, branchId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useInventoryLocations(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: InventoryLocationFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.locations(companyId || "", branchId || "", filters),
    queryFn: () => getInventoryLocations(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useInventoryLocationDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  inventoryLocationId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.location(
      companyId || "",
      branchId || "",
      inventoryLocationId || "",
    ),
    queryFn: () =>
      getInventoryLocationDetails(
        companyId as string,
        branchId as string,
        inventoryLocationId as string,
      ),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(inventoryLocationId) && enabled,
  });
}

export function useCreateInventoryLocation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInventoryLocationRequest) =>
      createInventoryLocation(companyId as string, branchId as string, payload),
    onSuccess: () => invalidateInventoryLocations(queryClient, companyId, branchId),
  });
}

export function useUpdateInventoryLocation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  inventoryLocationId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateInventoryLocationRequest) =>
      updateInventoryLocation(
        companyId as string,
        branchId as string,
        inventoryLocationId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateInventoryLocations(queryClient, companyId, branchId, inventoryLocationId),
  });
}

export function useChangeInventoryLocationStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  inventoryLocationId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeInventoryLocationStatusRequest) =>
      changeInventoryLocationStatus(
        companyId as string,
        branchId as string,
        inventoryLocationId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateInventoryLocations(queryClient, companyId, branchId, inventoryLocationId),
  });
}

// Product Variant Consumption Components

export function useProductVariantInventoryConsumption(
  companyId: string | null | undefined,
  productVariantId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.variantConsumption(companyId || "", productVariantId || ""),
    queryFn: () =>
      getProductVariantInventoryConsumption(companyId as string, productVariantId as string),
    enabled: Boolean(companyId) && Boolean(productVariantId) && enabled,
  });
}

export function useSetProductVariantInventoryComponent(
  companyId: string | null | undefined,
  productVariantId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inventoryItemId,
      payload,
    }: {
      inventoryItemId: string;
      payload: SetProductVariantInventoryComponentRequest;
    }) =>
      setProductVariantInventoryComponent(
        companyId as string,
        productVariantId as string,
        inventoryItemId,
        payload,
      ),
    onSuccess: () => invalidateVariantConsumption(queryClient, companyId, productVariantId),
  });
}

export function useRemoveProductVariantInventoryComponent(
  companyId: string | null | undefined,
  productVariantId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inventoryItemId }: { inventoryItemId: string }) =>
      removeProductVariantInventoryComponent(
        companyId as string,
        productVariantId as string,
        inventoryItemId,
      ),
    onSuccess: () => invalidateVariantConsumption(queryClient, companyId, productVariantId),
  });
}

// Modifier Option Inventory Adjustments

export function useModifierOptionInventoryAdjustments(
  companyId: string | null | undefined,
  modifierOptionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.modifierAdjustments(companyId || "", modifierOptionId || ""),
    queryFn: () =>
      getModifierOptionInventoryAdjustments(companyId as string, modifierOptionId as string),
    enabled: Boolean(companyId) && Boolean(modifierOptionId) && enabled,
  });
}

export function useSetModifierOptionInventoryAdjustment(
  companyId: string | null | undefined,
  modifierOptionId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inventoryItemId,
      payload,
    }: {
      inventoryItemId: string;
      payload: SetModifierOptionInventoryAdjustmentRequest;
    }) =>
      setModifierOptionInventoryAdjustment(
        companyId as string,
        modifierOptionId as string,
        inventoryItemId,
        payload,
      ),
    onSuccess: () => invalidateModifierAdjustments(queryClient, companyId, modifierOptionId),
  });
}

export function useRemoveModifierOptionInventoryAdjustment(
  companyId: string | null | undefined,
  modifierOptionId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inventoryItemId }: { inventoryItemId: string }) =>
      removeModifierOptionInventoryAdjustment(
        companyId as string,
        modifierOptionId as string,
        inventoryItemId,
      ),
    onSuccess: () => invalidateModifierAdjustments(queryClient, companyId, modifierOptionId),
  });
}
