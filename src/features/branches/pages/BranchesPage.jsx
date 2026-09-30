import { useState } from "react";
import { Building2, CirclePause, CirclePlay, Plus, RefreshCw, Save } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import {
  BRANCHES_MANAGE_PERMISSION,
  BRANCHES_VIEW_PERMISSION,
  COMPANY_PROFILE_VIEW_PERMISSION,
  COMPLIANCE_MANAGE_PERMISSION,
} from "../../authorization/constants/applicationPermissions";
import {
  useBranchDetails,
  useBranches,
  useChangeBranchStatus,
  useCreateBranch,
  useUpdateBranch,
} from "../hooks/useBranches";
import { useApprovedCompanyProfile } from "../hooks/useCompanyProfile";
import {
  useAssignGenerationUnitToBranch,
  useBranchGenerationUnit,
  useGenerationUnits,
} from "../../generation-units/hooks/useGenerationUnits";
import { ProposedBranchesPanel } from "../components/ProposedBranchesPanel";
import { BranchesModal } from "../components/BranchesModal";
import { ConfirmActionDialog } from "../components/ConfirmActionDialog";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

const EMPTY_ADDRESS = {
  countryCode: "",
  city: "",
  district: "",
  street: "",
  buildingNumber: "",
  additionalNumber: "",
  postalCode: "",
};

function toFormAddress(address) {
  return {
    countryCode: address.countryCode || "",
    city: address.city || "",
    district: address.district || "",
    street: address.street || "",
    buildingNumber: address.buildingNumber || "",
    additionalNumber: address.additionalNumber || "",
    postalCode: address.postalCode || "",
  };
}

function nullifyBlank(value) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// Address fields exactly as the backend's BranchAddressRequest defines them -- no extra field, no
// compliance data invented from free text.
const ADDRESS_FIELDS = [
  ["countryCode", "Country code", true],
  ["city", "City", true],
  ["district", "District", false],
  ["street", "Street", false],
  ["buildingNumber", "Building number", false],
  ["additionalNumber", "Additional number", false],
  ["postalCode", "Postal code", false],
];

function AddressFields({ address, setAddress, disabled }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ADDRESS_FIELDS.map(([field, label, required]) => (
        <label key={field} className="text-xs font-semibold text-slate-400">
          {label}
          {required && " *"}
          <input
            value={address[field]}
            onChange={(event) => setAddress((current) => ({ ...current, [field]: event.target.value }))}
            disabled={disabled}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
      ))}
    </div>
  );
}

function CreateBranchModal({ companyId, onClose }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [error, setError] = useState("");
  const createMutation = useCreateBranch(companyId);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        code: code.trim(),
        phone: nullifyBlank(phone),
        address: {
          countryCode: address.countryCode.trim(),
          city: address.city.trim(),
          district: nullifyBlank(address.district),
          street: nullifyBlank(address.street),
          buildingNumber: nullifyBlank(address.buildingNumber),
          additionalNumber: nullifyBlank(address.additionalNumber),
          postalCode: nullifyBlank(address.postalCode),
        },
      });
      onClose();
    } catch (createError) {
      setError(getErrorMessage(createError));
    }
  };

  return (
    <BranchesModal title="New branch" onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-400">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={createMutation.isPending}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            />
          </label>
          <label className="text-xs font-semibold text-slate-400">
            Code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={createMutation.isPending}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            />
          </label>
          <label className="text-xs font-semibold text-slate-400">
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={createMutation.isPending}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            />
          </label>
        </div>
        <AddressFields address={address} setAddress={setAddress} disabled={createMutation.isPending} />
        {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="h-10 flex-1 rounded-xl border border-white/10 text-xs font-bold text-slate-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="h-10 flex-1 rounded-xl bg-blue-600 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </BranchesModal>
  );
}

