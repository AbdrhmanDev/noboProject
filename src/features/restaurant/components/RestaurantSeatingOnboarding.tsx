import { zodResolver } from "@hookform/resolvers/zod";
import { Armchair, Layers3, LockKeyhole, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ApiError } from "../../../shared/api/apiError";
import { LoadingState } from "../../../shared/components/ui";
import { useBranch } from "../../branches/context/BranchContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import {
  useCreateRestaurantFloor,
  useCreateRestaurantTable,
  useRestaurantFloors,
} from "../hooks/useRestaurantSeating";
import {
  firstFloorSchema,
  firstTableSchema,
  type FirstFloorFormValues,
  type FirstTableFormValues,
} from "../schemas/firstSeating.schema";

const RESTAURANT_MANAGE_PERMISSION = "Restaurant.Manage";

const VALIDATION_MESSAGES: Record<string, string> = {
  "floor.nameRequired": "Floor name is required.",
  "floor.nameTooLong": "Floor name is too long.",
  "table.codeRequired": "Table code is required.",
  "table.codeTooLong": "Table code is too long.",
  "table.nameTooLong": "Table name is too long.",
};

function fieldMessage(key?: string) {
  if (!key) return undefined;
  return VALIDATION_MESSAGES[key] || key;
}

function mapStepError(error: ApiError) {
  switch (error.code) {
    case "RestaurantFloor.InvalidInput":
      return "Please check the floor name.";
    case "RestaurantFloor.NotAvailable":
      return "The selected floor is unavailable.";
    case "RestaurantTable.InvalidInput":
      return "Please check the table details.";
    case "RestaurantTable.CodeAlreadyExists":
      return "This table code is already used on this floor.";
    case "Branch.NotAvailable":
      return "The current branch is unavailable.";
    case "Company.NotAccessible":
      return "This company is not accessible.";
    case "Authorization.PermissionDenied":
      return "You do not have permission to manage restaurant seating.";
    case "Authentication.Unauthenticated":
      return "Your session has expired. Please sign in again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60";

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
      {message}
    </div>
  );
}

function StepButton({
  label,
  pending,
  type = "button",
  onClick,
}: {
  label: string;
  pending?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={pending}
      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-[#0A84FF] text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
    >
      {pending ? <RefreshCw size={16} className="animate-spin" /> : null}
      {label}
    </button>
  );
}

type FloorStepProps = {
  companyId: string | null;
  branchId: string | null;
  onSelected: (floorId: string, floorName: string) => void;
};

function FloorStep({ companyId, branchId, onSelected }: FloorStepProps) {
  const floorsQuery = useRestaurantFloors(companyId, branchId, { status: "Active" });
  const mutation = useCreateRestaurantFloor(companyId, branchId);
  const [selection, setSelection] = useState("new");
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FirstFloorFormValues>({
    resolver: zodResolver(firstFloorSchema),
    defaultValues: { name: "" },
  });

  if (floorsQuery.isLoading) return <LoadingState label="Loading floors..." />;

  const floors = floorsQuery.data || [];

  const handleContinue = () => {
    if (selection === "new") return;
    const floor = floors.find((f) => f.restaurantFloorId === selection);
    onSelected(selection, floor?.name || "");
  };

  const onCreate = async (values: FirstFloorFormValues) => {
    setFormError("");
    try {
      const created = await mutation.mutateAsync({ name: values.name.trim(), sortOrder: 0 });
      onSelected(created.restaurantFloorId, created.name);
    } catch (error) {
      setFormError(mapStepError(error as ApiError));
    }
  };

  return (
    <div className="grid gap-3">
      {floors.length > 0 && (
        <label className="block">
          <span className="text-xs font-bold text-slate-300">Floor</span>
          <select
            value={selection}
            onChange={(event) => setSelection(event.target.value)}
            className={inputClass}
          >
            <option value="new">+ Create new floor</option>
            {floors.map((floor) => (
              <option key={floor.restaurantFloorId} value={floor.restaurantFloorId}>
                {floor.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {selection === "new" ? (
        <form onSubmit={handleSubmit(onCreate)} className="grid gap-3">
          <label className="block">
            <span className="text-xs font-bold text-slate-300">New Floor Name</span>
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
          {formError && <ErrorBanner message={formError} />}
          <StepButton type="submit" pending={isSubmitting || mutation.isPending} label="Create & Continue" />
        </form>
      ) : (
        <>
          {formError && <ErrorBanner message={formError} />}
          <StepButton onClick={handleContinue} label="Continue" />
        </>
      )}
    </div>
  );
}

type TableStepProps = {
  companyId: string | null;
  branchId: string | null;
  floorId: string;
  floorName: string;
  onDone: () => void;
};

function TableStep({ companyId, branchId, floorId, floorName, onDone }: TableStepProps) {
  const mutation = useCreateRestaurantTable(companyId, branchId, floorId);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FirstTableFormValues>({
    resolver: zodResolver(firstTableSchema),
    defaultValues: { code: "", name: "" },
  });

  const onSubmit = async (values: FirstTableFormValues) => {
    setFormError("");
    try {
      await mutation.mutateAsync({
        code: values.code.trim(),
        name: values.name?.trim() || null,
        sortOrder: 0,
      });
      onDone();
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.code === "RestaurantTable.CodeAlreadyExists") {
        setError("code", { message: mapStepError(apiError) });
        return;
      }
      setFormError(mapStepError(apiError));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      <p className="text-xs text-gray-500">
        Floor: <span className="text-gray-300">{floorName}</span>
      </p>
      <label className="block">
        <span className="text-xs font-bold text-slate-300">Table Code</span>
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
        <span className="text-xs font-bold text-slate-300">Table Name (optional)</span>
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
      {formError && <ErrorBanner message={formError} />}
      <StepButton type="submit" pending={isSubmitting || mutation.isPending} label="Create Table" />
    </form>
  );
}

type RestaurantSeatingOnboardingProps = {
  onCompleted?: () => void;
};

export function RestaurantSeatingOnboarding({ onCompleted }: RestaurantSeatingOnboardingProps) {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const permissionQuery = useHasPermission(currentCompanyId, RESTAURANT_MANAGE_PERMISSION);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [floorName, setFloorName] = useState("");
  const [created, setCreated] = useState(false);

  if (created) {
    return <LoadingState label="Setting up seating..." />;
  }

  if (permissionQuery.isLoading) {
    return <LoadingState label="Checking permissions..." />;
  }

  if (!permissionQuery.hasPermission) {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-100">
          <LockKeyhole size={16} />
          Restaurant setup required
        </div>
        <p className="mt-1 text-xs text-amber-100/80">
          No tables are configured for this branch, and your role cannot set them
          up. Ask an owner or manager to configure restaurant seating.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/15 text-blue-300">
          {floorId ? <Armchair size={16} /> : <Layers3 size={16} />}
        </div>
        <div>
          <div className="text-sm font-bold text-white">Restaurant Setup Required</div>
          <p className="text-[11px] text-gray-400">
            No tables are configured for this branch.
          </p>
        </div>
      </div>

      <div className="mt-3">
        {!floorId ? (
          <FloorStep
            companyId={currentCompanyId}
            branchId={currentBranchId}
            onSelected={(id, name) => {
              setFloorId(id);
              setFloorName(name);
            }}
          />
        ) : (
          <TableStep
            companyId={currentCompanyId}
            branchId={currentBranchId}
            floorId={floorId}
            floorName={floorName}
            onDone={() => {
              setCreated(true);
              onCompleted?.();
            }}
          />
        )}
      </div>
    </div>
  );
}
