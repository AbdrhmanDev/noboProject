import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvoiceTemplate,
  createInvoiceTemplateVersion,
  getEffectiveInvoiceTemplate,
  getInvoiceTemplate,
  getInvoiceTemplateSchema,
  getInvoiceTemplateVersion,
  listInvoiceTemplates,
  publishInvoiceTemplateVersion,
  renderInvoiceTemplatePreview,
  validateInvoiceTemplateDocument,
} from "../api/invoiceTemplatesApi";
import type { CreateInvoiceTemplateRequest, TemplateDocument } from "../types/invoiceTemplate.types";

export const invoiceTemplateQueryKeys = {
  list: (companyId: string) => ["invoiceTemplates", companyId, "list"] as const,
  schema: (companyId: string) => ["invoiceTemplates", companyId, "schema"] as const,
  details: (companyId: string, templateId: string) => ["invoiceTemplates", companyId, templateId] as const,
  version: (companyId: string, templateId: string, versionId: string) =>
    ["invoiceTemplates", companyId, templateId, "versions", versionId] as const,
  effective: (companyId: string, branchId: string) => ["invoiceTemplates", companyId, "effective", branchId] as const,
};

export function useInvoiceTemplates(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: invoiceTemplateQueryKeys.list(companyId || ""),
    queryFn: () => listInvoiceTemplates(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

// The backend-authoritative catalog of block types/properties/paper widths/locale pattern. Fetched
// once per company and reused everywhere the document editor needs to know what a document may
// contain -- nothing about the schema is hand-maintained on the frontend.
export function useInvoiceTemplateSchema(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: invoiceTemplateQueryKeys.schema(companyId || ""),
    queryFn: () => getInvoiceTemplateSchema(companyId as string),
    enabled: Boolean(companyId) && enabled,
    staleTime: Infinity, // the schema is a build-time catalog of the server's own types; it cannot change without a deploy
  });
}

export function useInvoiceTemplateDetails(
  companyId: string | null | undefined,
  templateId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: invoiceTemplateQueryKeys.details(companyId || "", templateId || ""),
    queryFn: () => getInvoiceTemplate(companyId as string, templateId as string),
    enabled: Boolean(companyId) && Boolean(templateId) && enabled,
  });
}

export function useInvoiceTemplateVersion(
  companyId: string | null | undefined,
  templateId: string | null | undefined,
  versionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: invoiceTemplateQueryKeys.version(companyId || "", templateId || "", versionId || ""),
    queryFn: () => getInvoiceTemplateVersion(companyId as string, templateId as string, versionId as string),
    enabled: Boolean(companyId) && Boolean(templateId) && Boolean(versionId) && enabled,
  });
}

export function useEffectiveInvoiceTemplate(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: invoiceTemplateQueryKeys.effective(companyId || "", branchId || ""),
    queryFn: () => getEffectiveInvoiceTemplate(companyId as string, branchId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useCreateInvoiceTemplate(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoiceTemplateRequest) => createInvoiceTemplate(companyId as string, payload),
    onSuccess: () => {
      if (companyId) queryClient.invalidateQueries({ queryKey: invoiceTemplateQueryKeys.list(companyId) });
    },
  });
}

export function useCreateInvoiceTemplateVersion(companyId: string | null | undefined, templateId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (document: TemplateDocument) =>
      createInvoiceTemplateVersion(companyId as string, templateId as string, document),
    onSuccess: () => {
      if (companyId && templateId) {
        queryClient.invalidateQueries({ queryKey: invoiceTemplateQueryKeys.details(companyId, templateId) });
        queryClient.invalidateQueries({ queryKey: invoiceTemplateQueryKeys.list(companyId) });
      }
    },
  });
}

export function usePublishInvoiceTemplateVersion(companyId: string | null | undefined, templateId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => publishInvoiceTemplateVersion(companyId as string, templateId as string, versionId),
    onSuccess: () => {
      if (companyId && templateId) {
        queryClient.invalidateQueries({ queryKey: invoiceTemplateQueryKeys.details(companyId, templateId) });
        queryClient.invalidateQueries({ queryKey: invoiceTemplateQueryKeys.list(companyId) });
      }
      // The effective template for whichever branch(es) this affects may now have changed; the
      // safest, still-correct invalidation is every cached "effective" read for this company.
      if (companyId) queryClient.invalidateQueries({ queryKey: ["invoiceTemplates", companyId, "effective"] });
    },
  });
}

// Dry-run validation (POST .../validate): never mutates anything, so it is not cached -- every call
// is a deliberate "check this draft now" action from the editor.
export function useValidateInvoiceTemplateDocument(companyId: string | null | undefined) {
  return useMutation({
    mutationFn: (document: TemplateDocument) => validateInvoiceTemplateDocument(companyId as string, document),
  });
}

export function useRenderInvoiceTemplatePreview(companyId: string | null | undefined, branchId: string | null | undefined) {
  return useMutation({
    mutationFn: ({ invoiceId, document }: { invoiceId: string; document: TemplateDocument }) =>
      renderInvoiceTemplatePreview(companyId as string, branchId as string, invoiceId, document),
  });
}
