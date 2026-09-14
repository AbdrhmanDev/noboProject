import { useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { PlatformAccessGate } from "../../features/platform/components/PlatformAccessGate";
import { PLATFORM_STAFF_MANAGE, PLATFORM_STAFF_VIEW } from "../../features/platform/constants/platformPermissions";
import {
  useAssignPlatformStaffRole,
  useCurrentPlatformAccess,
  usePlatformStaff,
  useRevokePlatformStaffRole,
} from "../../features/platform/hooks/usePlatform";
import { AssignPlatformAdminDialog } from "../../features/platform/components/AssignPlatformAdminDialog";
import { ConfirmRevokeStaffRoleDialog } from "../../features/platform/components/ConfirmRevokeStaffRoleDialog";
import { ROUTES } from "../../utils/routes";

const PLATFORM_ADMIN_CODE = "PLATFORM_ADMIN";

function RoleBadge({ code }) {
  const isOwner = code === "PLATFORM_OWNER";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isOwner ? "bg-blue-500/15 text-blue-300" : "bg-emerald-500/15 text-emerald-300"
      }`}
    >
      {code}
    </span>
  );
}

function PlatformStaffContent() {
  const { t } = useI18n();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null); // member

  const accessQuery = useCurrentPlatformAccess();
  const canManage = (accessQuery.data?.permissions || []).includes(PLATFORM_STAFF_MANAGE);

  const staffQuery = usePlatformStaff();
  const staff = staffQuery.data || [];

  const assignMutation = useAssignPlatformStaffRole();
  const revokeMutation = useRevokePlatformStaffRole();

  const assignAdmin = async (email) => {
    await assignMutation.mutateAsync({ email, roleCode: PLATFORM_ADMIN_CODE });
    toast.success(t("platform.staff.toast.assigned", { email }));
    setAssignDialogOpen(false);
  };

  const revokeAdmin = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation.mutateAsync({ userId: revokeTarget.userId, roleCode: PLATFORM_ADMIN_CODE });
      toast.success(t("platform.staff.toast.revoked", { name: revokeTarget.displayName }));
      setRevokeTarget(null);
    } catch (error) {
      toast.error(error?.message || t("platform.error.message"));
    }
  };

  return (
    <main className="space-y-4" dir="rtl">
      <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={16} className="text-blue-300" />
              {t("nav.platform")}
            </div>
            <h1 className="mt-1 text-2xl font-black text-white">{t("platform.staff.title")}</h1>
            <p className="mt-0.5 text-[11px] text-slate-500">{t("platform.staff.subtitle")}</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setAssignDialogOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
            >
              <UserPlus size={14} />
              {t("platform.staff.assignAdmin")}
            </button>
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
        {staffQuery.isLoading && <LoadingState label={t("platform.loading")} />}
        {staffQuery.isError && (
          <ErrorState title={t("platform.error.title")} message={t("platform.error.message")} />
        )}
        {!staffQuery.isLoading && !staffQuery.isError && staff.length === 0 && (
          <EmptyState title={t("platform.staff.empty.title")} message={t("platform.staff.empty.message")} />
        )}

        {!staffQuery.isLoading && !staffQuery.isError && staff.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-start text-slate-500">
                  <th className="pb-2 text-start font-medium">{t("platform.staff.name")}</th>
                  <th className="pb-2 text-start font-medium">{t("platform.staff.email")}</th>
                  <th className="pb-2 text-start font-medium">{t("platform.staff.roles")}</th>
                  <th className="pb-2 text-start font-medium">{t("platform.staff.emailConfirmed")}</th>
                  {canManage && <th className="pb-2" />}
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const hasAdmin = member.roles.some((role) => role.code === PLATFORM_ADMIN_CODE);
                  return (
                    <tr key={member.userId} className="border-t border-white/5">
                      <td className="py-2.5 font-bold text-white">{member.displayName}</td>
                      <td className="py-2.5 text-slate-300">{member.email}</td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {member.roles.map((role) => (
                            <RoleBadge key={role.roleId} code={role.code} />
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5">
                        {member.emailConfirmed ? (
                          <span className="text-emerald-300">{t("platform.staff.confirmed")}</span>
                        ) : (
                          <span className="text-amber-300">{t("platform.staff.unconfirmed")}</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-2.5 text-end">
                          {hasAdmin && (
                            <button
                              type="button"
                              onClick={() => setRevokeTarget(member)}
                              className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-500/20"
                            >
                              {t("platform.staff.revokeAdmin")}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {assignDialogOpen && (
        <AssignPlatformAdminDialog
          isPending={assignMutation.isPending}
          onConfirm={assignAdmin}
          onClose={() => setAssignDialogOpen(false)}
        />
      )}

      {revokeTarget && (
        <ConfirmRevokeStaffRoleDialog
          member={revokeTarget}
          isPending={revokeMutation.isPending}
          onConfirm={revokeAdmin}
          onClose={() => setRevokeTarget(null)}
        />
      )}
    </main>
  );
}

export default function PlatformStaffPage() {
  return (
    <AppLayout activePath={ROUTES.PLATFORM_STAFF}>
      <PlatformAccessGate requiredPermission={PLATFORM_STAFF_VIEW}>
        <PlatformStaffContent />
      </PlatformAccessGate>
    </AppLayout>
  );
}
