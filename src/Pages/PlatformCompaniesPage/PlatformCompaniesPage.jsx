import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { PlatformAccessGate } from "../../features/platform/components/PlatformAccessGate";
import { PlatformDateRangeSelector } from "../../features/platform/components/PlatformDateRangeSelector";
import { PlatformEnabledAppsBadges } from "../../features/platform/components/PlatformEnabledAppsBadges";
import { usePlatformCompanies } from "../../features/platform/hooks/usePlatform";
import { presetDateRange } from "../../features/platform/utils/dateRangePresets";
import { platformCompanyDetailsPath, ROUTES } from "../../utils/routes";

// Well under PLATFORM_COMPANY_LIST_MAX_PAGE_SIZE (100) -- normal paginated browsing, not a bulk
// summary fetch, so a small page size is intentional here (unlike the Overview page).
const PAGE_SIZE = 25;
const STATUS_OPTIONS = ["", "Active", "Suspended"];

function CompanyStatusBadge({ status }) {
  const { t } = useI18n();
  return (
    <StatusBadge tone={status === "Active" ? "success" : "danger"}>
      {t(`platform.companies.status.${status}`)}
    </StatusBadge>
  );
}

function LastActivityCell({ value }) {
  const { t } = useI18n();
  if (!value) {
    return <span className="text-subtle">{t("platform.never")}</span>;
  }
  return <span>{formatDateTime(value)}</span>;
}

