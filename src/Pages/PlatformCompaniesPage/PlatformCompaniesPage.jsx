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
    return <span className="text-slate-500">{t("platform.never")}</span>;
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
    <main className="space-y-4" dir="rtl">
      <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={16} className="text-blue-300" />
          {t("nav.platform")}
        </div>
        <h1 className="mt-1 text-2xl font-black text-white">{t("platform.companies.title")}</h1>
        <p className="mt-0.5 text-[11px] text-slate-500">{t("platform.companies.subtitle")}</p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
            <Search size={13} className="shrink-0 text-slate-500" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("platform.companies.search")}
              className="w-40 bg-transparent text-xs text-white outline-none placeholder:text-slate-600 sm:w-56"
            />
          </label>
          <select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option || "all"} value={option} className="bg-[#0c1424]">
                {option ? t(`platform.companies.status.${option}`) : t("platform.companies.status.all")}
              </option>
            ))}
          </select>
        </div>
        <PlatformDateRangeSelector preset={datePreset} onPresetChange={setDatePreset} onRangeChange={handleRangeChange} />
      </section>
      <p className="text-[11px] text-slate-500">{t("platform.activityPeriodNote")} {t("platform.lastActivityNote")}</p>

      <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-black text-white">{t("platform.companies.title")}</div>
          <div className="text-[11px] text-slate-500">
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
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-start text-slate-500">
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
                      className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                      onClick={() => navigate(platformCompanyDetailsPath(company.companyId))}
                    >
                      <td className="py-2.5 font-bold text-white">
                        {company.legalName}
                        {company.tradeName && (
                          <span className="ms-1 text-[10px] font-normal text-slate-500">({company.tradeName})</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <CompanyStatusBadge status={company.status} />
                      </td>
                      <td className="py-2.5 text-slate-300">{company.branchCount}</td>
                      <td className="py-2.5 text-slate-300">{company.userCount}</td>
                      <td className="py-2.5 text-slate-300">{company.activeUserCount}</td>
                      <td className="py-2.5 text-slate-300">{company.pendingInvitationCount}</td>
                      <td className="py-2.5">
                        <PlatformEnabledAppsBadges codes={company.enabledAppCodes} />
                      </td>
                      <td className="py-2.5 text-slate-300">{company.ordersCount}</td>
                      <td className="py-2.5 text-slate-300">{formatMoney(company.salesAmount, company.currencyCode)}</td>
                      <td className="py-2.5 text-slate-400">
                        <LastActivityCell value={company.lastActivityAtUtc} />
                      </td>
                      <td className="py-2.5 text-end text-blue-300">{t("platform.companies.viewDetails")}</td>
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
                  className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-[#0d1728] p-3 text-start transition hover:border-blue-400/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-white">
                      {company.legalName}
                      {company.tradeName && (
                        <span className="ms-1 text-[10px] font-normal text-slate-500">({company.tradeName})</span>
                      )}
                    </span>
                    <CompanyStatusBadge status={company.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    <span>{t("platform.companies.branches")}: {company.branchCount}</span>
                    <span>{t("platform.companies.users")}: {company.userCount}</span>
                    <span>{t("platform.companies.activeUsers")}: {company.activeUserCount}</span>
                    <span>{t("platform.companies.pendingInvitations")}: {company.pendingInvitationCount}</span>
                    <span>{t("platform.companies.orders")}: {company.ordersCount}</span>
                    <span>{t("platform.companies.sales")}: {formatMoney(company.salesAmount, company.currencyCode)}</span>
                  </div>
                  <PlatformEnabledAppsBadges codes={company.enabledAppCodes} />
                  <div className="text-[11px] text-slate-500">
                    {t("platform.companies.lastActivity")}: <LastActivityCell value={company.lastActivityAtUtc} />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {companiesQuery.data && companiesQuery.data.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
              className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("platform.pagination.previous")}
            </button>
            <span className="text-xs text-slate-400">
              {t("platform.pagination.page", {
                current: companiesQuery.data.pageNumber,
                total: companiesQuery.data.totalPages,
              })}
            </span>
            <button
              type="button"
              disabled={pageNumber >= companiesQuery.data.totalPages}
              onClick={() => setPageNumber((page) => page + 1)}
              className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
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
