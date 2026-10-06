import { StatusBadge } from "../../../shared/components/ui";

// Requirement #6: display the effective template SOURCE clearly (GET .../invoice-templates/effective
// -- Nobo.Application.Invoicing.Templates.ResolveInvoiceTemplateHandler): BranchTemplate, else
// CompanyTemplate, else SystemDefault. Nothing here re-derives that precedence; it only labels
// whatever the backend already resolved.
const SOURCE_LABEL = {
  BranchTemplate: "Branch template",
  CompanyTemplate: "Company template",
  SystemDefault: "System default",
};

const SOURCE_TONE = {
  BranchTemplate: "info",
  CompanyTemplate: "success",
  SystemDefault: "neutral",
};

export function EffectiveTemplateBadge({ effective }) {
  if (!effective) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
      <StatusBadge tone={SOURCE_TONE[effective.source] || "neutral"}>
        {SOURCE_LABEL[effective.source] || effective.source}
      </StatusBadge>
      <span className="text-subtle">Paper: {effective.paperWidth}</span>
      {effective.versionNumber != null && <span className="text-subtle">Version: {effective.versionNumber}</span>}
      <span className="text-subtle">Locale: {effective.locale}</span>
    </div>
  );
}
