import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, RefreshCw, WalletCards } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ApiError } from "../../../shared/api/apiError";
import { LoadingState } from "../../../shared/components/ui";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { useCreatePaymentMethod } from "../hooks/usePayments";
import {
  createPaymentMethodSchema,
  type CreatePaymentMethodFormValues,
} from "../schemas/createPaymentMethod.schema";

const PAYMENTS_CONFIGURE_PERMISSION = "Payments.Configure";

const VALIDATION_MESSAGES: Record<string, string> = {
  "paymentMethod.codeRequired": "Code is required.",
  "paymentMethod.codeTooLong": "Code is too long.",
  "paymentMethod.nameRequired": "Name is required.",
  "paymentMethod.nameTooLong": "Name is too long.",
};

function fieldMessage(key?: string) {
  if (!key) return undefined;
  return VALIDATION_MESSAGES[key] || key;
}

function mapCreateError(error: ApiError) {
  switch (error.code) {
    case "PaymentMethod.CodeAlreadyExists":
      return "This code is already used by another payment method.";
    case "PaymentMethod.InvalidInput":
      return "Please check the payment method details.";
    case "Company.NotAccessible":
      return "This company is not accessible.";
    case "Authorization.PermissionDenied":
      return "You do not have permission to configure payment methods.";
    case "Authentication.Unauthenticated":
      return "Your session has expired. Please sign in again.";
    default:
      return "Could not create the payment method. Please try again.";
  }
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60";

type PaymentMethodOnboardingProps = {
  onCreated?: () => void;
};

export function PaymentMethodOnboarding({ onCreated }: PaymentMethodOnboardingProps) {
  const { currentCompanyId } = useCompany();
  const permissionQuery = useHasPermission(currentCompanyId, PAYMENTS_CONFIGURE_PERMISSION);
  const [formError, setFormError] = useState("");
  const mutation = useCreatePaymentMethod(currentCompanyId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreatePaymentMethodFormValues>({
    resolver: zodResolver(createPaymentMethodSchema),
    defaultValues: { code: "", name: "", kind: "Cash" },
  });

  const onSubmit = async (values: CreatePaymentMethodFormValues) => {
    setFormError("");
    try {
      await mutation.mutateAsync({
        code: values.code.trim(),
        name: values.name.trim(),
        kind: values.kind,
        sortOrder: 0,
      });
      onCreated?.();
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.code === "PaymentMethod.CodeAlreadyExists") {
        setError("code", { message: mapCreateError(apiError) });
        return;
      }
      setFormError(mapCreateError(apiError));
    }
  };

  if (permissionQuery.isLoading) {
    return <LoadingState label="Checking permissions..." />;
  }

  if (!permissionQuery.hasPermission) {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-3 text-xs text-amber-100">
        <div className="flex items-center gap-2 font-bold">
          <LockKeyhole size={14} />
          No active payment methods
        </div>
        <p className="mt-1 text-amber-100/80">
          No active payment methods are configured for this company. Contact an
          administrator to add one.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/15 text-blue-300">
          <WalletCards size={16} />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Payment Setup Required</div>
          <p className="text-[11px] text-gray-400">
            No active payment methods are configured. Add at least one to accept
            payments.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-3 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold text-slate-300">Code</span>
            <input
              type="text"
              disabled={isSubmitting}
              {...register("code")}
              className={inputClass}
            />
            {fieldMessage(errors.code?.message) && (
              <span className="mt-1.5 block text-xs text-rose-300">
                {fieldMessage(errors.code?.message)}
              </span>
            )}
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-300">Name</span>
            <input
              type="text"
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
        </div>
        <label className="block">
          <span className="text-xs font-bold text-slate-300">Kind</span>
          <select disabled={isSubmitting} {...register("kind")} className={inputClass}>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="BankTransfer">BankTransfer</option>
            <option value="Other">Other</option>
          </select>
        </label>

        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-[#0A84FF] text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {mutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : null}
          Add Payment Method
        </button>
      </form>
    </div>
  );
}