function PlatformCompaniesContent() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [datePreset, setDatePreset] = useState("last30");
  const [dateRange, setDateRange] = useState(() => presetDateRange("last30"));

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageNumber(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const handleStatusChange = (value) => {
    setStatus(value);
    setPageNumber(1);
  };

  const handleRangeChange = (range) => {
    setDateRange(range);
    setPageNumber(1);
  };

  const filters = useMemo(
    () => ({
      pageNumber,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
      fromUtc: dateRange.fromUtc,
      toUtc: dateRange.toUtc,
    }),
    [pageNumber, search, status, dateRange],
  );
  const companiesQuery = usePlatformCompanies(filters);
  const companies = companiesQuery.data?.items || [];

  return (
    <main className="odoo-root space-y-3" dir="rtl">
      <header className="rounded-xl border border-line bg-surface p-4 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 text-sm text-muted">
          <ShieldCheck size={16} className="text-accent" />
          {t("nav.platform")}
        </div>
        <h1 className="mt-1 text-2xl font-black text-ink">{t("platform.companies.title")}</h1>
        <p className="mt-0.5 text-xs text-subtle">{t("platform.companies.subtitle")}</p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-line bg-canvas px-3">
            <Search size={13} className="shrink-0 text-subtle" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("platform.companies.search")}
              className="w-40 bg-transparent text-sm text-ink outline-none placeholder:text-subtle sm:w-56"
            />
          </label>
          <select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option || "all"} value={option} className="bg-surface">
                {option ? t(`platform.companies.status.${option}`) : t("platform.companies.status.all")}
              </option>
            ))}
          </select>
        </div>
        <PlatformDateRangeSelector preset={datePreset} onPresetChange={setDatePreset} onRangeChange={handleRangeChange} />
      </section>
      <p className="text-xs text-subtle">{t("platform.activityPeriodNote")} {t("platform.lastActivityNote")}</p>

      <section className="rounded-xl border border-line bg-surface p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-black text-ink">{t("platform.companies.title")}</div>
          <div className="text-xs text-subtle">
            {t("platform.companies.totalCount", { count: companiesQuery.data?.totalCount ?? 0 })}
          </div>
        </div>

        {companiesQuery.isLoading && <LoadingState label={t("platform.loading")} />}
        {companiesQuery.isError && (
          <ErrorState title={t("platform.error.title")} message={t("platform.error.message")} />
        )}
        {!companiesQuery.isLoading && !companiesQuery.isError && companies.length === 0 && (
          <EmptyState title={t("platform.companies.empty.title")} message={t("platform.companies.empty.message")} />
        )}

        {!companiesQuery.isLoading && !companiesQuery.isError && companies.length > 0 && (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-subtle">
                    <th className="pb-2 text-start font-medium">{t("platform.companies.legalName")}</th>
                    <th className="pb-2 text-start font-medium">{t("platform.companies.status")}</th>
                    <th className="pb-2 text-start font-medium">{t("platform.companies.branches")}</th>
                    <th className="pb-2 text-start font-medium">{t("platform.companies.users")}</th>
                    <th className="pb-2 text-start font-medium">{t("platform.companies.activeUsers")}</th>
                    <th className="pb-2 text-start font-medium">{t("platform.companies.pendingInvitations")}</th>
                    <th className="pb-2 text-start font-medium">{t("platform.companies.apps")}</th>
                    <th className="pb-2 text-start font-medium">{t("platform.companies.orders")}</th>
                    <th className="pb-2 text-start font-medium">{t("platform.companies.sales")}</th>
                    <th className="pb-2 text-start font-medium">{t("platform.companies.lastActivity")}</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr
                      key={company.companyId}
                      className="cursor-pointer border-t border-line hover:bg-raised"
                      onClick={() => navigate(platformCompanyDetailsPath(company.companyId))}
                    >
                      <td className="py-2.5 font-bold text-ink">
                        {company.legalName}
                        {company.tradeName && (
                          <span className="ms-1 text-xs font-normal text-subtle">({company.tradeName})</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <CompanyStatusBadge status={company.status} />
                      </td>
                      <td className="py-2.5 text-muted">{company.branchCount}</td>
                      <td className="py-2.5 text-muted">{company.userCount}</td>
                      <td className="py-2.5 text-muted">{company.activeUserCount}</td>
                      <td className="py-2.5 text-muted">{company.pendingInvitationCount}</td>
                      <td className="py-2.5">
                        <PlatformEnabledAppsBadges codes={company.enabledAppCodes} />
                      </td>
                      <td className="py-2.5 text-muted">{company.ordersCount}</td>
                      <td className="py-2.5 text-muted">{formatMoney(company.salesAmount, company.currencyCode)}</td>
                      <td className="py-2.5 text-muted">
                        <LastActivityCell value={company.lastActivityAtUtc} />
                      </td>
                      <td className="py-2.5 text-end text-accent">{t("platform.companies.viewDetails")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 lg:hidden">
              {companies.map((company) => (
                <button
                  key={company.companyId}
                  type="button"
                  onClick={() => navigate(platformCompanyDetailsPath(company.companyId))}
                  className="flex w-full flex-col gap-2 rounded-xl border border-line bg-raised p-3 text-start transition hover:border-accent-line"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-ink">
                      {company.legalName}
                      {company.tradeName && (
                        <span className="ms-1 text-xs font-normal text-subtle">({company.tradeName})</span>
                      )}
                    </span>
                    <CompanyStatusBadge status={company.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
                    <span>{t("platform.companies.branches")}: {company.branchCount}</span>
                    <span>{t("platform.companies.users")}: {company.userCount}</span>
                    <span>{t("platform.companies.activeUsers")}: {company.activeUserCount}</span>
                    <span>{t("platform.companies.pendingInvitations")}: {company.pendingInvitationCount}</span>
                    <span>{t("platform.companies.orders")}: {company.ordersCount}</span>
                    <span>{t("platform.companies.sales")}: {formatMoney(company.salesAmount, company.currencyCode)}</span>
                  </div>
                  <PlatformEnabledAppsBadges codes={company.enabledAppCodes} />
                  <div className="text-xs text-subtle">
                    {t("platform.companies.lastActivity")}: <LastActivityCell value={company.lastActivityAtUtc} />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {companiesQuery.data && companiesQuery.data.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
              className="rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("platform.pagination.previous")}
            </button>
            <span className="text-sm text-muted">
              {t("platform.pagination.page", {
                current: companiesQuery.data.pageNumber,
                total: companiesQuery.data.totalPages,
              })}
            </span>
            <button
              type="button"
              disabled={pageNumber >= companiesQuery.data.totalPages}
              onClick={() => setPageNumber((page) => page + 1)}
              className="rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("platform.pagination.next")}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function PlatformCompaniesPage() {
  return (
    <AppLayout activePath={ROUTES.PLATFORM_COMPANIES}>
      <PlatformAccessGate>
        <PlatformCompaniesContent />
      </PlatformAccessGate>
    </AppLayout>
  );
}
