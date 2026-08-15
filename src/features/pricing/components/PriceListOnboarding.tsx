import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, RefreshCw, Tags } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { ApiError } from "../../../shared/api/apiError";
import { LoadingState } from "../../../shared/components/ui";
import { ROUTES } from "../../../utils/routes";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { useCreatePriceList } from "../hooks/usePricing";
import {
  createDefaultPriceListSchema,
  type CreateDefaultPriceListFormValues,
} from "../schemas/createDefaultPriceList.schema";

const PRICING_MANAGE_PERMISSION = "Pricing.Manage";

const VALIDATION_MESSAGES: Record<string, string> = {
  "priceList.nameRequired": "Price list name is required.",
  "priceList.nameTooLong": "Price list name is too long.",
  "priceList.taxModeRequired": "Select a tax mode.",
};

function fieldMessage(key?: string) {
  if (!key) return undefined;
  return VALIDATION_MESSAGES[key] || key;
}

function mapCreatePriceListError(error: ApiError) {
  switch (error.code) {
    case "PriceList.DefaultAlreadyExists":
      return "A default price list already exists for this company. Check Pricing Admin to make sure it is Active.";
    case "PriceList.InvalidTaxMode":
      return "Select a valid tax mode.";
    case "PriceList.InvalidInput":
      return "Please check the price list details and try again.";
    case "Company.NotAccessible":
      return "This company is not accessible.";
    case "Authorization.PermissionDenied":
      return "You do not have permission to manage pricing.";
    case "Authentication.Unauthenticated":
      return "Your session has expired. Please sign in again.";
    default:
      return "Could not create the price list. Please try again.";
  }
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60";

type PriceListOnboardingProps = {
  onCreated?: () => void;
};

export function PriceListOnboarding({ onCreated }: PriceListOnboardingProps) {
  const { currentCompanyId } = useCompany();
  const navigate = useNavigate();
  const permissionQuery = useHasPermission(currentCompanyId, PRICING_MANAGE_PERMISSION);
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState(false);
  const mutation = useCreatePriceList(currentCompanyId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateDefaultPriceListFormValues>({
    resolver: zodResolver(createDefaultPriceListSchema),
    defaultValues: { name: "", taxMode: "" },
  });

  const onSubmit = async (values: CreateDefaultPriceListFormValues) => {
    setFormError("");

    try {
      await mutation.mutateAsync({
        name: values.name.trim(),
        isDefault: true,
        taxMode: values.taxMode as "Inclusive" | "Exclusive",
      });
      setCreated(true);
      onCreated?.();
    } catch (error) {
      const apiError = error as ApiError;
      const message = mapCreatePriceListError(apiError);

      if (apiError.code === "PriceList.InvalidTaxMode") {
        setError("taxMode", { message });
        return;
      }

      if (apiError.code === "PriceList.DefaultAlreadyExists") {
        onCreated?.();
      }

      setFormError(message);
    }
  };

  if (created) {
    return <LoadingState label="Finishing pricing setup..." />;
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
            <h1 className="brand-text text-xl font-black">Pricing setup required</h1>
            <p className="text-xs text-gray-400">
              This company has no active default price list yet, and your role cannot
              configure pricing. Ask an owner or manager to set it up.
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
          <Tags size={20} />
        </div>
        <div>
          <h1 className="brand-text text-xl font-black">Pricing Setup Required</h1>
          <p className="text-xs text-gray-400">
            This company does not have an active default price list yet. Create your
            first default price list to continue setting up POS.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold text-slate-300">Price List Name</span>
          <input
            type="text"
            maxLength={200}
            disabled={isSubmitting}
            {...register("name")}
            className={inputClass}
          />
          {fieldMessage(errors.name?.message) && (
            <span className="mt-1.5 block text-xs text-rose-300">
              {fieldMessage(errors.name?.message)}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-xs font-bold text-slate-300">Tax Mode</span>
          <select disabled={isSubmitting} {...register("taxMode")} className={inputClass}>
            <option value="">Select tax mode</option>
            <option value="Inclusive">Inclusive</option>
            <option value="Exclusive">Exclusive</option>
          </select>
          {fieldMessage(errors.taxMode?.message) && (
            <span className="mt-1.5 block text-xs text-rose-300">
              {fieldMessage(errors.taxMode?.message)}
            </span>
          )}
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-400 sm:col-span-2">
          <input type="checkbox" checked disabled className="h-4 w-4 accent-blue-500" />
          Set as the default price list for this company (required for POS)
        </label>

        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 sm:col-span-2">
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-[#0A84FF] text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-55 sm:col-span-2"
        >
          {mutation.isPending ? <RefreshCw size={17} className="animate-spin" /> : null}
          Set Up Pricing
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.PRICING_ADMIN)}
          className="text-start text-xs font-semibold text-blue-300 hover:text-blue-200 sm:col-span-2"
        >
          Manage all price lists in Pricing Admin
        </button>
      </form>
    </section>
  );
}
