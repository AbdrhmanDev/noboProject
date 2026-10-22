import { Plus, Trash2 } from "lucide-react";
import { PROPOSED_BRANCH_FIELDS, isFilled } from "../utils/proposedBranchFields";

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

// Proposed branches are OPTIONAL and only meaningful for an Initial registration (the backend's own
// SetProposedBranches is available on the draft regardless of kind, but this page is Initial-only --
// see the page's own comment on why amendments never touch this). The field list lives in
// utils/proposedBranchFields.js. `showErrors` outlines every empty field of every branch in red.
export function ProposedBranchesEditor({ branches, onChange, disabled, showErrors = false }) {
  const update = (index, field, value) => {
    const next = branches.map((branch, i) => (i === index ? { ...branch, [field]: value } : branch));
    onChange(next);
  };

  const add = () => onChange([...branches, { ...BLANK_BRANCH }]);
  const remove = (index) => onChange(branches.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {branches.map((branch, index) => (
        <div key={index} className="rounded-xl border border-line bg-inset p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted">Branch #{index + 1}</span>
            {!disabled && (
              <button type="button" onClick={() => remove(index)} className="grid h-6 w-6 place-items-center rounded-lg text-danger hover:bg-danger-soft">
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {PROPOSED_BRANCH_FIELDS.map(([field, label, required]) => (
              <label key={field} className="text-[10px] font-semibold text-subtle">
                {label}
                {required && " *"}
                <input
                  value={branch[field] || ""}
                  onChange={(event) => update(index, field, event.target.value)}
                  disabled={disabled}
                  aria-invalid={showErrors && !isFilled(branch[field])}
                  className={`mt-1 h-8 w-full rounded-lg bg-inset px-2 text-xs text-ink outline-none transition hover:bg-hover focus:bg-canvas focus:ring-2 focus:ring-accent-line disabled:opacity-50 ${
                    showErrors && !isFilled(branch[field]) ? "ring-2 ring-danger" : "ring-1 ring-transparent"
                  }`}
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
          className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-[11px] font-bold text-ink hover:border-accent-line"
        >
          <Plus size={12} /> Add a proposed branch
        </button>
      )}
    </div>
  );
}
