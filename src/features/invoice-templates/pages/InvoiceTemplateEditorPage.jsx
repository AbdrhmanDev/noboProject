import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, CircleCheck, Eye, Save, TriangleAlert, Upload } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import {
  INVOICE_TEMPLATES_MANAGE_PERMISSION,
  INVOICE_TEMPLATES_VIEW_PERMISSION,
} from "../../authorization/constants/applicationPermissions";
import { useBranches } from "../../branches/hooks/useBranches";
import { ROUTES } from "../../../utils/routes";
import { TemplateDocumentEditor } from "../components/TemplateDocumentEditor";
import { RenderedDocumentPreview } from "../components/RenderedDocumentPreview";
import { EffectiveTemplateBadge } from "../components/EffectiveTemplateBadge";
import { buildSystemDefaultDocument } from "../utils/templateDocumentDefaults";
import {
  useCreateInvoiceTemplateVersion,
  useEffectiveInvoiceTemplate,
  useInvoiceTemplateDetails,
  useInvoiceTemplateSchema,
  useInvoiceTemplateVersion,
  usePublishInvoiceTemplateVersion,
  useRenderInvoiceTemplatePreview,
  useValidateInvoiceTemplateDocument,
} from "../hooks/useInvoiceTemplates";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function ValidationIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <div className="space-y-1 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
      {issues.map((issue, index) => (
        <div key={index}>
          <span className="font-mono text-[10px] text-red-300">{issue.path}</span> — {issue.message}
        </div>
      ))}
    </div>
  );
}

