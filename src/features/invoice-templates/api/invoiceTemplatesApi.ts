import { httpClient } from "../../../shared/api/httpClient";
import type {
  CreateInvoiceTemplateRequest,
  CreateInvoiceTemplateResult,
  CreateInvoiceTemplateVersionResult,
  EffectiveInvoiceTemplate,
  InvoiceTemplateDetails,
  InvoiceTemplateListItem,
  InvoiceTemplateSchema,
  InvoiceTemplateVersion,
  PublishInvoiceTemplateVersionResult,
  RenderedDocument,
  TemplateDocument,
  ValidateInvoiceTemplateDocumentResult,
} from "../types/invoiceTemplate.types";

// Every call below is one of the REAL routes in Nobo.Api.InvoiceTemplates.InvoiceTemplateEndpoints --
// no route, verb or body shape here was invented; see that file (read-only) for the exact match.

function templatesUrl(companyId: string) {
  return `/api/companies/${companyId}/invoice-templates`;
}

function branchUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}`;
}

export async function listInvoiceTemplates(companyId: string) {
  const response = await httpClient.get<InvoiceTemplateListItem[]>(templatesUrl(companyId));
  return response.data;
}

export async function getInvoiceTemplateSchema(companyId: string) {
  const response = await httpClient.get<InvoiceTemplateSchema>(`${templatesUrl(companyId)}/schema`);
  return response.data;
}

export async function validateInvoiceTemplateDocument(companyId: string, document: TemplateDocument) {
  const response = await httpClient.post<ValidateInvoiceTemplateDocumentResult>(
    `${templatesUrl(companyId)}/validate`,
    { document },
  );
  return response.data;
}

export async function createInvoiceTemplate(companyId: string, payload: CreateInvoiceTemplateRequest) {
  const response = await httpClient.post<CreateInvoiceTemplateResult>(templatesUrl(companyId), payload);
  return response.data;
}

export async function getInvoiceTemplate(companyId: string, templateId: string) {
  const response = await httpClient.get<InvoiceTemplateDetails>(`${templatesUrl(companyId)}/${templateId}`);
  return response.data;
}

export async function createInvoiceTemplateVersion(companyId: string, templateId: string, document: TemplateDocument) {
  const response = await httpClient.post<CreateInvoiceTemplateVersionResult>(
    `${templatesUrl(companyId)}/${templateId}/versions`,
    { document },
  );
  return response.data;
}

export async function getInvoiceTemplateVersion(companyId: string, templateId: string, versionId: string) {
  const response = await httpClient.get<InvoiceTemplateVersion>(
    `${templatesUrl(companyId)}/${templateId}/versions/${versionId}`,
  );
  return response.data;
}

export async function publishInvoiceTemplateVersion(companyId: string, templateId: string, versionId: string) {
  const response = await httpClient.post<PublishInvoiceTemplateVersionResult>(
    `${templatesUrl(companyId)}/${templateId}/versions/${versionId}/publish`,
    {},
  );
  return response.data;
}

export async function getEffectiveInvoiceTemplate(companyId: string, branchId: string) {
  const response = await httpClient.get<EffectiveInvoiceTemplate>(
    `${branchUrl(companyId, branchId)}/invoice-templates/effective`,
  );
  return response.data;
}

// Renders an UNSAVED draft document against a REAL, existing invoice of that branch; nothing is
// persisted. See the type's own comment for why this endpoint (not POST .../preview) is what the UI
// preview uses.
export async function renderInvoiceTemplatePreview(
  companyId: string,
  branchId: string,
  invoiceId: string,
  document: TemplateDocument,
) {
  const response = await httpClient.post<RenderedDocument>(
    `${branchUrl(companyId, branchId)}/invoice-templates/render-preview`,
    { invoiceId, document },
  );
  return response.data;
}
