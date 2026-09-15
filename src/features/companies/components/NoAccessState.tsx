import { ShieldOff } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { getCompanyDisplayName, isCompanyEnterable, useCompany } from "../context/CompanyContext";
import { useMyCompanies } from "../hooks/useCompanies";

// Section 7: an active CompanyMembership with zero usable permissions is a real, distinct state --
// never "Create your Company" (that is only for a genuinely membership-less account, see
// CompanyGate/CompanyOnboarding) and never a generic 404. Rendered by CompanyGate itself so it
// applies uniformly to every route, not just Dashboard.
export function NoAccessState() {
  const { t } = useI18n();
  const { logout } = useAuth();
  const { currentCompanyId, clearCompany } = useCompany();
  const { data: companies } = useMyCompanies();
  const currentCompany = companies?.find((company) => company.companyId === currentCompanyId);
  const canSwitchCompany = (companies?.filter(isCompanyEnterable).length ?? 0) > 1;

  return (
    <div className="bg-space grid min-h-screen place-items-center p-4 text-white">
      <div className="bg-stars absolute inset-0 pointer-events-none" />
      <div className="panel relative z-10 w-full max-w-md rounded-2xl p-6 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-300">
          <ShieldOff size={26} />
        </div>
        <h1 className="text-lg font-black text-white">{t("access.noAccessTitle")}</h1>
        {currentCompany && (
          <p className="mt-2 text-xs text-gray-400">
            {getCompanyDisplayName(currentCompany)}
          </p>
        )}
        <p className="mt-3 text-sm text-gray-400">{t("access.noAccessMessage")}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {canSwitchCompany && (
            <button
              type="button"
              onClick={clearCompany}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white hover:border-blue-400/40 hover:bg-blue-500/10"
            >
              {t("access.switchCompany")}
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-500"
          >
            {t("header.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