function VersionsPanel({ versions, selectedVersionId, onSelectVersion, canManage, publishMutation }) {
  return (
    <div className="space-y-2">
      {versions.length === 0 && <p className="text-xs text-slate-500">No versions yet -- save one below.</p>}
      {versions.map((version) => (
        <div
          key={version.id}
          className={`flex items-center justify-between gap-2 rounded-xl border p-2 text-xs ${
            selectedVersionId === version.id ? "border-blue-400/50 bg-blue-500/10" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <button type="button" onClick={() => onSelectVersion(version.id)} className="flex-1 text-start">
            <div className="font-bold text-white">
              v{version.versionNumber}
              {version.isActive && (
                <StatusBadge tone="success">
                  <span className="ms-1">active</span>
                </StatusBadge>
              )}
            </div>
            <div className="text-[10px] text-slate-500">
              {version.isPublished ? `Published ${formatDateTime(version.publishedAtUtc)}` : "Draft, unpublished"} ·{" "}
              {formatDateTime(version.createdAtUtc)}
            </div>
          </button>
          {canManage && !version.isActive && (
            <button
              type="button"
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate(version.id)}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 font-bold text-slate-200 hover:border-emerald-400/40 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              <Upload size={12} /> Publish
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function PreviewPanel({ companyId, template, branches, canView, document }) {
  const defaultBranchId = template.branchId || branches[0]?.branchId || "";
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [invoiceId, setInvoiceId] = useState("");
  const effectiveQuery = useEffectiveInvoiceTemplate(companyId, branchId, canView && Boolean(branchId));
  const previewMutation = useRenderInvoiceTemplatePreview(companyId, branchId);

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0c1424] p-4">
      <div className="flex items-center gap-2 text-sm font-black text-white">
        <Eye size={16} /> Preview
      </div>
      <p className="text-[11px] text-slate-500">
        Renders the document currently in the editor against a REAL invoice of the chosen branch (nothing
        is saved). NOBO's API has no invoice search/list endpoint yet, so paste an existing invoice's ID.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {template.scope === "Branch" ? (
          <div className="flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.02] px-3 text-xs text-slate-300">
            Branch: {branches.find((b) => b.branchId === branchId)?.name || branchId}
          </div>
        ) : (
          <select
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          >
            <option value="">Select branch...</option>
            {branches.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.name}
              </option>
            ))}
          </select>
        )}
        <input
          value={invoiceId}
          onChange={(event) => setInvoiceId(event.target.value)}
          placeholder="Invoice ID (GUID)"
          className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
        />
      </div>

      {effectiveQuery.data && <EffectiveTemplateBadge effective={effectiveQuery.data} />}

      <button
        type="button"
        disabled={!branchId || !invoiceId.trim() || !document || previewMutation.isPending}
        onClick={() => previewMutation.mutate({ invoiceId: invoiceId.trim(), document })}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {previewMutation.isPending ? "Rendering..." : "Render preview"}
      </button>

      {previewMutation.isError && (
        <ErrorState title="Preview failed" message={getErrorMessage(previewMutation.error)} />
      )}
      {previewMutation.data && <RenderedDocumentPreview document={previewMutation.data} />}
    </div>
  );
}

export function InvoiceTemplateEditorPage() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const { currentCompanyId } = useCompany();

  const viewPermissionQuery = useHasPermission(currentCompanyId, INVOICE_TEMPLATES_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, INVOICE_TEMPLATES_MANAGE_PERMISSION);
  const canView = viewPermissionQuery.hasPermission;
  const canManage = managePermissionQuery.hasPermission;

  const detailsQuery = useInvoiceTemplateDetails(currentCompanyId, templateId, canView);
  const schemaQuery = useInvoiceTemplateSchema(currentCompanyId, canView);
  const branchesQuery = useBranches(currentCompanyId, canView);

  const template = detailsQuery.data;
  const [selectedVersionId, setSelectedVersionId] = useState(undefined); // undefined = "not chosen yet, default to active"
  const effectiveVersionId = selectedVersionId !== undefined ? selectedVersionId : template?.activeVersionId ?? null;

  const versionQuery = useInvoiceTemplateVersion(currentCompanyId, templateId, effectiveVersionId, Boolean(effectiveVersionId));
  const initialDocument = effectiveVersionId ? versionQuery.data?.document : buildSystemDefaultDocument();

  const [document, setDocument] = useState(null);
  const [notice, setNotice] = useState("");
  const [showPreview, setShowPreview] = useState(searchParams.get("panel") === "preview");

  const validateMutation = useValidateInvoiceTemplateDocument(currentCompanyId);
  const createVersionMutation = useCreateInvoiceTemplateVersion(currentCompanyId, templateId);
  const publishMutation = usePublishInvoiceTemplateVersion(currentCompanyId, templateId);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const saveVersion = async () => {
    if (!document) return;
    try {
      const created = await createVersionMutation.mutateAsync(document);
      showNotice(`Version ${created.versionNumber} saved (unpublished). Publish it to make it active.`);
      setSelectedVersionId(created.versionId);
    } catch {
      // createVersionMutation.error already carries the message; rendered below.
    }
  };

  const loadingCore = detailsQuery.isLoading || schemaQuery.isLoading;
  const readyDocument = effectiveVersionId ? Boolean(versionQuery.data) : true;

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title={template ? template.name : "Invoice Template"}
          actions={
            <button
              type="button"
              onClick={() => navigate(ROUTES.INVOICE_TEMPLATES_ADMIN)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
            >
              <ArrowRight size={14} /> Back to list
            </button>
          }
        />

        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
            <CircleCheck size={14} /> {notice}
          </div>
        )}

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company." />
        ) : !canView && !viewPermissionQuery.isLoading ? (
          <ErrorState title="Permission required" message="InvoiceTemplates.View permission is required." />
        ) : loadingCore ? (
          <LoadingState label="Loading template..." />
        ) : detailsQuery.isError ? (
          <ErrorState title="Unable to load template" message={getErrorMessage(detailsQuery.error)} />
        ) : !template ? (
          <ErrorState title="Not found" message="This invoice template is not available." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
            <section className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
                <div className="mb-2 text-xs font-bold text-slate-400">
                  {template.scope === "Company" ? "Company-wide template" : "Branch template"}
                </div>
                {template.description && <p className="mb-2 text-xs text-slate-500">{template.description}</p>}
                <VersionsPanel
                  versions={template.versions}
                  selectedVersionId={effectiveVersionId}
                  onSelectVersion={setSelectedVersionId}
                  canManage={canManage}
                  publishMutation={publishMutation}
                />
                {publishMutation.isError && (
                  <div className="mt-2 rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-[11px] text-red-200">
                    {getErrorMessage(publishMutation.error)}
                  </div>
                )}
              </div>

              {!canManage && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">
                  InvoiceTemplates.Manage permission is required to save or publish a version. You can still
                  view and preview.
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-black text-white">Document editor</h2>
                  <button
                    type="button"
                    onClick={() => setShowPreview((value) => !value)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300 hover:border-blue-400/40"
                  >
                    <Eye size={12} /> {showPreview ? "Hide preview" : "Show preview"}
                  </button>
                </div>

                {!readyDocument || !schemaQuery.data ? (
                  <LoadingState label="Loading document..." />
                ) : (
                  <TemplateDocumentEditor
                    key={effectiveVersionId || "new"}
                    schema={schemaQuery.data}
                    initialDocument={initialDocument || buildSystemDefaultDocument()}
                    onChange={setDocument}
                    disabled={!canManage}
                  />
                )}

                <ValidationIssues issues={validateMutation.data?.issues} />
                {validateMutation.data?.isValid && (
                  <div className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2 text-xs text-emerald-200">
                    Document is valid.
                  </div>
                )}
                {createVersionMutation.isError && (
                  <div className="mt-2 rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">
                    {getErrorMessage(createVersionMutation.error)}
                  </div>
                )}

                {canManage && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!document || validateMutation.isPending}
                      onClick={() => validateMutation.mutate(document)}
                      className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TriangleAlert size={14} /> {validateMutation.isPending ? "Validating..." : "Validate"}
                    </button>
                    <button
                      type="button"
                      disabled={!document || createVersionMutation.isPending}
                      onClick={saveVersion}
                      className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={14} /> {createVersionMutation.isPending ? "Saving..." : "Save as new version"}
                    </button>
                  </div>
                )}
              </div>

              {showPreview && (
                <PreviewPanel
                  companyId={currentCompanyId}
                  template={template}
                  branches={branchesQuery.data || []}
                  canView={canView}
                  document={document}
                />
              )}
            </section>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
