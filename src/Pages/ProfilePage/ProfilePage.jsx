import { useState } from "react";
import { Mail, ShieldCheck, ShieldAlert, User } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCurrentUserProfile } from "../../features/auth/hooks/useCurrentUserProfile";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useMyCompanies } from "../../features/companies/hooks/useCompanies";
import { ManagerPinForm } from "../../features/users-access/components/ManagerPinForm";
import { ROUTES } from "../../utils/routes";

// Real authenticated-account identity only (Cashier Real Identity task) -- Name/Email straight
// from GET /api/auth/me (ApplicationUser), no avatar/role/company mock fields, since none of
// those have any real backend concept behind them today. No edit form: no real profile-update
// endpoint exists yet (Phase 13 -- reported as a gap, not faked with a local-only save).
export default function ProfilePage({ onLogout }) {
  const { t } = useI18n();
  const profileQuery = useCurrentUserProfile();
  const { currentCompanyId } = useCompany();
  const { data: myCompanies } = useMyCompanies();
  const myMembershipId = myCompanies?.find((company) => company.companyId === currentCompanyId)?.membershipId;
  const [pinNotice, setPinNotice] = useState("");

  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.PROFILE}>
      <div className="mb-6">
        <h1 className="text-xl font-black brand-text">{t("profile.title")}</h1>
        <p className="mt-1 text-xs text-gray-400">{t("profile.subtitle")}</p>
      </div>

      {profileQuery.isLoading && <LoadingState label={t("profile.loading")} />}
      {profileQuery.isError && (
        <ErrorState title={t("platform.error.title")} message={t("platform.error.message")} />
      )}

      {!profileQuery.isLoading && !profileQuery.isError && !profileQuery.data && (
        <EmptyState title={t("platform.error.title")} message={t("platform.error.message")} />
      )}

      {profileQuery.data && (
        <div className="panel max-w-xl rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-2xl font-bold text-blue-200">
              {profileQuery.data.displayName.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-bold text-white">{profileQuery.data.displayName}</div>
              <div className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-400">
                <Mail size={12} />
                {profileQuery.data.email}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                <User size={12} />
                {t("profile.name")}
              </div>
              <div className="mt-1 text-sm font-semibold text-white">{profileQuery.data.displayName}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                <Mail size={12} />
                {t("profile.email")}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
                {profileQuery.data.email}
                {profileQuery.data.emailConfirmed ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <ShieldCheck size={11} />
                    {t("profile.emailVerified")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    <ShieldAlert size={11} />
                    {t("profile.emailNotVerified")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-gray-500">{t("profile.editingUnavailable")}</p>
        </div>
      )}

      {profileQuery.data && currentCompanyId && myMembershipId && (
        <div className="panel mt-4 max-w-xl rounded-2xl p-5">
          <h2 className="text-sm font-black text-white">{t("usersAccess.pin.myTitle")}</h2>
          {pinNotice && (
            <div className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              {pinNotice}
            </div>
          )}
          <div className="mt-3">
            <ManagerPinForm
              key={`${currentCompanyId}-${myMembershipId}`}
              companyId={currentCompanyId}
              membershipId={myMembershipId}
              onSuccess={() => setPinNotice(t("usersAccess.pin.myUpdatedNotice"))}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
