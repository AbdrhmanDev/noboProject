import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getScaleLabelSettings, setScaleLabelSettings, testScaleLabelBarcode } from "../api/scaleLabelSettingsApi";
import type { SetScaleLabelSettingsRequest, TestScaleLabelBarcodeRequest } from "../types/scaleLabel.types";

export const scaleLabelQueryKeys = {
  settings: (companyId: string) => ["catalog", companyId, "scaleLabelSettings"] as const,
};

export function useScaleLabelSettings(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: scaleLabelQueryKeys.settings(companyId || ""),
    queryFn: () => getScaleLabelSettings(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useSetScaleLabelSettings(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetScaleLabelSettingsRequest) => setScaleLabelSettings(companyId as string, payload),
    onSuccess: (settings) => {
      queryClient.setQueryData(scaleLabelQueryKeys.settings(companyId || ""), settings);
    },
  });
}

// A dry run: never changes anything server-side, so nothing to invalidate.
export function useTestScaleLabelBarcode(companyId: string | null | undefined) {
  return useMutation({
    mutationFn: (payload: TestScaleLabelBarcodeRequest) => testScaleLabelBarcode(companyId as string, payload),
  });
}
