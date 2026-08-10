import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign, LockKeyhole, RefreshCw, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { ApiError } from "../../../shared/api/apiError";
import { formatMoney } from "../../../shared/utils/formatters";
import { useBranch } from "../../branches/context/BranchContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission, useMyCompanies } from "../../companies/hooks/useCompanies";
import { useOpenShift } from "../hooks/useOpenShift";
import {
  createOpenShiftSchema,
  getCurrencyMinorUnitDigits,
  type OpenShiftFormValues,
} from "../schemas/openShift.schema";
import type { PosTerminal } from "../types/pos.types";

const POS_OPEN_SHIFT_PERMISSION = "Pos.OpenShift";

type OpenShiftPanelProps = {
  terminal: PosTerminal;
  onOpened: () => void;
};

function mapOpenShiftError(error: ApiError) {
  switch (error.code) {
    case "PosTerminal.NotActive":
      return "This terminal is suspended or unavailable.";
    case "PosShift.AlreadyOpen":
      return "There is already an open shift on this POS terminal.";
    case "Branch.NotAvailable":
      return "The current branch is unavailable for POS operations.";
    case "Branch.NotActive":
      return "The current branch is suspended and cannot operate POS.";
    case "PosShift.InvalidOpeningFloat":
      return "Enter a valid opening float amount.";
    case "PosShift.OpeningFloatPrecisionInvalid":
      return "The opening float has too many decimal places for this currency.";
    default:
      return "Unable to open shift. Please try again.";
  }
}

export function OpenShiftPanel({ terminal, onOpened }: OpenShiftPanelProps) {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const { data: companies = [] } = useMyCompanies();
  const currentCompany = companies.find(
    (company) => company.companyId === currentCompanyId,
  );
  const currencyCode = currentCompany?.defaultCurrency || "SAR";
  const minorUnitDigits = getCurrencyMinorUnitDigits(currencyCode);
  const schema = useMemo(() => createOpenShiftSchema(currencyCode), [currencyCode]);
  const permissionQuery = useHasPermission(currentCompanyId, POS_OPEN_SHIFT_PERMISSION);
  const mutation = useOpenShift({
    companyId: currentCompanyId as string,
    branchId: currentBranchId as string,
    posTerminalId: terminal.posTerminalId,
  });
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OpenShiftFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { openingFloatAmount: "" },
  });

  const fieldMessage = errors.openingFloatAmount?.message;
  const canOpenShift = permissionQuery.hasPermission;

  const onSubmit = async (values: OpenShiftFormValues) => {
    setFormError("");
    const amount = Number(values.openingFloatAmount);

    try {
      const result = await mutation.mutateAsync({ openingFloatAmount: amount });
      toast.success(result.wasAlreadyOpen ? "Shift was already open." : "Shift opened.");
      onOpened();
    } catch (error) {
      const apiError = error as ApiError;
      const message = mapOpenShiftError(apiError);

      if (
        apiError.code === "PosShift.InvalidOpeningFloat" ||
        apiError.code === "PosShift.OpeningFloatPrecisionInvalid"
      ) {
        setError("openingFloatAmount", { message });
        return;
      }

      if (apiError.code === "PosShift.AlreadyOpen") {
        toast.info(message);
        onOpened();
        return;
      }

      setFormError(message);
    }
  };

  return (
    <section className="panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
            <WalletCards size={20} />
          </div>
          <div>
            <h1 className="brand-text text-xl font-black">Open POS Shift</h1>
            <p className="text-xs text-slate-400">
              {terminal.name} · {terminal.code}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-300">
          Currency: <span className="font-bold text-white">{currencyCode}</span>
        </div>
      </div>

      {!canOpenShift ? (
        <div className="mt-5 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-yellow-100">
            <LockKeyhole size={17} />
            Open Shift permission required
          </div>
          <p className="mt-1 text-xs text-yellow-100/75">
            You can select and inspect this terminal, but cannot open a new shift.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-300">Opening Float</span>
            <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-blue-400/60">
              <CircleDollarSign size={17} className="text-blue-300" />
              <input
                type="text"
                inputMode="decimal"
                placeholder={formatMoney(100, currencyCode, minorUnitDigits)}
                disabled={isSubmitting || mutation.isPending}
                {...register("openingFloatAmount")}
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span className="text-xs font-bold text-slate-500">{currencyCode}</span>
            </div>
            {fieldMessage && (
              <span className="mt-1.5 block text-xs text-rose-300">
                {fieldMessage === "openingFloatRequired"
                  ? "Opening float is required."
                  : fieldMessage === "openingFloatNumber"
                    ? "Enter a valid number."
                    : fieldMessage === "openingFloatMin"
                      ? "Opening float must be zero or greater."
                      : fieldMessage === "openingFloatPrecision"
                        ? `Maximum ${minorUnitDigits} decimal places for ${currencyCode}.`
                        : fieldMessage}
              </span>
            )}
          </label>

          {formError && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-[#0A84FF] text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {mutation.isPending ? <RefreshCw size={17} className="animate-spin" /> : null}
            Open Shift
          </button>
        </form>
      )}
    </section>
  );
}
