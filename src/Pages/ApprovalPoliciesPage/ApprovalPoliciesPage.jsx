import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission, useMyCompanies } from "../../features/companies/hooks/useCompanies";
import { getCurrencyMinorUnitDigits } from "../../features/pos/schemas/openShift.schema";
import {
  useCompanyApprovalPolicy,
  useSetCompanyApprovalPolicy,
} from "../../features/approval-policies/hooks/useApprovalPolicies";

// Company-administration functionality -- gated on the existing Company.Manage permission
// (already a real backend permission, see permissionMetadata.ts; no new permission introduced).
const COMPANY_MANAGE_PERMISSION = "Company.Manage";

const MODES = ["Never", "Always", "AboveThreshold"];

const REFUND_ACTION_CODE = "Payments.Refund";
const DISCOUNT_ACTION_CODE = "SalesOrders.ApplyDiscount";

// Per-action presentation. Refund thresholds are currency AMOUNTS; Discount thresholds are
// PERCENTAGES (a permission ceiling for users without direct discount permission). The backend
// stays authoritative for the resulting behavior -- this only shapes the configuration form.
const ACTION_CONFIG = {
  [REFUND_ACTION_CODE]: {
    thresholdKind: "amount",
    hintPrefix: "approvalPolicies.mode",
    thresholdLabelKey: "approvalPolicies.threshold.label",
    thresholdPlaceholderKey: "approvalPolicies.threshold.placeholder",
    disclaimerKey: "approvalPolicies.disclaimer",
  },
  [DISCOUNT_ACTION_CODE]: {
    thresholdKind: "percent",
    hintPrefix: "approvalPolicies.discount.mode",
    thresholdLabelKey: "approvalPolicies.discount.threshold.label",
    thresholdPlaceholderKey: "approvalPolicies.discount.threshold.placeholder",
    disclaimerKey: "approvalPolicies.discount.disclaimer",
  },
};

const PERCENT_MAX_DECIMALS = 2;

function parsePercentInput(value, t) {
  const normalized = String(value).trim();

  if (!normalized) {
    return { error: t("approvalPolicies.discount.threshold.required") };
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { error: t("approvalPolicies.discount.threshold.invalid") };
  }

  const percent = Number(normalized);

  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { error: t("approvalPolicies.discount.threshold.range") };
  }

  if (getDecimalScale(normalized) > PERCENT_MAX_DECIMALS) {
    return { error: t("approvalPolicies.discount.threshold.precision", { digits: PERCENT_MAX_DECIMALS }) };
  }

  return { value: percent };
}

function modeKey(mode) {
  return mode === "AboveThreshold" ? "aboveThreshold" : mode.toLowerCase();
}

function getDecimalScale(value) {
  const normalized = String(value).trim();
  if (!normalized.includes(".")) return 0;
  return normalized.split(".")[1]?.length || 0;
}

function parseThresholdInput(value, currencyCode, t) {
  const normalized = String(value).trim();

  if (!normalized) {
    return { error: t("approvalPolicies.threshold.required") };
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { error: t("approvalPolicies.threshold.invalid") };
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: t("approvalPolicies.threshold.mustBePositive") };
  }

  const minorUnitDigits = getCurrencyMinorUnitDigits(currencyCode);
  if (getDecimalScale(normalized) > minorUnitDigits) {
    return { error: t("approvalPolicies.threshold.precision", { digits: minorUnitDigits }) };
  }

  return { value: amount };
}

// One reusable card per ActionCode. Refund is the only instance rendered in V1 (see MODES/backend
// support), but a future action (e.g. SalesOrders.ApplyDiscount) is added by rendering another
// <ApprovalPolicyCard companyId=... actionCode="..." titleKey=... descriptionKey=... /> in the
// page below. This outer component only owns the load (query) -- it renders nothing of the
// editable form until the authoritative policy has actually loaded, and hands that snapshot to
// <ApprovalPolicyForm key={companyId} .../> below.
function ApprovalPolicyCard({ companyId, actionCode, titleKey, descriptionKey, currencyCode }) {
  const { t } = useI18n();
  const policyQuery = useCompanyApprovalPolicy(companyId, actionCode, Boolean(companyId));

  if (policyQuery.isLoading) {
    return <LoadingState />;
  }

  if (policyQuery.isError) {
    return <ErrorState title={t(titleKey)} message={t("approvalPolicies.loadError")} />;
  }

  return (
    <ApprovalPolicyForm
      // Keyed by companyId (and actionCode, for when a second card is added later): switching
      // company fully remounts this form, so its local edit state is always freshly initialized
      // from the new company's own policy -- never a leftover value from the previous company.
      // No effect-based "reset on change" is needed at all.
      key={`${companyId}-${actionCode}`}
      companyId={companyId}
      actionCode={actionCode}
      titleKey={titleKey}
      descriptionKey={descriptionKey}
      currencyCode={currencyCode}
      policy={policyQuery.data}
    />
  );
}

