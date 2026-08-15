import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, RefreshCw, WalletCards } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ApiError } from "../../../shared/api/apiError";
import { LoadingState } from "../../../shared/components/ui";
import { useBranch } from "../../branches/context/BranchContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { useCreatePosTerminal } from "../hooks/usePosTerminals";
import {
  createPosTerminalSchema,
  type CreatePosTerminalFormValues,
} from "../schemas/createPosTerminal.schema";

const POS_CONFIGURE_PERMISSION = "Pos.Configure";

const VALIDATION_MESSAGES: Record<string, string> = {
  "posTerminal.codeRequired": "Terminal code is required.",
  "posTerminal.codeTooLong": "Terminal code is too long.",
  "posTerminal.nameRequired": "Terminal name is required.",
  "posTerminal.nameTooLong": "Terminal name is too long.",
};

function fieldMessage(key?: string) {
  if (!key) return undefined;
  return VALIDATION_MESSAGES[key] || key;
}

function mapCreateTerminalError(error: ApiError) {
  switch (error.code) {
    case "PosTerminal.CodeAlreadyExists":
      return "A POS terminal with this code already exists.";
    case "PosTerminal.InvalidInput":
      return "Please check the terminal details and try again.";
    case "Branch.NotAvailable":
      return "The current branch is unavailable.";
    case "Branch.NotActive":
      return "The current branch is suspended and cannot have POS terminals.";
    case "Company.NotAccessible":
      return "This company is not accessible.";
    case "Authorization.PermissionDenied":
      return "You do not have permission to create a POS terminal.";
    case "Authentication.Unauthenticated":
      return "Your session has expired. Please sign in again.";
    default:
      return "Could not create the POS terminal. Please try again.";
  }
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60";

export function PosTerminalOnboarding() {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const permissionQuery = useHasPermission(currentCompanyId, POS_CONFIGURE_PERMISSION);
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState(false);
  const mutation = useCreatePosTerminal(currentCompanyId, currentBranchId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreatePosTerminalFormValues>({
    resolver: zodResolver(createPosTerminalSchema),
    defaultValues: { code: "", name: "" },
  });

  const onSubmit = async (values: CreatePosTerminalFormValues) => {
    setFormError("");

    try {
      await mutation.mutateAsync({ code: values.code.trim(), name: values.name.trim() });
      setCreated(true);
    } catch (error) {
      const apiError = error as ApiError;
      const message = mapCreateTerminalError(apiError);

      if (apiError.code === "PosTerminal.CodeAlreadyExists") {
        setError("code", { message });
        return;
      }

      setFormError(message);
    }
  };

  if (created) {
    return <LoadingState label="Setting up your POS terminal..." />;
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
            <h1 className="brand-text text-xl font-black">POS setup required</h1>
            <p className="text-xs text-gray-400">
              This branch has no POS terminal yet, and your role cannot create one. Ask an
              owner or manager to create the first terminal.
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
          <WalletCards size={20} />
        </div>
        <div>
          <h1 className="brand-text text-xl font-black">POS Setup</h1>
          <p className="text-xs text-gray-400">
            This branch does not have a POS terminal yet. Create your first terminal to
            start selling.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold text-slate-300">Terminal Code</span>
          <input
            type="text"
            maxLength={50}
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
          <span className="text-xs font-bold text-slate-300">Terminal Name</span>
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
          Create POS Terminal
        </button>
      </form>
    </section>
  );
}
