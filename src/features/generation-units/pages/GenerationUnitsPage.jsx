import { useState } from "react";
import { CirclePause, CirclePlay, Cpu, Plus, RefreshCw } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { COMPLIANCE_MANAGE_PERMISSION } from "../../authorization/constants/applicationPermissions";
import { BranchesModal } from "../../branches/components/BranchesModal";
import { ConfirmActionDialog } from "../../branches/components/ConfirmActionDialog";
import {
  useActivateGenerationUnit,
  useCreateGenerationUnit,
  useDeactivateGenerationUnit,
  useGenerationUnits,
} from "../hooks/useGenerationUnits";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function CreateUnitModal({ companyId, onClose }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const createMutation = useCreateGenerationUnit(companyId);

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    try {
      await createMutation.mutateAsync({ name: name.trim() });
      onClose();
    } catch (createError) {
      setError(getErrorMessage(createError));
    }
  };

  return (
    <BranchesModal title="New generation unit" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-semibold text-muted">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={createMutation.isPending}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <p className="text-xs text-subtle">
          Unique per company (case-insensitive). It starts Active; it is not the default unit unless the
          backend already designates one (the first unit a company gets is its default, and that cannot
          be changed here -- no endpoint supports it).
        </p>
        {error && <div className="rounded-xl border border-danger bg-danger-soft p-2 text-sm text-danger">{error}</div>}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="h-10 flex-1 rounded-xl border border-line text-sm font-bold text-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="h-10 flex-1 rounded-xl bg-accent text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </BranchesModal>
  );
}

function GenerationUnitRow({ companyId, unit, canManage }) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [error, setError] = useState("");
  const activateMutation = useActivateGenerationUnit(companyId);
  const deactivateMutation = useDeactivateGenerationUnit(companyId);

  const toggle = async () => {
    setError("");
    try {
      if (unit.status === "Active") {
        await deactivateMutation.mutateAsync(unit.id);
        setConfirmDeactivate(false);
      } else {
        await activateMutation.mutateAsync(unit.id);
      }
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
      setConfirmDeactivate(false);
    }
  };

  const isPending = activateMutation.isPending || deactivateMutation.isPending;

  return (
    <div className="rounded-xl border border-line bg-raised p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Cpu size={15} className="shrink-0 text-accent" />
            <div className="truncate text-sm font-black text-ink">{unit.name}</div>
            {unit.isDefault && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">default</span>
            )}
          </div>
          <div className="mt-1 text-xs text-subtle">
            {unit.assignedBranchCount} branch(es) assigned · created {formatDateTime(unit.createdAtUtc)}
          </div>
        </div>
        <StatusBadge tone={statusTone(unit.status)}>{unit.status}</StatusBadge>
      </div>
      {canManage && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={isPending || (unit.isDefault && unit.status === "Active")}
            title={unit.isDefault && unit.status === "Active" ? "The default unit cannot be deactivated" : ""}
            onClick={() => (unit.status === "Active" ? setConfirmDeactivate(true) : toggle())}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs font-bold text-ink hover:border-accent-line disabled:cursor-not-allowed disabled:opacity-40"
          >
            {unit.status === "Active" ? <CirclePause size={13} /> : <CirclePlay size={13} />}
            {unit.status === "Active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      )}
      {error && <div className="mt-2 rounded-xl border border-danger bg-danger-soft p-2 text-xs text-danger">{error}</div>}
      {confirmDeactivate && (
        <ConfirmActionDialog
          title="Deactivate generation unit"
          message="It stops resolving for NEW invoices and cannot receive new assignments. Existing branches, assignments and issued invoices are untouched."
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          onConfirm={toggle}
          onClose={() => setConfirmDeactivate(false)}
        />
      )}
    </div>
  );
}

export function GenerationUnitsPage() {
  const { currentCompanyId } = useCompany();
  // Compliance.Manage is the ONLY permission the backend checks for every generation-unit route --
  // there is no separate "view" permission, so this page is gated on it alone.
  const permissionQuery = useHasPermission(currentCompanyId, COMPLIANCE_MANAGE_PERMISSION);
  const canManage = permissionQuery.hasPermission;

  const unitsQuery = useGenerationUnits(currentCompanyId, canManage);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <AppLayout>
      <main className="odoo-root space-y-3" dir="rtl">
        <PageHeader
          title="Generation Units"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => unitsQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"
                >
                  <Plus size={14} /> New unit
                </button>
              )}
            </div>
          }
        />

        <div className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-xs text-subtle">
          A generation unit is a compliance foundation entity (one invoice sequence/hash chain), not a
          branch. Assigning a branch to a unit happens on the Branches page.
        </div>

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company to manage generation units." />
        ) : permissionQuery.isLoading ? (
          <LoadingState label="Checking permissions..." />
        ) : !canManage ? (
          <ErrorState title="Permission required" message="Compliance.Manage permission is required to see generation units." />
        ) : (
          <div className="rounded-xl border border-line bg-surface p-3">
            {unitsQuery.isLoading && <LoadingState label="Loading generation units..." />}
            {unitsQuery.isError && (
              <ErrorState title="Unable to load generation units" message={getErrorMessage(unitsQuery.error)} />
            )}
            {!unitsQuery.isLoading && !unitsQuery.isError && (unitsQuery.data || []).length === 0 && (
              <EmptyState title="No generation units yet" message="Create one to start assigning branches to it." />
            )}
            {!unitsQuery.isLoading && !unitsQuery.isError && (unitsQuery.data || []).length > 0 && (
              <div className="space-y-2">
                {unitsQuery.data.map((unit) => (
                  <GenerationUnitRow key={unit.id} companyId={currentCompanyId} unit={unit} canManage={canManage} />
                ))}
              </div>
            )}
          </div>
        )}

        {showCreate && <CreateUnitModal companyId={currentCompanyId} onClose={() => setShowCreate(false)} />}
      </main>
    </AppLayout>
  );
}
