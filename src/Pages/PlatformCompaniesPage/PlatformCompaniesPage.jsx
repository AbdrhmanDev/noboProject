import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { PlatformAccessGate } from "../../features/platform/components/PlatformAccessGate";
import { usePlatformCompanies } from "../../features/platform/hooks/usePlatform";
import { platformCompanyEntitlementsPath, ROUTES } from "../../utils/routes";

const PAGE_SIZE = 25;

function StatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
      }`}
    >
      {status}
    </span>
  );
}

function PlatformCompaniesContent() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageNumber(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filters = useMemo(() => ({ pageNumber, pageSize: PAGE_SIZE, search }), [pageNumber, search]);
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

      <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
        <label className="block text-[11px] font-semibold text-slate-400">
          {t("platform.companies.search")}
          <div className="mt-1 flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
            <Search size={13} className="shrink-0 text-slate-500" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("platform.companies.search")}
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </label>
      </section>

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
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-start text-slate-500">
                  <th className="pb-2 text-start font-medium">{t("platform.companies.legalName")}</th>
                  <th className="pb-2 text-start font-medium">{t("platform.companies.businessSector")}</th>
                  <th className="pb-2 text-start font-medium">{t("platform.companies.status")}</th>
                  <th className="pb-2 text-start font-medium">{t("platform.companies.createdAt")}</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company.companyId}
                    className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]"
                    onClick={() => navigate(platformCompanyEntitlementsPath(company.companyId))}
                  >
                    <td className="py-2.5 font-bold text-white">
                      {company.legalName}
                      {company.tradeName && (
                        <span className="ms-1 text-[10px] font-normal text-slate-500">({company.tradeName})</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-300">{company.businessSectorName || "—"}</td>
                    <td className="py-2.5">
                      <StatusBadge status={company.status} />
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {new Date(company.createdAtUtc).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 text-end text-blue-300">{t("platform.companies.manage")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
