import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { BranchesModal } from "../../branches/components/BranchesModal";
import { StatusBadge } from "../../../shared/components/ui";
import { setCompanyBillingRegime } from "../../tax/api/taxApi";
import { disableCompanyCompliance } from "../../compliance-settings/api/companyComplianceApi";

// NOBO staff only (the page sits behind PlatformAccessGate; the action also needs Platform.Entitlements.Manage, which the server checks
// again): move a company DOWN one billing regime, always with a reason.
//   KsaPhase1 -> NotVatRegistered: PUT /tax/billing-regime (prices stay exactly as stored; no VAT is charged on top or extracted).
//   KsaPhase2 -> KsaPhase1       : disabling the compliance integration (POST /compliance/disable), which moves the regime.
const KNOWN_ERRORS = [
  "BillingRegime.OpenOrdersExist",
  "BillingRegime.ReasonRequired",
  "BillingRegime.DisableIntegrationFirst",
  "Authorization.PlatformPermissionDenied",
];

export function PlatformBillingRegimePanel({ companyId, company, canManage }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");

  const regime = company.billingRegime || "NotVatRegistered";
  const target = regime === "KsaPhase2" ? "KsaPhase1" : regime === "KsaPhase1" ? "NotVatRegistered" : null;

  const mutation = useMutation({
    mutationFn: (trimmedReason) =>
      regime === "KsaPhase2"
        ? disableCompanyCompliance(companyId, { reason: trimmedReason })
        : setCompanyBillingRegime(companyId, { targetRegime: "NotVatRegistered", reason: trimmedReason }),
    onSuccess: () => {
      setDialogOpen(false);
      setReason("");
      setNotice(t("platform.billing.done"));
      queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId] });
    },
  });

  const errorText = (() => {
    const error = mutation.error;
    if (!error) return "";
    if (KNOWN_ERRORS.includes(error.code)) {
      const key = `platform.billing.error.${error.code}`;
      const text = t(key);
      if (text && text !== key) return text;
    }
    return error.message || t("platform.error.message");
  })();

  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-black text-ink">{t("platform.billing.title")}</div>
        {canManage && target && (
          <button
            type="button"
            onClick={() => {
              setNotice("");
              mutation.reset();
              setDialogOpen(true);
            }}
            className="rounded-xl border border-danger px-3 py-2 text-xs font-bold text-danger hover:bg-danger-soft"
          >
            {t(`platform.billing.action.${regime}`)}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-subtle">{t("taxAdmin.field.billingRegime")}:</span>
        <span className="font-bold text-ink">{t(`taxAdmin.regime.${regime}`)}</span>
        <StatusBadge tone={company.integrationEnabled ? "success" : "neutral"}>
          {company.integrationEnabled ? t("platform.billing.integrationOn") : t("platform.billing.integrationOff")}
        </StatusBadge>
        {company.sellerVatNumberMissing && <StatusBadge tone="warning">{t("tax.vatNumberMissing.title")}</StatusBadge>}
      </div>

      {notice && <div className="mt-2 rounded-xl border border-success bg-success-soft p-2 text-xs text-success">{notice}</div>}

      {dialogOpen && (
        <BranchesModal title={t(`platform.billing.action.${regime}`)} onClose={() => setDialogOpen(false)}>
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-warning bg-warning-soft p-3 text-xs leading-5 text-warning">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="font-bold">{company.legalName}</div>
                <div>{t(`platform.billing.warning.${regime}`)}</div>
                <div>{t("platform.billing.warning.documents")}</div>
              </div>
            </div>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t("platform.billing.reasonPlaceholder")}
              className="w-full rounded-lg border border-line bg-canvas p-2 text-sm text-ink outline-none"
            />
            {errorText && <div className="rounded-xl border border-danger bg-danger-soft p-2 text-xs text-danger">{errorText}</div>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => mutation.mutate(reason.trim())}
                disabled={!reason.trim() || mutation.isPending}
                className="flex-1 rounded-xl bg-danger px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mutation.isPending ? t("platform.billing.saving") : t("platform.billing.confirm")}
              </button>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl border border-line px-3 py-2 text-sm font-bold text-ink"
              >
                {t("compliance.switch.cancel")}
              </button>
            </div>
          </div>
        </BranchesModal>
      )}
    </section>
  );
}
