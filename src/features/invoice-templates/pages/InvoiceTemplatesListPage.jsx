import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileText, Pencil, Plus, RefreshCw } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../../shared/components/ui";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import {
  INVOICE_TEMPLATES_MANAGE_PERMISSION,
  INVOICE_TEMPLATES_VIEW_PERMISSION,
} from "../../authorization/constants/applicationPermissions";
import { useBranches } from "../../branches/hooks/useBranches";
import { invoiceTemplateDetailsPath } from "../../../utils/routes";
import { useCreateInvoiceTemplate, useInvoiceTemplateVersion, useInvoiceTemplates } from "../hooks/useInvoiceTemplates";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

// One row's paper width is NOT on the list DTO itself (InvoiceTemplateListItemDto has no PaperWidth
// field -- verified against the real backend contract) -- only inside a VERSION's own document. This
// reads it from the template's active version, the same existing GetInvoiceTemplateVersion endpoint
// the editor already uses; a template with no published version yet simply has no paper width to show.
function usePaperWidthOf(companyId, template) {
  const versionQuery = useInvoiceTemplateVersion(
    companyId,
    template.id,
    template.activeVersionId,
    Boolean(template.activeVersionId),
  );
  return versionQuery.data?.document.settings.paperWidth ?? null;
}

function TemplateRow({ companyId, template, branchName, canManage, navigate }) {
  const paperWidth = usePaperWidthOf(companyId, template);
  const hasPublishedVersion = Boolean(template.activeVersionId);

  return (
    <tr className="border-t border-white/5">
      <td className="py-2.5">
        <div className="font-bold text-white">{template.name}</div>
        {template.description && <div className="text-[11px] text-slate-500">{template.description}</div>}
      </td>
      <td className="py-2.5 text-slate-300">
        {template.scope === "Company" ? "Company" : branchName || "Branch"}
      </td>
      <td className="py-2.5 text-slate-300">{paperWidth || "—"}</td>
      <td className="py-2.5">
        {hasPublishedVersion ? (
          <StatusBadge tone="success">v{template.activeVersionNumber} published</StatusBadge>
        ) : (
          <StatusBadge tone="warning">No published version</StatusBadge>
        )}
        <span className="ms-1.5 text-[10px] text-slate-500">{template.versionCount} version(s)</span>
      </td>
      <td className="py-2.5">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => navigate(invoiceTemplateDetailsPath(template.id))}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] font-bold text-slate-200 hover:border-blue-400/40 hover:bg-blue-500/10"
          >
            <Pencil size={12} /> {canManage ? "Edit" : "Open"}
          </button>
          <button
            type="button"
            disabled={!hasPublishedVersion}
            onClick={() => navigate(`${invoiceTemplateDetailsPath(template.id)}?panel=preview`)}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] font-bold text-slate-200 hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            title={hasPublishedVersion ? "" : "No published version to preview yet"}
          >
            <Eye size={12} /> Preview
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateTemplateModal({ companyId, branches, existingTemplates, onClose, onCreated }) {
  const [scope, setScope] = useState("Company");
  const [branchId, setBranchId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const createMutation = useCreateInvoiceTemplate(companyId);

  // Backend: at most one template per scope (InvoiceTemplate.ScopeAlreadyHasTemplate). This is not a
  // new rule -- it just disables an option the list itself already shows has a template, so the
  // cashier isn't sent into a round trip that can only fail.
  const companyTaken = existingTemplates.some((template) => template.scope === "Company");
  const branchesTaken = new Set(existingTemplates.filter((t) => t.scope === "Branch").map((t) => t.branchId));

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (scope === "Branch" && !branchId) {
      setError("Select a branch.");
      return;
    }
    setError("");
    try {
      const created = await createMutation.mutateAsync({
        branchId: scope === "Branch" ? branchId : null,
        name: name.trim(),
        description: description.trim() || null,
      });
      onCreated(created.templateId);
    } catch (createError) {
      setError(getErrorMessage(createError));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1424] p-4">
        <h3 className="mb-3 text-sm font-black text-white">New invoice template</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope("Company")}
              disabled={companyTaken}
              className={`h-10 rounded-xl border text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                scope === "Company" ? "border-blue-400/60 bg-blue-500/15 text-blue-200" : "border-white/10 text-slate-300"
              }`}
            >
              Company-wide
            </button>
            <button
              type="button"
              onClick={() => setScope("Branch")}
              className={`h-10 rounded-xl border text-xs font-bold ${
                scope === "Branch" ? "border-blue-400/60 bg-blue-500/15 text-blue-200" : "border-white/10 text-slate-300"
              }`}
            >
              One branch
            </button>
          </div>
          {companyTaken && scope === "Company" && (
            <p className="text-[11px] text-amber-300">This company already has a company-wide template.</p>
          )}
          {scope === "Branch" && (
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
            >
              <option value="">Select branch...</option>
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId} disabled={branchesTaken.has(branch.branchId)}>
                  {branch.name}
                  {branchesTaken.has(branch.branchId) ? " (already has a template)" : ""}
                </option>
              ))}
            </select>
          )}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            maxLength={150}
            className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            maxLength={500}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none"
          />
          {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="h-10 flex-1 rounded-xl border border-white/10 text-xs font-bold text-slate-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 flex-1 rounded-xl bg-blue-600 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function InvoiceTemplatesListPage() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const viewPermissionQuery = useHasPermission(currentCompanyId, INVOICE_TEMPLATES_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, INVOICE_TEMPLATES_MANAGE_PERMISSION);
  const canManage = managePermissionQuery.hasPermission;
  const canView = viewPermissionQuery.hasPermission;

  const templatesQuery = useInvoiceTemplates(currentCompanyId, canView);
  const branchesQuery = useBranches(currentCompanyId, canView);
  const branchNameById = new Map((branchesQuery.data || []).map((branch) => [branch.branchId, branch.name]));

  const [showCreate, setShowCreate] = useState(false);

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title="Invoice Templates"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => templatesQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                >
                  <Plus size={14} /> New template
                </button>
              )}
            </div>
          }
        />

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company to manage invoice templates." />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking permissions..." />
        ) : !canView ? (
          <ErrorState
            title="Permission required"
            message="InvoiceTemplates.View permission is required to see invoice templates."
          />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
            {templatesQuery.isLoading && <LoadingState label="Loading invoice templates..." />}
            {templatesQuery.isError && (
              <ErrorState title="Unable to load templates" message={getErrorMessage(templatesQuery.error)} />
            )}
            {!templatesQuery.isLoading && !templatesQuery.isError && (templatesQuery.data || []).length === 0 && (
              <EmptyState
                title="No invoice templates yet"
                message="Create a company-wide or branch invoice template to control receipt/invoice layout."
              />
            )}
            {!templatesQuery.isLoading && !templatesQuery.isError && (templatesQuery.data || []).length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-right text-slate-500">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Scope</th>
                    <th className="pb-2 font-medium">Paper width</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templatesQuery.data.map((template) => (
                    <TemplateRow
                      key={template.id}
                      companyId={currentCompanyId}
                      template={template}
                      branchName={template.branchId ? branchNameById.get(template.branchId) : null}
                      canManage={canManage}
                      navigate={navigate}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
          <FileText size={13} />
          Editing a template creates a new version; publish it to make it active. Name/description are
          fixed at creation (the backend has no rename endpoint yet).
        </div>

        {showCreate && (
          <CreateTemplateModal
            companyId={currentCompanyId}
            branches={branchesQuery.data || []}
            existingTemplates={templatesQuery.data || []}
            onClose={() => setShowCreate(false)}
            onCreated={(templateId) => {
              setShowCreate(false);
              navigate(invoiceTemplateDetailsPath(templateId));
            }}
          />
        )}
      </main>
    </AppLayout>
  );
}
