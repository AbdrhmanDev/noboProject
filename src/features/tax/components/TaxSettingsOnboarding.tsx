import { LockKeyhole, Percent, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ApiError } from "../../../shared/api/apiError";
import { LoadingState } from "../../../shared/components/ui";
import { ROUTES } from "../../../utils/routes";
import { useBranch } from "../../branches/context/BranchContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { useSetCompanyTaxSettings } from "../hooks/useTax";

const TAX_MANAGE_PERMISSION = "Tax.Manage";

function mapTaxSettingsError(error: ApiError) {
  switch (error.code) {
    case "Company.NotAccessible":
      return "This company is not accessible.";
    case "Authorization.PermissionDenied":
      return "You do not have permission to manage tax settings.";
    case "Authentication.Unauthenticated":
      return "Your session has expired. Please sign in again.";
    default:
      return "Could not save tax settings. Please try again.";
  }
}

type TaxSettingsOnboardingProps = {
  onCompleted?: () => void;
};

export function TaxSettingsOnboarding({ onCompleted }: TaxSettingsOnboardingProps) {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const navigate = useNavigate();
  const permissionQuery = useHasPermission(currentCompanyId, TAX_MANAGE_PERMISSION);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const mutation = useSetCompanyTaxSettings(currentCompanyId, currentBranchId);

  const handleChoice = async (isTaxEnabled: boolean) => {
    setFormError("");
    try {
      await mutation.mutateAsync({ isTaxEnabled });
      setSaved(true);
      onCompleted?.();
    } catch (error) {
      setFormError(mapTaxSettingsError(error as ApiError));
    }
  };

  if (saved) {
    return <LoadingState label="Finishing setup..." />;
  }

  if (permissionQuery.isLoading) {
    return <LoadingState label="Checking permissions..." />;
  }

  if (!permissionQuery.hasPermission) {
    return (
      <section className="panel rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-500/15 text-yellow-300">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h1 className="brand-text text-xl font-black">Tax setup required</h1>
            <p className="text-xs text-gray-400">
              This company has not configured tax settings yet, and your role cannot
              configure them. Ask an owner or manager to set it up.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
          <Percent size={20} />
        </div>
        <div>
          <h1 className="brand-text text-xl font-black">Tax Setup Required</h1>
          <p className="text-xs text-gray-400">
            Configure how this company handles tax before creating the first sale.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <p className="text-xs font-bold text-slate-300">Enable tax for this company?</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleChoice(true)}
            disabled={mutation.isPending}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-start transition hover:border-blue-400/45 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <div className="font-bold text-white">Yes, enable tax</div>
            <p className="mt-1 text-xs text-gray-400">
              Each product will need a tax category assigned before it can be sold.
              Configure categories in Tax Administration.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleChoice(false)}
            disabled={mutation.isPending}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-start transition hover:border-blue-400/45 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <div className="font-bold text-white">No, disable tax</div>
            <p className="mt-1 text-xs text-gray-400">
              Sales will be created without tax. You can enable this later in Tax
              Administration.
            </p>
          </button>
        </div>

        {mutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <RefreshCw size={14} className="animate-spin" />
            Saving tax settings...
          </div>
        )}

        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(ROUTES.TAX_ADMIN)}
          className="text-start text-xs font-semibold text-blue-300 hover:text-blue-200"
        >
          Open full Tax Administration
        </button>
      </div>
    </section>
  );
}
