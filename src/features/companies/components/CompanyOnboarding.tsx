import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, MapPin, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ApiError } from "../../../shared/api/apiError";
import { LoadingState } from "../../../shared/components/ui";
import { useCreateCompany, useBusinessSectors } from "../hooks/useCompanies";
import {
  createCompanySchema,
  type CreateCompanyFormValues,
} from "../schemas/createCompany.schema";
import type { CreateCompanyRequest } from "../types/company.types";

const VALIDATION_MESSAGES: Record<string, string> = {
  "company.legalNameRequired": "Legal name is required.",
  "company.legalNameTooLong": "Legal name is too long.",
  "company.tradeNameTooLong": "Trade name is too long.",
  "company.businessSectorRequired": "Select a business sector.",
  "company.taxNumberTooLong": "Tax number is too long.",
  "company.commercialRegistrationTooLong": "Commercial registration number is too long.",
  "company.countryCodeRequired": "Country code is required.",
  "company.countryCodeInvalid": "Use a 2-letter country code (e.g. SA).",
  "company.cityRequired": "City is required.",
};

function fieldMessage(key?: string) {
  if (!key) return undefined;
  return VALIDATION_MESSAGES[key] || key;
}

function mapCreateCompanyError(error: ApiError) {
  switch (error.code) {
    case "BusinessSector.InvalidForOnboarding":
      return "The selected business sector is unavailable. Please choose another.";
    case "Company.InvalidInput":
      return "Please check the company details and try again.";
    case "RegisteredAddress.Required":
      return "Registered address is required.";
    case "Authentication.Unauthenticated":
      return "Your session has expired. Please sign in again.";
    default:
      return "Could not create the company. Please try again.";
  }
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60";

export function CompanyOnboarding() {
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState(false);
  const mutation = useCreateCompany();
  const sectorsQuery = useBusinessSectors();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      legalName: "",
      tradeName: "",
      businessSectorId: "",
      taxNumber: "",
      commercialRegistrationNumber: "",
      countryCode: "SA",
      city: "",
      district: "",
      street: "",
      buildingNumber: "",
      additionalNumber: "",
      postalCode: "",
    },
  });

  const sectorsUnavailable = sectorsQuery.isError || (sectorsQuery.data?.length ?? 0) === 0;

  const onSubmit = async (values: CreateCompanyFormValues) => {
    setFormError("");

    const payload: CreateCompanyRequest = {
      legalName: values.legalName.trim(),
      tradeName: values.tradeName?.trim() || null,
      businessSectorId: values.businessSectorId,
      taxNumber: values.taxNumber?.trim() || null,
      commercialRegistrationNumber: values.commercialRegistrationNumber?.trim() || null,
      registeredAddress: {
        countryCode: values.countryCode.trim().toUpperCase(),
        city: values.city.trim(),
        district: values.district?.trim() || null,
        street: values.street?.trim() || null,
        buildingNumber: values.buildingNumber?.trim() || null,
        additionalNumber: values.additionalNumber?.trim() || null,
        postalCode: values.postalCode?.trim() || null,
      },
    };

    try {
      await mutation.mutateAsync(payload);
      setCreated(true);
    } catch (error) {
      const apiError = error as ApiError;
      const message = mapCreateCompanyError(apiError);

      if (apiError.code === "BusinessSector.InvalidForOnboarding") {
        setError("businessSectorId", { message });
        return;
      }

      setFormError(message);
    }
  };

  if (created) {
    return <LoadingState label="Setting up your company..." />;
  }

  return (
    <section className="panel rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="brand-text text-xl font-black">Welcome to NOBO</h1>
          <p className="text-xs text-gray-400">
            Create your first company to start using the system.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold text-slate-300">Legal Name</span>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("legalName")}
              className={inputClass}
            />
            {fieldMessage(errors.legalName?.message) && (
              <span className="mt-1.5 block text-xs text-rose-300">
                {fieldMessage(errors.legalName?.message)}
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-300">Trade Name (optional)</span>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("tradeName")}
              className={inputClass}
            />
            {fieldMessage(errors.tradeName?.message) && (
              <span className="mt-1.5 block text-xs text-rose-300">
                {fieldMessage(errors.tradeName?.message)}
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-300">Business Sector</span>
            <select
              disabled={isSubmitting || sectorsQuery.isLoading}
              {...register("businessSectorId")}
              className={inputClass}
            >
              <option value="">
                {sectorsQuery.isLoading ? "Loading sectors..." : "Select a sector"}
              </option>
              {sectorsQuery.data?.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
            {sectorsQuery.isError && (
              <span className="mt-1.5 block text-xs text-rose-300">
                Unable to load business sectors.
              </span>
            )}
            {fieldMessage(errors.businessSectorId?.message) && (
              <span className="mt-1.5 block text-xs text-rose-300">
                {fieldMessage(errors.businessSectorId?.message)}
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-300">Tax Number (optional)</span>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("taxNumber")}
              className={inputClass}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-slate-300">
              Commercial Registration Number (optional)
            </span>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("commercialRegistrationNumber")}
              className={inputClass}
            />
          </label>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <MapPin size={14} className="text-blue-300" />
            Registered Address
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-slate-400">Country Code</span>
              <input
                type="text"
                maxLength={2}
                disabled={isSubmitting}
                {...register("countryCode")}
                className={`${inputClass} uppercase`}
              />
              {fieldMessage(errors.countryCode?.message) && (
                <span className="mt-1.5 block text-xs text-rose-300">
                  {fieldMessage(errors.countryCode?.message)}
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-xs text-slate-400">City</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("city")}
                className={inputClass}
              />
              {fieldMessage(errors.city?.message) && (
                <span className="mt-1.5 block text-xs text-rose-300">
                  {fieldMessage(errors.city?.message)}
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-xs text-slate-400">District (optional)</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("district")}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="text-xs text-slate-400">Street (optional)</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("street")}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="text-xs text-slate-400">Building Number (optional)</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("buildingNumber")}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="text-xs text-slate-400">Additional Number (optional)</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("additionalNumber")}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="text-xs text-slate-400">Postal Code (optional)</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("postalCode")}
                className={inputClass}
              />
            </label>
          </div>
        </div>

        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending || sectorsUnavailable}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-[#0A84FF] text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {mutation.isPending ? <RefreshCw size={17} className="animate-spin" /> : null}
          Create Company
        </button>
      </form>
    </section>
  );
}
