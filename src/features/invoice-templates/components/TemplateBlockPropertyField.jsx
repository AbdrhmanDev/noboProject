// One property control, entirely driven by the schema's own declared `kind` for that property --
// nothing here hardcodes which block type it belongs to. boolean -> checkbox, integer -> number input
// (min/max from the schema), string -> text/textarea (maxLength from the schema), guid -> text input,
// enum -> select (options from the schema's enumValues, in the schema's own order), enumList -> only
// ItemsTableBlock.columns in practice; rendered as toggle checkboxes over the schema's enumValues
// (again in schema order), with the schema's own requiredItemsTableColumns permanently checked and
// disabled (mirrors the backend's own mandatory set, not a new rule).
export function TemplateBlockPropertyField({ property, value, onChange, disabled, mandatoryEnumListValues }) {
  const label = property.name;

  if (property.kind === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm font-semibold text-muted">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
        {label}
      </label>
    );
  }

  if (property.kind === "integer") {
    return (
      <label className="block text-sm font-semibold text-muted">
        {label}
        {property.min != null && property.max != null && (
          <span className="ms-1 font-normal text-subtle">
            ({property.min}-{property.max})
          </span>
        )}
        <input
          type="number"
          min={property.min ?? undefined}
          max={property.max ?? undefined}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
          disabled={disabled}
          className="mt-1 h-9 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
        />
      </label>
    );
  }

  if (property.kind === "enum") {
    return (
      <label className="block text-sm font-semibold text-muted">
        {label}
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="mt-1 h-9 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
        >
          {(property.enumValues || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (property.kind === "enumList") {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (option, checked) => {
      if (checked) {
        if (!selected.includes(option)) onChange([...selected, option]);
        return;
      }
      onChange(selected.filter((existing) => existing !== option));
    };

    return (
      <div className="text-sm font-semibold text-muted">
        {label}
        <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg border border-line bg-canvas p-2 sm:grid-cols-4">
          {(property.enumValues || []).map((option) => {
            const isMandatory = mandatoryEnumListValues?.includes(option);
            return (
              <label key={option} className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <input
                  type="checkbox"
                  checked={selected.includes(option) || Boolean(isMandatory)}
                  disabled={disabled || isMandatory}
                  onChange={(event) => toggle(option, event.target.checked)}
                />
                {option}
                {isMandatory && <span className="text-subtle">*</span>}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  // guid | string (default): a plain text input. String properties with a real length limit above
  // 100 (customText/footer) get a textarea instead, matching how much text they actually hold.
  const isLongText = property.kind === "string" && (property.maxLength ?? 0) > 100;
  const commonProps = {
    value: value ?? "",
    onChange: (event) => onChange(event.target.value),
    maxLength: property.maxLength ?? undefined,
    disabled,
    className:
      "mt-1 w-full rounded-lg border border-line bg-canvas px-2 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50",
  };

  return (
    <label className="block text-sm font-semibold text-muted">
      {label}
      {property.kind === "guid" && <span className="ms-1 font-normal text-subtle">(GUID)</span>}
      {isLongText ? (
        <textarea rows={2} {...commonProps} className={`${commonProps.className} h-auto py-1.5`} />
      ) : (
        <input type="text" {...commonProps} className={`${commonProps.className} h-9`} />
      )}
    </label>
  );
}
