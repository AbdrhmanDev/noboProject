import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { ROUTES } from "../../../utils/routes";
import { useCompanyTaxSettings } from "../hooks/useTax";

// Shown while the company is VAT-registered (KSA Phase 1 or 2) but its profile has no valid Saudi VAT number: its tax invoices then print
// without the seller VAT number and without a QR. Sales are never blocked by this; it only warns. The flag comes from the server
// (sellerVatNumberMissing on the tax settings), never re-derived here.
// Pass `settings` when the page already loaded the tax settings; otherwise `companyId` loads them (a 403 or an error simply hides it).
export function VatNumberMissingBanner({ companyId, settings, showTaxLink = true, compact = false }) {
  const { t } = useI18n();
  const query = useCompanyTaxSettings(companyId, !settings && Boolean(companyId));
  const data = settings ?? query.data;

  if (!data?.sellerVatNumberMissing) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-xl border border-warning bg-warning-soft text-warning ${compact ? "px-3 py-2 text-xs" : "p-3 text-sm"}`}
    >
      <TriangleAlert size={compact ? 14 : 16} className="mt-0.5 shrink-0" />
      <div className="space-y-1">
        <div className="font-bold">{t("tax.vatNumberMissing.title")}</div>
        {!compact && <div className="text-xs leading-5">{t("tax.vatNumberMissing.message")}</div>}
        {showTaxLink && (
          <Link to={ROUTES.TAX_ADMIN} className="text-xs font-bold underline">
            {t("tax.vatNumberMissing.link")}
          </Link>
        )}
      </div>
    </div>
  );
}
