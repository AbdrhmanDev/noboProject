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
    return <span className="text-xs font-black text-emerald-300">ON</span>;
  }
  if (configuredStatus === "Enabled" && !effectiveEnabled) {
    return <span className="text-xs font-black text-amber-300">ON*</span>;
  }
  if (configuredStatus === "Disabled") {
    return <span className="text-xs font-black text-rose-300">OFF</span>;
  }
  return <span className="text-xs font-bold text-slate-500">—</span>;
}

function EntitlementRow({ entitlement, indent, onToggle, isPending }) {
  const { t } = useI18n();
  const isEnabled = entitlement.configuredStatus === "Enabled";
  const showsUnavailableNote = entitlement.configuredStatus === "Enabled" && !entitlement.effectiveEnabled;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-t border-white/5 py-2.5 ${
        indent ? "ps-6" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-xs ${indent ? "text-slate-300" : "font-bold text-white"}`}>
            {entitlement.code}
          </span>
          <StateBadge configuredStatus={entitlement.configuredStatus} effectiveEnabled={entitlement.effectiveEnabled} />
          {!entitlement.implemented && (
            <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-bold text-slate-400">
              {t("platform.entitlements.notImplemented")}
            </span>
          )}
        </div>
        {showsUnavailableNote && (
          <p className="mt-0.5 text-[10px] text-amber-300/80">{t("platform.entitlements.unavailableParentOff")}</p>
        )}
      </div>
      <button
        type="button"
        disabled={isPending || !entitlement.implemented}
        onClick={() => onToggle(entitlement, !isEnabled)}
        className={`h-8 shrink-0 rounded-xl border px-3 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
          isEnabled
            ? "border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
            : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
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
        <section key={app.code} className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
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
        <main className="space-y-4" dir="rtl">
          <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
            <button
              type="button"
              onClick={() => navigate(ROUTES.PLATFORM_COMPANIES)}
              className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-white"
            >
              <ArrowLeft size={14} />
              {t("platform.companies.title")}
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={16} className="text-blue-300" />
              {t("nav.platform")}
            </div>
            <h1 className="mt-1 text-2xl font-black text-white">{t("platform.entitlements.title")}</h1>
            <p className="mt-0.5 text-[11px] text-slate-500">{t("platform.entitlements.subtitle")}</p>
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
