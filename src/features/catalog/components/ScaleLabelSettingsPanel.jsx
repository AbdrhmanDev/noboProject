import { useState } from "react";
import { Scale, ScanBarcode } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { ErrorState, LoadingState, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { scaleLabelErrorMessage } from "../../pos/utils/scaleLabelMessages";
import { useScaleLabelSettings, useSetScaleLabelSettings, useTestScaleLabelBarcode } from "../hooks/useScaleLabelSettings";

// Scale Label Barcodes Phase 1 -- the company's label-scale barcode layout (Catalog admin, "Scale
// labels" tab). Read with Catalog.View (the page's own gate), change with Catalog.Manage. The
// "test a barcode" box asks the SERVER to decode; this file deliberately contains no decoder.

const INPUT_CLASS =
  "mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50";

function toForm(settings) {
  return {
    isEnabled: Boolean(settings.isEnabled),
    prefixes: (settings.prefixes || []).join(","),
    itemCodeLength: String(settings.itemCodeLength),
    weightLength: String(settings.weightLength),
    weightDecimals: String(settings.weightDecimals),
    maxWeightKg: String(settings.maxWeightKg),
  };
}

// null when a numeric field is not a plain number -- the server still validates every range.
function toLayout(form) {
  const integer = (value) => (/^\d+$/.test(value.trim()) ? Number(value.trim()) : null);
  const maxWeightKg = Number(form.maxWeightKg.trim());
  const layout = {
    prefixes: form.prefixes.split(/[,\s]+/).map((prefix) => prefix.trim()).filter(Boolean),
    itemCodeLength: integer(form.itemCodeLength),
    weightLength: integer(form.weightLength),
    weightDecimals: integer(form.weightDecimals),
    maxWeightKg: form.maxWeightKg.trim() && Number.isFinite(maxWeightKg) ? maxWeightKg : null,
  };
  return Object.values(layout).some((value) => value === null) ? null : layout;
}

// Every validation problem the PUT/test endpoints return (they report all of them at once).
function errorMessages(error, t) {
  const known = scaleLabelErrorMessage(error?.code, t);
  if (known) return [known];
  const errors = Array.isArray(error?.raw?.errors) ? error.raw.errors : [];
  const messages = errors.map((entry) => entry?.message).filter(Boolean);
  return messages.length ? messages : [error?.message || t("catalogAdmin.requestFailed")];
}

export function ScaleLabelSettingsPanel({ companyId, canManage }) {
  const { t } = useI18n();
  const settingsQuery = useScaleLabelSettings(companyId);

  if (settingsQuery.isLoading) return <LoadingState label={t("catalogAdmin.common.loading")} />;
  if (settingsQuery.isError || !settingsQuery.data) {
    return <ErrorState title={t("scaleLabel.settings.loadError")} message={errorMessages(settingsQuery.error, t)[0]} />;
  }

  // Re-keyed on the saved version, so a successful save (or a refetch) resets the form to exactly
  // what the server now holds, without any effect-based syncing.
  return (
    <ScaleLabelSettingsForm
      key={settingsQuery.data.updatedAtUtc || "defaults"}
      companyId={companyId}
      canManage={canManage}
      settings={settingsQuery.data}
    />
  );
}

function ScaleLabelSettingsForm({ companyId, canManage, settings }) {
  const { t } = useI18n();
  const saveMutation = useSetScaleLabelSettings(companyId);
  const [form, setForm] = useState(() => toForm(settings));
  const [saveErrors, setSaveErrors] = useState([]);
  const [saved, setSaved] = useState(false);
  const update = (field) => (event) => {
    const value = field === "isEnabled" ? event.target.checked : event.target.value;
    setForm((draft) => ({ ...draft, [field]: value }));
    setSaved(false);
  };

  const layout = toLayout(form);
  const total = layout ? settings.prefixLength + layout.itemCodeLength + layout.weightLength + 1 : null;

  const submit = async (event) => {
    event.preventDefault();
    setSaveErrors([]);
    setSaved(false);
    if (!layout) return setSaveErrors([t("scaleLabel.settings.invalidNumbers")]);
    try {
      await saveMutation.mutateAsync({ isEnabled: form.isEnabled, ...layout });
      setSaved(true);
    } catch (error) {
      setSaveErrors(errorMessages(error, t));
    }
  };

  const disabled = !canManage || saveMutation.isPending;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-accent" />
            <h2 className="text-sm font-black text-ink">{t("scaleLabelSettings.title")}</h2>
            <StatusBadge tone={settings.isConfigured && settings.isEnabled ? "success" : "neutral"}>
              {settings.isConfigured && settings.isEnabled ? t("scaleLabel.settings.state.on") : t("scaleLabel.settings.state.off")}
            </StatusBadge>
          </div>
          {settings.updatedAtUtc && <span className="text-xs text-subtle">{formatDateTime(settings.updatedAtUtc)}</span>}
        </div>

        <p className="text-xs leading-5 text-subtle">{t("scaleLabel.settings.intro")}</p>
        {!settings.isConfigured && (
          <div className="rounded-xl border border-warning bg-warning-soft p-2 text-xs text-warning">{t("scaleLabel.settings.notConfigured")}</div>
        )}
        {!canManage && (
          <div className="rounded-xl border border-line bg-raised p-2 text-xs text-subtle">{t("scaleLabel.settings.readOnly")}</div>
        )}

        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={form.isEnabled} onChange={update("isEnabled")} disabled={disabled} className="h-4 w-4" />
          {t("scaleLabel.settings.enabled")}
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-muted md:col-span-2">
            {t("scaleLabel.settings.prefixes")}
            <input value={form.prefixes} onChange={update("prefixes")} disabled={disabled} dir="ltr" inputMode="numeric" className={INPUT_CLASS} />
            <span className="mt-1 block text-xs font-normal text-subtle">{t("scaleLabel.settings.prefixesHint")}</span>
          </label>
          <label className="text-sm font-semibold text-muted">
            {t("scaleLabel.settings.itemCodeLength")}
            <input type="number" min="4" max="6" value={form.itemCodeLength} onChange={update("itemCodeLength")} disabled={disabled} className={INPUT_CLASS} />
          </label>
          <label className="text-sm font-semibold text-muted">
            {t("scaleLabel.settings.weightLength")}
            <input type="number" min="4" max="6" value={form.weightLength} onChange={update("weightLength")} disabled={disabled} className={INPUT_CLASS} />
          </label>
          <label className="text-sm font-semibold text-muted">
            {t("scaleLabel.settings.weightDecimals")}
            <input type="number" min="0" max="3" value={form.weightDecimals} onChange={update("weightDecimals")} disabled={disabled} className={INPUT_CLASS} />
            <span className="mt-1 block text-xs font-normal text-subtle">{t("scaleLabel.settings.weightDecimalsHint")}</span>
          </label>
          <label className="text-sm font-semibold text-muted">
            {t("scaleLabel.settings.maxWeightKg")}
            <input type="number" min="0.001" step="0.001" value={form.maxWeightKg} onChange={update("maxWeightKg")} disabled={disabled} className={INPUT_CLASS} />
          </label>
        </div>

        {layout && (
          <div className={`rounded-xl border p-2 text-xs ${total === 13 ? "border-line bg-raised text-subtle" : "border-warning bg-warning-soft text-warning"}`}>
            {t("scaleLabel.settings.layout", { prefix: settings.prefixLength, item: layout.itemCodeLength, weight: layout.weightLength, total })}
          </div>
        )}

        {saveErrors.length > 0 && (
          <ul className="space-y-1 rounded-xl border border-danger bg-danger-soft p-2 text-xs text-danger">
            {saveErrors.map((message) => <li key={message}>{message}</li>)}
          </ul>
        )}
        {saved && <div className="rounded-xl border border-success bg-success-soft p-2 text-xs text-success">{t("scaleLabel.settings.saved")}</div>}

        {canManage && (
          <button type="submit" disabled={disabled} className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {saveMutation.isPending ? t("scaleLabel.settings.saving") : t("scaleLabel.settings.save")}
          </button>
        )}
      </form>

      <ScaleLabelTester companyId={companyId} formLayout={layout} hasSaved={settings.isConfigured} />
    </div>
  );
}

