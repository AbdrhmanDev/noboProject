import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, MapPin, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ApiError } from "../../../shared/api/apiError";
import { LoadingState } from "../../../shared/components/ui";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { useCreateBranch } from "../hooks/useBranches";
import {
  createBranchSchema,
  type CreateBranchFormValues,
} from "../schemas/createBranch.schema";
import type { CreateBranchRequest } from "../types/branch.types";

const BRANCHES_MANAGE_PERMISSION = "Branches.Manage";

const VALIDATION_MESSAGES: Record<string, string> = {
  "branch.nameRequired": "Branch name is required.",
  "branch.nameTooLong": "Branch name is too long.",
  "branch.codeRequired": "Branch code is required.",
  "branch.codeTooLong": "Branch code is too long.",
  "branch.phoneTooLong": "Phone number is too long.",
  "branch.countryCodeRequired": "Country code is required.",
  "branch.countryCodeInvalid": "Use a 2-letter country code (e.g. SA).",
  "branch.cityRequired": "City is required.",
};

function fieldMessage(key?: string) {
  if (!key) return undefined;
  return VALIDATION_MESSAGES[key] || key;
}

function mapCreateBranchError(error: ApiError) {
  switch (error.code) {
    case "Branch.CodeAlreadyExists":
      return "A branch with this code already exists.";
    case "Branch.InvalidInput":
      return "Please check the branch details and try again.";
    case "Branch.AddressRequired":
      return "Registered address is required.";
    case "Company.NotAccessible":
      return "This company is not accessible.";
    case "Authorization.PermissionDenied":
      return "You do not have permission to create a branch.";
    case "Authentication.Unauthenticated":
      return "Your session has expired. Please sign in again.";
    default:
      return "Could not create the branch. Please try again.";
  }
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-accent-line disabled:cursor-not-allowed disabled:opacity-60";

export function BranchOnboarding() {
  const { currentCompanyId } = useCompany();
  const permissionQuery = useHasPermission(currentCompanyId, BRANCHES_MANAGE_PERMISSION);
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState(false);
  const mutation = useCreateBranch(currentCompanyId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: "",
      code: "",
      phone: "",
      countryCode: "SA",
      city: "",
      district: "",
      street: "",
      buildingNumber: "",
      additionalNumber: "",
      postalCode: "",
    },
  });

  const onSubmit = async (values: CreateBranchFormValues) => {
    setFormError("");

    const payload: CreateBranchRequest = {
      name: values.name.trim(),
      code: values.code.trim(),
      phone: values.phone?.trim() || null,
      address: {
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
      const message = mapCreateBranchError(apiError);

      if (apiError.code === "Branch.CodeAlreadyExists") {
        setError("code", { message });
        return;
      }

      setFormError(message);
    }
  };

  if (created) {
    return <LoadingState label="Setting up your branch..." />;
  }

  if (permissionQuery.isLoading) {
    return <LoadingState label="Checking permissions..." />;
  }

  if (!permissionQuery.hasPermission) {
    return (
      <section className="panel rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-warning-soft text-warning">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h1 className="brand-text text-xl font-black">Branch setup required</h1>
            <p className="text-sm text-muted">
              This company has no branches yet, and your role cannot create one. Ask an
              owner or manager to create the first branch.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <MapPin size={20} />
        </div>
        <div>
          <h1 className="brand-text text-xl font-black">Create your first branch</h1>
          <p className="text-sm text-muted">
            Company created successfully. Create your first branch to continue.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-muted">Branch Name</span>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("name")}
              className={inputClass}
            />
            {fieldMessage(errors.name?.message) && (
              <span className="mt-1.5 block text-sm text-danger">
                {fieldMessage(errors.name?.message)}
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-bold text-muted">Branch Code</span>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("code")}
              className={inputClass}
            />
            {fieldMessage(errors.code?.message) && (
              <span className="mt-1.5 block text-sm text-danger">
                {fieldMessage(errors.code?.message)}
              </span>
            )}
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-bold text-muted">Phone Number (optional)</span>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("phone")}
              className={inputClass}
            />
            {fieldMessage(errors.phone?.message) && (
              <span className="mt-1.5 block text-sm text-danger">
                {fieldMessage(errors.phone?.message)}
              </span>
            )}
          </label>
        </div>

        <div>
          <div className="text-sm font-bold text-muted">Registered Address</div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-muted">Country Code</span>
              <input
                type="text"
                maxLength={2}
                disabled={isSubmitting}
                {...register("countryCode")}
                className={`${inputClass} uppercase`}
              />
              {fieldMessage(errors.countryCode?.message) && (
                <span className="mt-1.5 block text-sm text-danger">
                  {fieldMessage(errors.countryCode?.message)}
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-sm text-muted">City</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("city")}
                className={inputClass}
              />
              {fieldMessage(errors.city?.message) && (
                <span className="mt-1.5 block text-sm text-danger">
                  {fieldMessage(errors.city?.message)}
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-sm text-muted">District (optional)</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("district")}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="text-sm text-muted">Street (optional)</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("street")}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="text-sm text-muted">Building Number (optional)</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("buildingNumber")}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="text-sm text-muted">Additional Number (optional)</span>
              <input
                type="text"
                disabled={isSubmitting}
                {...register("additionalNumber")}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="text-sm text-muted">Postal Code (optional)</span>
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
          <div className="rounded-xl border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-black text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-55"
        >
          {mutation.isPending ? <RefreshCw size={17} className="animate-spin" /> : null}
          Create Branch
        </button>
      </form>
    </section>
  );
}
