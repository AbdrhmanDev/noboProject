import { httpClient } from "../../../shared/api/httpClient";
import type {
  ScaleLabelSettings,
  SetScaleLabelSettingsRequest,
  TestScaleLabelBarcodeRequest,
  TestScaleLabelBarcodeResult,
} from "../types/scaleLabel.types";

// The three real endpoints (Nobo.Api.Catalog.ScaleLabels.ScaleLabelSettingsEndpoints). GET and
// /test need Catalog.View, PUT needs Catalog.Manage -- enforced by the backend.
function settingsUrl(companyId: string) {
  return `/api/companies/${companyId}/catalog/scale-label-settings`;
}

export async function getScaleLabelSettings(companyId: string) {
  const response = await httpClient.get<ScaleLabelSettings>(settingsUrl(companyId));
  return response.data;
}

export async function setScaleLabelSettings(companyId: string, payload: SetScaleLabelSettingsRequest) {
  const response = await httpClient.put<ScaleLabelSettings>(settingsUrl(companyId), payload);
  return response.data;
}

export async function testScaleLabelBarcode(companyId: string, payload: TestScaleLabelBarcodeRequest) {
  const response = await httpClient.post<TestScaleLabelBarcodeResult>(`${settingsUrl(companyId)}/test`, payload);
  return response.data;
}
