import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { TemplateBlockPropertyField } from "./TemplateBlockPropertyField";

// One placed block, editing exactly the properties its OWN schema entry declares, in the schema's own
// declared order (never re-sorted). System blocks (Control: "System") can be reordered/removed like any
// other block -- this component does not stop that -- but removing a mandatory one, or leaving fewer
// than the mandatory items-table columns, is caught by the backend's own /validate + create-version
// calls (Template.MandatoryBlockMissing / Template.MandatoryColumnMissing), never re-implemented here.
export function TemplateBlockEditor({
  block,
  schemaBlockType,
  requiredItemsTableColumns,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  disabled,
}) {
  const setProperty = (name, value) => onChange({ ...block, [name]: value });

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1728] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300">
            {schemaBlockType?.control || "?"}
          </span>
          <span className="text-sm font-black text-white">{block.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={disabled || !canMoveUp}
            aria-label="Move up"
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={disabled || !canMoveDown}
            aria-label="Move down"
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove block"
            className="grid h-7 w-7 place-items-center rounded-lg text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {schemaBlockType && schemaBlockType.properties.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {schemaBlockType.properties.map((property) => (
            <TemplateBlockPropertyField
              key={property.name}
              property={property}
              value={block[property.name]}
              onChange={(value) => setProperty(property.name, value)}
              disabled={disabled}
              mandatoryEnumListValues={
                schemaBlockType.type === "itemsTable" && property.name === "columns"
                  ? requiredItemsTableColumns
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
