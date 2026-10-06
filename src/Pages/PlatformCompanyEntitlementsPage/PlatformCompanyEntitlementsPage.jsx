import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { PlatformAccessGate } from "../../features/platform/components/PlatformAccessGate";
import {
  usePlatformCompanyEntitlements,
  useSetPlatformCompanyEntitlement,
} from "../../features/platform/hooks/usePlatform";
import { ConfirmToggleEntitlementDialog } from "../../features/platform/components/ConfirmToggleEntitlementDialog";
import { ROUTES } from "../../utils/routes";

// Groups the flat catalog list the backend returns into root Apps + their direct child
// Capabilities -- the backend already resolved parent/child and effective-vs-configured, so this
// is pure grouping, never a re-derivation of the hierarchy algorithm itself. Works for ANY number
// of future Apps/Capabilities without a redesign (section 16) -- nothing here names a specific app.
function groupByApp(entitlements) {
  const apps = entitlements.filter((entitlement) => entitlement.kind === "App");
  const capabilitiesByParent = new Map();

  for (const entitlement of entitlements) {
    if (entitlement.kind !== "Capability") continue;
    const list = capabilitiesByParent.get(entitlement.parentCode) || [];
    list.push(entitlement);
    capabilitiesByParent.set(entitlement.parentCode, list);
  }

  return apps.map((app) => ({
    app,
    capabilities: capabilitiesByParent.get(app.code) || [],
  }));
}

function StateBadge({ configuredStatus, effectiveEnabled }) {
  if (configuredStatus === "Enabled" && effectiveEnabled) {
    return <span className="text-sm font-black text-success">ON</span>;
  }
  if (configuredStatus === "Enabled" && !effectiveEnabled) {
    return <span className="text-sm font-black text-warning">ON*</span>;
  }
  if (configuredStatus === "Disabled") {
    return <span className="text-sm font-black text-danger">OFF</span>;
  }
  return <span className="text-sm font-bold text-subtle">—</span>;
}

function EntitlementRow({ entitlement, indent, onToggle, isPending }) {
  const { t } = useI18n();
  const isEnabled = entitlement.configuredStatus === "Enabled";
  const showsUnavailableNote = entitlement.configuredStatus === "Enabled" && !entitlement.effectiveEnabled;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-t border-line py-2.5 ${
        indent ? "ps-6" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm ${indent ? "text-muted" : "font-bold text-ink"}`}>
            {entitlement.code}
          </span>
          <StateBadge configuredStatus={entitlement.configuredStatus} effectiveEnabled={entitlement.effectiveEnabled} />
          {!entitlement.implemented && (
            <span className="rounded-full bg-inset px-2 py-0.5 text-xs font-bold text-muted">
              {t("platform.entitlements.notImplemented")}
            </span>
          )}
        </div>
        {showsUnavailableNote && (
          <p className="mt-0.5 text-xs text-warning/80">{t("platform.entitlements.unavailableParentOff")}</p>
        )}
      </div>
      <button
        type="button"
        disabled={isPending || !entitlement.implemented}
        onClick={() => onToggle(entitlement, !isEnabled)}
        className={`h-8 shrink-0 rounded-xl border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
          isEnabled
            ? "border-danger bg-danger-soft text-danger hover:brightness-110"
            : "border-success bg-success-soft text-success hover:brightness-110"
        }`}
      >
        {isEnabled ? t("platform.actions.disable") : t("platform.actions.enable")}
      </button>
    </div>
  );
}

function PlatformCompanyEntitlementsContent({ companyId }) {
  const { t } = useI18n();
  const [pendingToggle, setPendingToggle] = useState(null); // { entitlement, nextEnabled }

  const entitlementsQuery = usePlatformCompanyEntitlements(companyId);
  const setEntitlementMutation = useSetPlatformCompanyEntitlement(companyId);

  const groups = useMemo(
    () => groupByApp(entitlementsQuery.data?.entitlements || []),
    [entitlementsQuery.data],
  );

  const requestToggle = (entitlement, nextEnabled) => {
    setPendingToggle({ entitlement, nextEnabled });
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    const { entitlement, nextEnabled } = pendingToggle;
    try {
      await setEntitlementMutation.mutateAsync({
        entitlementCode: entitlement.code,
        payload: { enabled: nextEnabled },
      });
      toast.success(
        nextEnabled
          ? t("platform.toast.enabled", { code: entitlement.code })
          : t("platform.toast.disabled", { code: entitlement.code }),
      );
      setPendingToggle(null);
    } catch (error) {
      toast.error(error?.message || t("platform.error.message"));
    }
  };

  if (entitlementsQuery.isLoading) {
    return <LoadingState label={t("platform.loading")} />;
  }

  if (entitlementsQuery.isError) {
    return <ErrorState title={t("platform.error.title")} message={t("platform.error.message")} />;
  }

  return (
    <div className="space-y-3">
      {groups.map(({ app, capabilities }) => (
        <section key={app.code} className="rounded-xl border border-line bg-surface p-3">
          <EntitlementRow
            entitlement={app}
            indent={false}
            onToggle={requestToggle}
            isPending={setEntitlementMutation.isPending}
          />
          {capabilities.map((capability) => (
            <EntitlementRow
              key={capability.code}
              entitlement={capability}
              indent
              onToggle={requestToggle}
              isPending={setEntitlementMutation.isPending}
            />
          ))}
        </section>
      ))}

      {pendingToggle && (
        <ConfirmToggleEntitlementDialog
          entitlement={pendingToggle.entitlement}
          nextEnabled={pendingToggle.nextEnabled}
          isPending={setEntitlementMutation.isPending}
          onConfirm={confirmToggle}
          onClose={() => setPendingToggle(null)}
        />
      )}
    </div>
  );
}

export default function PlatformCompanyEntitlementsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { companyId } = useParams();

  return (
    <AppLayout activePath={ROUTES.PLATFORM_COMPANY_ENTITLEMENTS}>
      <PlatformAccessGate>
        <main className="odoo-root space-y-3" dir="rtl">
          <header className="rounded-xl border border-line bg-surface p-4 shadow-xl shadow-black/20">
            <button
              type="button"
              onClick={() => navigate(ROUTES.PLATFORM_COMPANIES)}
              className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
            >
              <ArrowLeft size={14} />
              {t("platform.companies.title")}
            </button>
            <div className="flex items-center gap-2 text-sm text-muted">
              <ShieldCheck size={16} className="text-accent" />
              {t("nav.platform")}
            </div>
            <h1 className="mt-1 text-2xl font-black text-ink">{t("platform.entitlements.title")}</h1>
            <p className="mt-0.5 text-xs text-subtle">{t("platform.entitlements.subtitle")}</p>
          </header>

          {!companyId ? (
            <EmptyState title={t("platform.error.title")} message={t("platform.error.message")} />
          ) : (
            <PlatformCompanyEntitlementsContent companyId={companyId} />
          )}
        </main>
      </PlatformAccessGate>
    </AppLayout>
  );
}
