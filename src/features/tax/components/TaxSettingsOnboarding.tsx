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
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-warning-soft text-warning">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h1 className="brand-text text-xl font-black">Tax setup required</h1>
            <p className="text-xs text-muted">
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
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <Percent size={20} />
        </div>
        <div>
          <h1 className="brand-text text-xl font-black">Tax Setup Required</h1>
          <p className="text-xs text-muted">
            Configure how this company handles tax before creating the first sale.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <p className="text-xs font-bold text-muted">Enable tax for this company?</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleChoice(true)}
            disabled={mutation.isPending}
            className="rounded-xl border border-line bg-inset p-4 text-start transition hover:border-accent-line hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-55"
          >
            <div className="font-bold text-ink">Yes, enable tax</div>
            <p className="mt-1 text-xs text-muted">
              Each product will need a tax category assigned before it can be sold.
              Configure categories in Tax Administration.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleChoice(false)}
            disabled={mutation.isPending}
            className="rounded-xl border border-line bg-inset p-4 text-start transition hover:border-accent-line hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-55"
          >
            <div className="font-bold text-ink">No, disable tax</div>
            <p className="mt-1 text-xs text-muted">
              Sales will be created without tax. You can enable this later in Tax
              Administration.
            </p>
          </button>
        </div>

        {mutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <RefreshCw size={14} className="animate-spin" />
            Saving tax settings...
          </div>
        )}

        {formError && (
          <div className="rounded-xl border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(ROUTES.TAX_ADMIN)}
          className="text-start text-xs font-semibold text-accent hover:text-accent"
        >
          Open full Tax Administration
        </button>
      </div>
    </section>
  );
}
