import { Plus, Trash2 } from "lucide-react";

const BLANK_BRANCH = {
  name: "",
  code: "",
  phoneNumber: "",
  countryCode: "",
  city: "",
  district: "",
  street: "",
  buildingNumber: "",
  postalCode: "",
};

// The exact 9 fields Nobo.Api.CustomerRegistration.ProposedBranchRequest accepts -- nothing more.
// Proposed branches are OPTIONAL and only meaningful for an Initial registration (the backend's own
// SetProposedBranches is available on the draft regardless of kind, but this page is Initial-only --
// see the page's own comment on why amendments never touch this).
const FIELDS = [
  ["name", "Name", true],
  ["code", "Code", false],
  ["phoneNumber", "Phone", false],
  ["countryCode", "Country code", true],
  ["city", "City", true],
  ["district", "District", false],
  ["street", "Street", false],
  ["buildingNumber", "Building number", false],
  ["postalCode", "Postal code", false],
];

export function ProposedBranchesEditor({ branches, onChange, disabled }) {
  const update = (index, field, value) => {
    const next = branches.map((branch, i) => (i === index ? { ...branch, [field]: value } : branch));
    onChange(next);
  };

  const add = () => onChange([...branches, { ...BLANK_BRANCH }]);
  const remove = (index) => onChange(branches.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {branches.map((branch, index) => (
        <div key={index} className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Branch #{index + 1}</span>
            {!disabled && (
              <button type="button" onClick={() => remove(index)} className="grid h-6 w-6 place-items-center rounded-lg text-red-300 hover:bg-red-500/10">
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {FIELDS.map(([field, label, required]) => (
              <label key={field} className="text-[10px] font-semibold text-slate-500">
                {label}
                {required && " *"}
                <input
                  value={branch[field] || ""}
                  onChange={(event) => update(index, field, event.target.value)}
                  disabled={disabled}
                  className="mt-1 h-8 w-full rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-white outline-none disabled:opacity-50"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] font-bold text-slate-200 hover:border-blue-400/40"
        >
          <Plus size={12} /> Add a proposed branch
        </button>
      )}
    </div>
  );
}
