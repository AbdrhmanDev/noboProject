import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { PlatformAccessGate } from "../../features/platform/components/PlatformAccessGate";
import { PlatformDateRangeSelector } from "../../features/platform/components/PlatformDateRangeSelector";
import { PlatformEnabledAppsBadges } from "../../features/platform/components/PlatformEnabledAppsBadges";
import { useCurrentPlatformAccess, usePlatformCompanyDetails } from "../../features/platform/hooks/usePlatform";
import { PLATFORM_ENTITLEMENTS_VIEW } from "../../features/platform/constants/platformPermissions";
import { presetDateRange } from "../../features/platform/utils/dateRangePresets";
import { platformCompanyEntitlementsPath, ROUTES } from "../../utils/routes";

function CompanyStatusBadge({ status }) {
  const { t } = useI18n();
  return (
    <StatusBadge tone={status === "Active" ? "success" : "danger"}>
      {t(`platform.companies.status.${status}`)}
    </StatusBadge>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-subtle">{label}</div>
      <div className="mt-1 text-lg font-black text-ink">{value}</div>
    </div>
  );
}

function PlatformCompanyDetailsContent({ companyId }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [datePreset, setDatePreset] = useState("last30");
  const [dateRange, setDateRange] = useState(() => presetDateRange("last30"));

  const accessQuery = useCurrentPlatformAccess();
  const canManageEntitlements = (accessQuery.data?.permissions || []).includes(PLATFORM_ENTITLEMENTS_VIEW);

  const detailsQuery = usePlatformCompanyDetails(companyId, dateRange);
  const company = detailsQuery.data;

  if (detailsQuery.isLoading) {
    return <LoadingState label={t("platform.loading")} />;
  }

  if (detailsQuery.isError) {
    const code = detailsQuery.error?.code;
    if (code === "Company.NotAvailable") {
      return <EmptyState title={t("platform.details.notFoundTitle")} message={t("platform.details.notFoundMessage")} />;
    }
    return <ErrorState title={t("platform.error.title")} message={t("platform.error.message")} />;
  }

  if (!company) {
    return <EmptyState title={t("platform.details.notFoundTitle")} message={t("platform.details.notFoundMessage")} />;
  }

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-ink">{company.legalName}</h2>
              <CompanyStatusBadge status={company.status} />
            </div>
            {company.tradeName && <div className="text-xs text-subtle">{company.tradeName}</div>}
          </div>
          {canManageEntitlements && (
            <button
              type="button"
              onClick={() => navigate(platformCompanyEntitlementsPath(companyId))}
              className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-xs font-bold text-accent hover:bg-accent-strong/20"
            >
              {t("platform.details.manageEntitlements")}
            </button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatCard label={t("platform.details.createdAt")} value={new Date(company.createdAtUtc).toLocaleDateString()} />
          <StatCard label={t("platform.details.currency")} value={company.currencyCode} />
          <StatCard label={t("platform.companies.businessSector")} value={company.businessSectorName || "—"} />
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 text-sm font-black text-ink">{t("platform.details.section.usage")}</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label={t("platform.details.totalUsers")} value={company.userCount} />
          <StatCard label={t("platform.details.activeUsers")} value={company.activeUserCount} />
          <StatCard label={t("platform.details.branches")} value={company.branchCount} />
          <StatCard label={t("platform.details.pendingInvitations")} value={company.pendingInvitationCount} />
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 text-sm font-black text-ink">{t("platform.details.section.apps")}</div>
        <PlatformEnabledAppsBadges codes={company.entitlements.filter((e) => e.kind === "App" && e.effectiveEnabled).map((e) => e.code)} size="lg" />
      </section>

      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-black text-ink">{t("platform.details.section.activity")}</div>
          <PlatformDateRangeSelector preset={datePreset} onPresetChange={setDatePreset} onRangeChange={setDateRange} />
        </div>
        <p className="mb-3 text-xs text-subtle">{t("platform.activityPeriodNote")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatCard label={t("platform.details.orders")} value={company.ordersCount} />
          <StatCard label={t("platform.details.sales")} value={formatMoney(company.salesAmount, company.currencyCode)} />
          <StatCard
            label={t("platform.details.lastActivity")}
            value={company.lastActivityAtUtc ? formatDateTime(company.lastActivityAtUtc) : t("platform.never")}
          />
        </div>
        <p className="mt-2 text-xs text-subtle">{t("platform.lastActivityNote")}</p>
      </section>
    </div>
  );
}

export default function PlatformCompanyDetailsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { companyId } = useParams();

  return (
    <AppLayout activePath={ROUTES.PLATFORM_COMPANY_DETAILS}>
      <PlatformAccessGate>
        <main className="odoo-root space-y-3" dir="rtl">
          <header className="rounded-xl border border-line bg-surface p-4 shadow-xl shadow-black/20">
            <button
              type="button"
              onClick={() => navigate(ROUTES.PLATFORM_COMPANIES)}
              className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
            >
              <ArrowLeft size={14} />
              {t("platform.details.back")}
            </button>
            <div className="flex items-center gap-2 text-sm text-muted">
              <ShieldCheck size={16} className="text-accent" />
              {t("nav.platform")}
            </div>
            <h1 className="mt-1 text-2xl font-black text-ink">{t("platform.details.title")}</h1>
          </header>

          {!companyId ? (
            <EmptyState title={t("platform.details.notFoundTitle")} message={t("platform.details.notFoundMessage")} />
          ) : (
            <PlatformCompanyDetailsContent companyId={companyId} />
          )}
        </main>
      </PlatformAccessGate>
    </AppLayout>
  );
}