function GenerationUnitAssignmentRow({ companyId, branchId, canManage }) {
  const assignmentQuery = useBranchGenerationUnit(companyId, branchId, true);
  const unitsQuery = useGenerationUnits(companyId, canManage);
  const assignMutation = useAssignGenerationUnitToBranch(companyId, branchId);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  if (assignmentQuery.isLoading) return <LoadingState label="Loading generation unit assignment..." />;
  if (assignmentQuery.isError) return <ErrorState title="Unable to load assignment" message={getErrorMessage(assignmentQuery.error)} />;

  const assignment = assignmentQuery.data;
  const activeUnits = (unitsQuery.data || []).filter((unit) => unit.status === "Active");

  const assign = async () => {
    if (!selected) return;
    setError("");
    try {
      await assignMutation.mutateAsync({ generationUnitId: selected });
      setSelected("");
    } catch (assignError) {
      setError(getErrorMessage(assignError));
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-xs font-bold text-slate-400">Generation unit (ZATCA compliance)</div>
      {assignment.isAssigned ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <div>
            <div className="font-bold text-white">{assignment.generationUnitName}</div>
            <div className="text-[10px] text-slate-500">
              Status: {assignment.generationUnitStatus} · assigned {formatDateTime(assignment.assignedAtUtc)}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-amber-300">No generation unit assigned yet.</p>
      )}
      {canManage && (
        <div className="flex gap-2">
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="h-9 flex-1 rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-white outline-none"
          >
            <option value="">{assignment.isAssigned ? "Reassign to..." : "Assign to..."}</option>
            {activeUnits
              .filter((unit) => unit.id !== assignment.generationUnitId)
              .map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                  {unit.isDefault ? " (default)" : ""}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={!selected || assignMutation.isPending}
            onClick={assign}
            className="rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assignMutation.isPending ? "..." : "Set"}
          </button>
        </div>
      )}
      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-[11px] text-red-200">{error}</div>}
    </div>
  );
}

function BranchDetailsPanel({ companyId, branchId, canManage, canManageCompliance, provenance }) {
  const detailsQuery = useBranchDetails(companyId, branchId, true);
  const updateMutation = useUpdateBranch(companyId, branchId);
  const statusMutation = useChangeBranchStatus(companyId, branchId);
  const [form, setForm] = useState(null);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmStatus, setConfirmStatus] = useState(null);

  const branch = detailsQuery.data;
  if (form === null && branch) {
    // Seed the edit form once, straight from the loaded branch -- render-time state adjustment
    // (not an effect), matching this repo's own react-hooks/set-state-in-effect convention.
    setForm({ name: branch.name, code: branch.code, phoneNumber: branch.phoneNumber || "" });
    setAddress(toFormAddress(branch.address));
  }

  if (detailsQuery.isLoading || !form) return <LoadingState label="Loading branch..." />;
  if (detailsQuery.isError) return <ErrorState title="Unable to load branch" message={getErrorMessage(detailsQuery.error)} />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const updated = await updateMutation.mutateAsync({
        name: form.name.trim(),
        code: form.code.trim(),
        phoneNumber: nullifyBlank(form.phoneNumber),
        address: {
          countryCode: address.countryCode.trim(),
          city: address.city.trim(),
          district: nullifyBlank(address.district),
          street: nullifyBlank(address.street),
          buildingNumber: nullifyBlank(address.buildingNumber),
          additionalNumber: nullifyBlank(address.additionalNumber),
          postalCode: nullifyBlank(address.postalCode),
        },
      });
      setForm({ name: updated.name, code: updated.code, phoneNumber: updated.phoneNumber || "" });
      setAddress(toFormAddress(updated.address));
      setNotice("Branch updated.");
      window.setTimeout(() => setNotice(""), 3000);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  };

  const nextStatus = branch.status === "Active" ? "Suspended" : "Active";
  const changeStatus = async () => {
    try {
      await statusMutation.mutateAsync({ status: nextStatus });
      setConfirmStatus(null);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
      setConfirmStatus(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Building2 size={15} className="text-blue-300" /> Branch details
          </div>
          <h2 className="mt-1 text-xl font-black text-white">{branch.name}</h2>
          {provenance && (
            <p className="mt-1 text-[11px] text-slate-500">
              Sourced from approved profile, proposal #{provenance.ordinal} -- read-only, cannot be changed here.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={statusTone(branch.status)}>{branch.status}</StatusBadge>
          {canManage && (
            <button
              type="button"
              onClick={() => setConfirmStatus(nextStatus)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-200 hover:border-blue-400/40"
            >
              {nextStatus === "Suspended" ? <CirclePause size={13} /> : <CirclePlay size={13} />}
              {nextStatus === "Suspended" ? "Suspend" : "Activate"}
            </button>
          )}
        </div>
      </div>

      {notice && <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">{notice}</div>}
      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}

      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-400">
            Name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              disabled={!canManage || updateMutation.isPending}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            />
          </label>
          <label className="text-xs font-semibold text-slate-400">
            Code
            <input
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              disabled={!canManage || updateMutation.isPending}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            />
          </label>
          <label className="text-xs font-semibold text-slate-400">
            Phone
            <input
              value={form.phoneNumber}
              onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
              disabled={!canManage || updateMutation.isPending}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            />
          </label>
        </div>
        <AddressFields address={address} setAddress={setAddress} disabled={!canManage || updateMutation.isPending} />
        {canManage && (
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={14} /> {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        )}
      </form>

      {canManageCompliance && (
        <GenerationUnitAssignmentRow companyId={companyId} branchId={branchId} canManage={canManageCompliance} />
      )}

      {confirmStatus && (
        <ConfirmActionDialog
          title={`${nextStatus === "Suspended" ? "Suspend" : "Activate"} branch`}
          message={
            nextStatus === "Suspended"
              ? "Suspending this branch may affect POS/onboarding gates that check branch status. This does not delete the branch or its history."
              : "This reactivates the branch."
          }
          confirmLabel={nextStatus === "Suspended" ? "Suspend" : "Activate"}
          tone={nextStatus === "Suspended" ? "danger" : "default"}
          isPending={statusMutation.isPending}
          onConfirm={changeStatus}
          onClose={() => setConfirmStatus(null)}
        />
      )}
    </div>
  );
}

export function BranchesPage() {
  const { currentCompanyId } = useCompany();
  const viewPermissionQuery = useHasPermission(currentCompanyId, BRANCHES_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, BRANCHES_MANAGE_PERMISSION);
  const profilePermissionQuery = useHasPermission(currentCompanyId, COMPANY_PROFILE_VIEW_PERMISSION);
  const compliancePermissionQuery = useHasPermission(currentCompanyId, COMPLIANCE_MANAGE_PERMISSION);
  const canView = viewPermissionQuery.hasPermission;
  const canManage = managePermissionQuery.hasPermission;

  const branchesQuery = useBranches(currentCompanyId, canView);
  const profileQuery = useApprovedCompanyProfile(currentCompanyId, profilePermissionQuery.hasPermission);
  const provenanceByBranchId = new Map(
    (profileQuery.data?.proposedBranches || [])
      .filter((proposal) => proposal.materializedBranchId)
      .map((proposal) => [proposal.materializedBranchId, proposal]),
  );

  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title="Branches"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => branchesQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                >
                  <Plus size={14} /> New branch
                </button>
              )}
            </div>
          }
        />

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company to manage branches." />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking permissions..." />
        ) : !canView ? (
          <ErrorState title="Permission required" message="Branches.View permission is required to see branches." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
            <section className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
                {branchesQuery.isLoading && <LoadingState label="Loading branches..." />}
                {branchesQuery.isError && (
                  <ErrorState title="Unable to load branches" message={getErrorMessage(branchesQuery.error)} />
                )}
                {!branchesQuery.isLoading && !branchesQuery.isError && (branchesQuery.data || []).length === 0 && (
                  <EmptyState title="No branches yet" message="Create a branch, or apply one proposed by the approved registration profile." />
                )}
                {!branchesQuery.isLoading && !branchesQuery.isError && (branchesQuery.data || []).length > 0 && (
                  <div className="max-h-[calc(100vh-420px)] min-h-[240px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                    {branchesQuery.data.map((branch) => {
                      const provenance = provenanceByBranchId.get(branch.branchId);
                      return (
                        <button
                          type="button"
                          key={branch.branchId}
                          onClick={() => setSelectedBranchId(branch.branchId)}
                          className={`w-full rounded-xl border p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10 ${
                            selectedBranchId === branch.branchId ? "border-blue-400/60 bg-blue-500/15" : "border-white/10 bg-[#0d1728]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-black text-white">{branch.name}</div>
                              <div className="text-[11px] text-slate-400">{branch.code}</div>
                            </div>
                            <StatusBadge tone={statusTone(branch.status)}>{branch.status}</StatusBadge>
                          </div>
                          {provenance && (
                            <div className="mt-1.5 text-[10px] text-slate-500">From approved profile</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <ProposedBranchesPanel
                companyId={currentCompanyId}
                canView={profilePermissionQuery.hasPermission}
                canManage={canManage}
              />
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              {!selectedBranchId ? (
                <EmptyState title="Select a branch" message="Choose a branch on the left to see its details." />
              ) : (
                <BranchDetailsPanel
                  key={selectedBranchId}
                  companyId={currentCompanyId}
                  branchId={selectedBranchId}
                  canManage={canManage}
                  canManageCompliance={compliancePermissionQuery.hasPermission}
                  provenance={provenanceByBranchId.get(selectedBranchId)}
                />
              )}
            </section>
          </div>
        )}

        {showCreate && <CreateBranchModal companyId={currentCompanyId} onClose={() => setShowCreate(false)} />}
      </main>
    </AppLayout>
  );
}