function ApprovalPolicyForm({ companyId, actionCode, titleKey, descriptionKey, currencyCode, policy }) {
  const { t } = useI18n();
  const saveMutation = useSetCompanyApprovalPolicy(companyId, actionCode);
  const config = ACTION_CONFIG[actionCode] ?? ACTION_CONFIG[REFUND_ACTION_CODE];
  const isPercent = config.thresholdKind === "percent";

  // Lazy initializers read the already-loaded policy exactly once, at this component's first
  // mount for this companyId/actionCode (see the `key` on ApprovalPolicyCard's render above) --
  // never re-synced via an effect, so there is nothing to accidentally leave stale.
  const [mode, setMode] = useState(() => policy.mode);
  const [thresholdInput, setThresholdInput] = useState(() => {
    const saved = isPercent ? policy.thresholdPercent : policy.thresholdAmount;
    return saved !== null && saved !== undefined ? String(saved) : "";
  });
  const [thresholdError, setThresholdError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasExplicitPolicy, setHasExplicitPolicy] = useState(() => policy.hasExplicitPolicy);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setThresholdError("");
  };

  const handleSave = async () => {
    // Never/Always: thresholdAmount and thresholdPercent are always null -- no stale threshold
    // value from a prior AboveThreshold edit is ever sent once the mode has been switched away.
    let thresholdAmount = null;
    let thresholdPercent = null;

    if (mode === "AboveThreshold") {
      const parsed = isPercent
        ? parsePercentInput(thresholdInput, t)
        : parseThresholdInput(thresholdInput, currencyCode, t);
      if (parsed.error) {
        setThresholdError(parsed.error);
        return;
      }
      // Discount uses thresholdPercent (thresholdAmount stays null); Refund is the reverse.
      if (isPercent) thresholdPercent = parsed.value;
      else thresholdAmount = parsed.value;
    }

    try {
      const saved = await saveMutation.mutateAsync({
        mode,
        thresholdAmount,
        thresholdPercent,
      });
      // Reflect the server's confirmed response directly -- not an optimistic guess, and not
      // reliant on a background refetch/effect landing before the next render.
      setHasExplicitPolicy(saved.hasExplicitPolicy);
      showNotice(t("approvalPolicies.saved"));
    } catch (error) {
      showNotice(error?.message || t("approvalPolicies.saveError"));
    }
  };

  return (
    <section className="max-w-2xl rounded-2xl border border-white/10 bg-[#0c1424] p-5">
      <div className="mb-3 flex items-start gap-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-300" />
        <div>
          <h2 className="text-sm font-bold text-slate-100">{t(titleKey)}</h2>
          <p className="mt-1 text-xs text-slate-400">{t(descriptionKey)}</p>
        </div>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
          {notice}
        </div>
      )}

      {!hasExplicitPolicy && (
        <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {t("approvalPolicies.defaultNotice")}
        </div>
      )}

      <label className="mb-2 block text-xs font-semibold text-slate-400">
        {t("approvalPolicies.mode.label")}
      </label>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {MODES.map((candidateMode) => (
          <button
            key={candidateMode}
            type="button"
            onClick={() => handleModeChange(candidateMode)}
            disabled={saveMutation.isPending}
            aria-pressed={mode === candidateMode}
            className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === candidateMode
                ? "border-blue-400/60 bg-blue-500/15 text-blue-100"
                : "border-white/10 bg-black/10 text-slate-300 hover:border-white/20"
            }`}
          >
            {t(`approvalPolicies.mode.${modeKey(candidateMode)}`)}
          </button>
        ))}
      </div>

      <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-[11px] leading-5 text-slate-300">
        {t(`${config.hintPrefix}.${modeKey(mode)}.hint`)}
      </p>

      {mode === "AboveThreshold" && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400">
            {t(config.thresholdLabelKey)}
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
            <input
              type="text"
              inputMode="decimal"
              value={thresholdInput}
              onChange={(event) => {
                setThresholdInput(event.target.value);
                setThresholdError("");
              }}
              disabled={saveMutation.isPending}
              placeholder={t(config.thresholdPlaceholderKey)}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none disabled:opacity-50"
            />
            <span className="text-xs font-bold text-slate-400">{isPercent ? "%" : currencyCode}</span>
          </div>
          {thresholdError && <p className="mt-1 text-[11px] text-rose-300">{thresholdError}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saveMutation.isPending ? t("approvalPolicies.saving") : t("approvalPolicies.save")}
      </button>

      {/* Requirement 11: the policy only ever governs whether an approval workflow is offered to
          a user who lacks direct refund permission -- it never itself allows or denies a specific
          refund, and this screen must never claim otherwise. */}
      <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-slate-500">
        {t(config.disclaimerKey)}
      </p>
    </section>
  );
}

export default function ApprovalPoliciesPage() {
  const { t, dir } = useI18n();
  const { currentCompanyId } = useCompany();
  const { data: companies } = useMyCompanies();
  const currentCompany = companies?.find((company) => company.companyId === currentCompanyId) || null;
  const currencyCode = currentCompany?.defaultCurrency || "";

  const managePermissionQuery = useHasPermission(currentCompanyId, COMPANY_MANAGE_PERMISSION);
  const canManage =
    Boolean(currentCompanyId) && !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;

  return (
    <AppLayout>
      <main className="space-y-4" dir={dir}>
        <PageHeader title={t("approvalPolicies.title")} />
        <p className="text-sm text-slate-400">{t("approvalPolicies.subtitle")}</p>

        {!currentCompanyId ? (
          <EmptyState
            title={t("approvalPolicies.title")}
            message={t("approvalPolicies.companyRequired")}
          />
        ) : managePermissionQuery.isLoading ? (
          <LoadingState label={t("approvalPolicies.checkingPermission")} />
        ) : !canManage ? (
          <ErrorState
            title={t("approvalPolicies.title")}
            message={t("approvalPolicies.permissionRequired")}
          />
        ) : (
          <div className="space-y-4">
            <ApprovalPolicyCard
              companyId={currentCompanyId}
              actionCode={REFUND_ACTION_CODE}
              titleKey="approvalPolicies.refund.title"
              descriptionKey="approvalPolicies.refund.description"
              currencyCode={currencyCode}
            />
            <ApprovalPolicyCard
              companyId={currentCompanyId}
              actionCode={DISCOUNT_ACTION_CODE}
              titleKey="approvalPolicies.discount.title"
              descriptionKey="approvalPolicies.discount.description"
              currencyCode={currencyCode}
            />
          </div>
        )}
      </main>
    </AppLayout>
  );
}