function ScaleLabelTester({ companyId, formLayout, hasSaved }) {
  const { t } = useI18n();
  const testMutation = useTestScaleLabelBarcode(companyId);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const run = async (useForm) => {
    setResult(null);
    setErrors([]);
    if (useForm && !formLayout) return setErrors([t("scaleLabel.settings.invalidNumbers")]);
    try {
      setResult(await testMutation.mutateAsync(useForm ? { code, ...formLayout } : { code }));
    } catch (error) {
      setErrors(errorMessages(error, t));
    }
  };

  const failure = result?.failureCode ? scaleLabelErrorMessage(result.failureCode, t) || result.failureCode : null;

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <ScanBarcode size={16} className="text-accent" />
        <h3 className="text-sm font-black text-ink">{t("scaleLabel.test.title")}</h3>
      </div>
      <input
        value={code}
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={(event) => {
          // A keyboard-wedge scanner ends with Enter: test with the form layout, like the button.
          if (event.key === "Enter") {
            event.preventDefault();
            if (code.trim()) run(true);
          }
        }}
        placeholder={t("scaleLabel.test.placeholder")}
        dir="ltr"
        inputMode="numeric"
        className={INPUT_CLASS}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run(true)}
          disabled={!code.trim() || testMutation.isPending}
          className="rounded-xl bg-accent px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("scaleLabel.test.useForm")}
        </button>
        <button
          type="button"
          onClick={() => run(false)}
          disabled={!code.trim() || !hasSaved || testMutation.isPending}
          className="rounded-xl border border-line bg-raised px-3 py-2 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("scaleLabel.test.useSaved")}
        </button>
      </div>

      {errors.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-danger bg-danger-soft p-2 text-xs text-danger">
          {errors.map((message) => <li key={message}>{message}</li>)}
        </ul>
      )}

      {result && !result.isScaleLabel && (
        <div className="rounded-xl border border-line bg-raised p-2 text-xs text-subtle">{t("scaleLabel.test.notScaleLabel")}</div>
      )}

      {result?.isScaleLabel && (
        <dl className={`space-y-1 rounded-xl border p-3 text-xs ${failure ? "border-warning bg-warning-soft text-warning" : "border-success bg-success-soft text-success"}`}>
          {failure ? <div className="font-bold">{failure}</div> : <div className="font-bold">{t("scaleLabel.test.ok")}</div>}
          {result.itemCode && (
            <div className="flex justify-between gap-2"><dt>{t("scaleLabel.test.itemCode")}</dt><dd dir="ltr" className="font-mono">{result.itemCode}</dd></div>
          )}
          {result.weightKg != null && (
            <div className="flex justify-between gap-2"><dt>{t("scaleLabel.test.weight")}</dt><dd dir="ltr" className="font-mono">{result.weightKg} kg</dd></div>
          )}
          {result.productVariantName && (
            <div className="flex justify-between gap-2"><dt>{t("scaleLabel.test.product")}</dt><dd>{result.productVariantName}</dd></div>
          )}
        </dl>
      )}
    </section>
  );
}
