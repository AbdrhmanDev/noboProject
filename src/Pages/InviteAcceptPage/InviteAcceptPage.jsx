import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, LogIn, UserPlus, XCircle } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useAcceptInvitation } from "../../features/users-access/hooks/useUsersAccess";
import { companyQueryKeys } from "../../features/companies/hooks/useCompanies";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "../../utils/routes";

function friendlyInvitationError(error) {
  const code = error?.code;
  if (code === "CompanyInvitation.EmailMismatch") return "This invitation was sent to another email address.";
  if (code === "CompanyInvitation.EmailNotConfirmed") return "Confirm your email address before accepting this invitation.";
  if (code === "CompanyInvitation.InvalidOrExpired") return "This invitation is invalid or expired.";
  if (code === "CompanyInvitation.AlreadyAccepted") return "This invitation has already been accepted.";
  return error?.message || "Invitation could not be accepted.";
}

export default function InviteAcceptPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { status, user, logout } = useAuth();
  const acceptInvitation = useAcceptInvitation();
  const [acceptedCompanyId, setAcceptedCompanyId] = useState(null);
  const safeToken = useMemo(() => token.trim(), [token]);

  const accept = async () => {
    const result = await acceptInvitation.mutateAsync(safeToken);
    setAcceptedCompanyId(result.companyId);
    queryClient.invalidateQueries({ queryKey: companyQueryKeys.mine });
  };

  if (!safeToken) {
    return (
      <div className="bg-space flex min-h-screen items-center justify-center p-4 text-white">
        <EmptyState title="Invalid invitation" message="The invitation link is missing its token." />
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div className="bg-space flex min-h-screen items-center justify-center p-4 text-white">
        <LoadingState label="Checking session..." />
      </div>
    );
  }

  return (
    <div className="bg-space flex min-h-screen items-center justify-center p-4 text-white">
      <main className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#08111f]/95 p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-200">
            <UserPlus size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black">NOBO Invitation</h1>
            <p className="text-sm text-slate-400">Sign in with the invited email, then accept access.</p>
          </div>
        </div>

        {acceptedCompanyId ? (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 font-black text-emerald-100">
              <CheckCircle2 size={18} />
              Invitation accepted
            </div>
            <p className="mt-2 text-sm text-slate-300">Your company access is ready.</p>
            <button onClick={() => navigate(ROUTES.DASHBOARD)} className="mt-4 h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white">
              Enter NOBO
            </button>
          </div>
        ) : status === "anonymous" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              Existing users should log in. New users should register, confirm email, then return to this invitation link.
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={ROUTES.LOGIN} className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white">
                <LogIn size={16} />
                Login
              </Link>
              <Link to={ROUTES.REGISTER} className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white">
                <UserPlus size={16} />
                Register
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              Signed in as <span className="font-bold text-white">{user?.email}</span>
            </div>
            {acceptInvitation.isError && (
              <ErrorState title="Invitation not accepted" message={friendlyInvitationError(acceptInvitation.error)} />
            )}
            <div className="flex flex-wrap gap-2">
              <button disabled={acceptInvitation.isPending} onClick={accept} className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:opacity-50">
                <CheckCircle2 size={16} />
                {acceptInvitation.isPending ? "Accepting..." : "Accept Invitation"}
              </button>
              <button onClick={logout} className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white">
                <XCircle size={16} />
                Switch account
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
