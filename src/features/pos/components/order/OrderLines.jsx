import { useState } from "react";
import { ChevronDown, Minus, Plus, ShoppingCart, SlidersHorizontal, Trash2 } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { useI18n } from "../../../../i18n/I18nContext";
import { brandAccentStyle } from "../../utils/brandAccents";
import { variantSizeLabel } from "../../utils/posFormatters";

// Next modifier-option set for a line when one option chip is tapped in the inline extras editor,
// honouring the group's own min/max: a single-choice group (max 1) swaps its option, a multi-choice
// group toggles it (never above max, never below min). Returns null when the tap changes nothing.
function toggleModifierOption(line, group, optionId) {
  const current = line.modifiers.map((modifier) => modifier.modifierOptionId);
  const groupOptionIds = new Set(group.options.map((option) => option.modifierOptionId));
  const selectedInGroup = current.filter((id) => groupOptionIds.has(id));

  if (current.includes(optionId)) {
    if (selectedInGroup.length <= group.minSelections) return null;
    return current.filter((id) => id !== optionId);
  }

  if (group.maxSelections === 1) {
    return [...current.filter((id) => !groupOptionIds.has(id)), optionId];
  }
  if (group.maxSelections > 0 && selectedInGroup.length >= group.maxSelections) return null;
  return [...current, optionId];
}

export function OrderLines({
  draftLines,
  draftOrder,
  catalogCurrencyCode,
  canEditDraft,
  isLinePending,
  changeQty,
  removeDraftLine,
  selectedLineId,
  onSelectLine,
  onEditQuantity,
  // Inline extras editor (no modal): catalog modifier groups per productVariantId, and the handler
  // that commits a line's new modifier-option set (POSPage's changeLineModifiers).
  modifierGroupsByVariantId,
  onChangeLineModifiers,
  // Inline size switcher: every variant of the line's product (size order) per productVariantId,
  // and the handler that moves a line to another variant (POSPage's changeLineVariant).
  sizeVariantsByVariantId,
  onChangeLineVariant,
  // "+ another size": adds the same product in another size as a NEW line (POSPage's addLineInSize).
  onAddLineInSize,
  // Payment step (and any other purely-informational use): no stepper, no trash, no row click —
  // the cashier is reviewing what's already locked in, not editing it. Collapsing each line to one
  // glanceable row (qty · name · total) instead of the editable two-line card also means more of
  // the order is visible at once without scrolling, which matters most exactly here.
  readOnly = false,
}) {
  const { t } = useI18n();
  // Which line's extras editor is open, by position: a line's salesOrderLineId can change once its
  // modifiers are saved, its position in the list doesn't.
  const [extrasOpenIndex, setExtrasOpenIndex] = useState(null);
  // Which line's "+ another size" picker is open -- by position, same reason as above.
  const [addSizeOpenIndex, setAddSizeOpenIndex] = useState(null);
  // This list is the one thing in the basket that scrolls: the sidebar has a definite height and
  // everything around this (header, totals, actions, CTA) is fixed-size, so `flex-1` gives the
  // list whatever is left and `overflow-y-auto` scrolls it. `min-h-[170px]` keeps at least a
  // couple of lines visible even on a short screen.
  //
  // Two compact lines per item (name+modifiers, then stepper+total) instead of the old tall card
  // (avatar box, separate qty/total row, generous padding) — a single row was tried first, but at
  // the order panel's ~380px width there isn't room next to a 44px-tall stepper for both a
  // readable name AND a separate price column, so the name got crushed. This keeps the stepper's
  // 44px touch height, gives the name its own full-width line, and is still far shorter than the
  // original card. The selected line gets the brand-yellow accent bar on its inline-start edge
  // plus a tinted background, so selection isn't carried by a faint yellow alone.
  return (
    <div className="min-h-[170px] flex-1 space-y-1 overflow-y-auto pe-1 scrollbar-none">
      {!draftLines.length && (
        <div className="grid h-full min-h-36 place-items-center rounded-xl border border-dashed border-pos-border text-center">
          <div>
            <ShoppingCart className="mx-auto mb-2 text-pos-muted" size={26} />
            <p className="text-xs text-pos-muted">{t("pos.lines.empty")}</p>
            <p className="mt-1 text-[10px] text-pos-muted">{t("pos.lines.emptyHint")}</p>
          </div>
        </div>
      )}
      {draftLines.map((item, index) => {
        const pending = isLinePending?.(item.salesOrderLineId);
        const selected = selectedLineId === item.salesOrderLineId;
        const lineTotal = formatMoney(
          item.lineSubtotalAmount,
          draftOrder?.currencyCode || catalogCurrencyCode,
          draftOrder?.currencyMinorUnitDigits || 2,
        );
        const modifierNames = item.modifiers.map((modifier) => modifier.modifierOptionName).join("، ");
        const modifierGroups = modifierGroupsByVariantId?.get(item.productVariantId) ?? [];
        const canEditExtras = Boolean(onChangeLineModifiers) && modifierGroups.length > 0;
        const extrasOpen = canEditExtras && extrasOpenIndex === index;
        const sizeVariants = onChangeLineVariant ? sizeVariantsByVariantId?.get(item.productVariantId) ?? [] : [];
        const addSizeOpen = Boolean(onAddLineInSize) && sizeVariants.length > 0 && addSizeOpenIndex === index;

        if (readOnly) {
          return (
            <div
              key={item.salesOrderLineId}
              style={brandAccentStyle(index)}
              className="flex items-center gap-2 rounded-pos border border-pos-border bg-pos-card px-2 py-1.5"
            >
              <span className="pos-num pos-chip shrink-0 rounded-pos px-1.5 py-0.5 text-[11px] font-black">
                {Number(item.quantity)}×
              </span>
              <span className="pos-fs-line min-w-0 flex-1 truncate text-pos-text">
                {item.productName}
                {item.variantName && item.variantName !== "Standard" && (
                  <span className="text-pos-muted"> · {item.variantName}</span>
                )}
                {modifierNames && <span className="text-pos-primary-text"> · {modifierNames}</span>}
              </span>
              <span className="pos-num pos-fs-line shrink-0 font-bold text-pos-text">{lineTotal}</span>
            </div>
          );
        }

        return (
          <div
            key={item.salesOrderLineId}
            onClick={() => onSelectLine?.(item.salesOrderLineId)}
            style={brandAccentStyle(index)}
            className={`relative cursor-pointer rounded-pos border px-2 py-1 transition ${
              selected
                ? "border-pos-warning-text/70 bg-pos-warning-tint before:absolute before:inset-y-1.5 before:start-0 before:w-[3px] before:rounded-full before:bg-pos-warning"
                : "border-pos-border bg-pos-card hover:border-pos-primary"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="pos-fs-line min-w-0 flex-1 truncate text-pos-text">
                {item.productName}
                {item.variantName && item.variantName !== "Standard" && (
                  <span className="text-pos-muted"> · {item.variantName}</span>
                )}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeDraftLine(item.salesOrderLineId);
                }}
                disabled={!canEditDraft}
                aria-label={t("pos.lines.remove")}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-pos text-pos-danger-text transition hover:bg-pos-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={13} />
              </button>
            </div>
            {modifierNames && (
              <div className="pos-fs-label mt-0.5 line-clamp-2 text-pos-primary-text">+ {modifierNames}</div>
            )}

            {/* Size switcher: moves THIS line to another size (same quantity). One size per line. */}
            {sizeVariants.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
                {sizeVariants.map((variant) => {
                  const isCurrent = variant.productVariantId === item.productVariantId;
                  return (
                    <button
                      key={variant.productVariantId}
                      type="button"
                      aria-pressed={isCurrent}
                      disabled={!canEditDraft}
                      title={variant.variantName}
                      onClick={() => onChangeLineVariant(item, variant)}
                      className={`pos-num grid h-8 min-w-8 place-items-center rounded-full border px-1.5 text-xs font-bold transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                        isCurrent
                          ? "border-pos-primary-strong bg-pos-primary-strong text-white"
                          : "border-pos-border bg-pos-card text-pos-muted hover:border-pos-primary hover:text-pos-primary-text"
                      }`}
                    >
                      {variantSizeLabel(variant.variantName)}
                    </button>
                  );
                })}
                {onAddLineInSize && (
                  <button
                    type="button"
                    aria-expanded={addSizeOpen}
                    disabled={!canEditDraft}
                    onClick={() => setAddSizeOpenIndex(addSizeOpen ? null : index)}
                    className={`pos-fs-label ms-1 flex h-8 items-center gap-1 rounded-full border border-dashed px-2.5 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      addSizeOpen
                        ? "border-pos-primary bg-pos-tint text-pos-primary-text"
                        : "border-pos-border text-pos-text hover:border-pos-primary hover:text-pos-primary-text"
                    }`}
                  >
                    <Plus size={13} />
                    {t("pos.lines.addAnotherSize")}
                  </button>
                )}
              </div>
            )}

            {/* "+ another size" picker: each size adds a NEW line of this product (qty 1); this
                line is left as it is. */}
            {addSizeOpen && (
              <div
                className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-pos border border-dashed border-pos-primary/50 bg-pos-card p-1.5"
                onClick={(event) => event.stopPropagation()}
              >
                <span className="pos-fs-label text-pos-muted">{t("pos.lines.chooseSizeToAdd")}</span>
                {sizeVariants.map((variant) => (
                  <button
                    key={variant.productVariantId}
                    type="button"
                    disabled={!canEditDraft}
                    title={variant.variantName}
                    onClick={() => {
                      onAddLineInSize(variant);
                      setAddSizeOpenIndex(null);
                    }}
                    className="pos-num flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-full bg-pos-primary-strong px-2 text-xs font-bold text-white transition hover:bg-pos-primary-strong-hover active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={11} />
                    {variantSizeLabel(variant.variantName)}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-1 flex items-center justify-between gap-2">
              <div
                className="flex h-11 shrink-0 items-center rounded-pos border border-pos-border bg-pos-card"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => changeQty(item.salesOrderLineId, -1)}
                  disabled={!canEditDraft}
                  className="grid h-11 w-11 place-items-center text-pos-muted hover:bg-pos-tint hover:text-pos-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onEditQuantity?.(item.salesOrderLineId, Number(item.quantity))}
                  disabled={!canEditDraft || !onEditQuantity}
                  aria-label={t("pos.lines.editQty")}
                  className={`pos-fs-line min-w-9 px-1 text-center font-bold text-pos-text transition-opacity ${pending ? "opacity-60" : ""} ${onEditQuantity ? "hover:text-pos-primary-text" : ""}`}
                >
                  {Number(item.quantity)}
                </button>
                <button
                  type="button"
                  onClick={() => changeQty(item.salesOrderLineId, 1)}
                  disabled={!canEditDraft}
                  className="grid h-11 w-11 place-items-center text-pos-primary-text hover:bg-pos-tint disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={15} />
                </button>
              </div>

              {canEditExtras && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setExtrasOpenIndex(extrasOpen ? null : index);
                  }}
                  disabled={!canEditDraft}
                  aria-expanded={extrasOpen}
                  className={`pos-fs-label flex h-11 shrink-0 items-center gap-1 rounded-pos border px-2.5 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    extrasOpen
                      ? "border-pos-primary bg-pos-tint text-pos-primary-text"
                      : "border-pos-border bg-pos-card text-pos-text hover:border-pos-primary"
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  {t("pos.lines.extras")}
                  <ChevronDown size={14} className={`transition-transform ${extrasOpen ? "rotate-180" : ""}`} />
                </button>
              )}

              <span className="pos-num pos-fs-line pos-chip-soft truncate rounded-pos px-2.5 py-0.5 font-bold">{lineTotal}</span>
            </div>

            {/* Inline extras editor -- the modal-free replacement for the Modifiers picker. Each
                catalog modifier group of this line's variant, with its options as toggle chips;
                every tap commits immediately (onChangeLineModifiers -> the shared line queue). */}
            {extrasOpen && (
              <div
                className="mt-1.5 space-y-2 border-t border-pos-border pb-1 pt-2"
                onClick={(event) => event.stopPropagation()}
              >
                {modifierGroups.map((group) => {
                  const selectedIds = new Set(item.modifiers.map((modifier) => modifier.modifierOptionId));
                  return (
                    <div key={group.modifierGroupId}>
                      <div className="pos-fs-label mb-1 flex items-center justify-between gap-2 text-pos-muted">
                        <span className="font-bold text-pos-text">{group.name}</span>
                        <span>
                          {group.minSelections > 0
                            ? t("pos.catalog.groupRequired", { min: group.minSelections, max: group.maxSelections })
                            : t("pos.catalog.groupOptional", { max: group.maxSelections })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.options
                          .slice()
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((option) => {
                            const isSelected = selectedIds.has(option.modifierOptionId);
                            const adjustment = Number(option.amountAdjustment);
                            return (
                              <button
                                key={option.modifierOptionId}
                                type="button"
                                aria-pressed={isSelected}
                                disabled={!canEditDraft}
                                onClick={() => {
                                  const next = toggleModifierOption(item, group, option.modifierOptionId);
                                  if (next) onChangeLineModifiers(item, next);
                                }}
                                className={`pos-fs-label flex min-h-9 items-center gap-1 rounded-full border px-3 font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                                  isSelected
                                    ? "border-pos-primary-strong bg-pos-primary-strong text-white"
                                    : "border-pos-border bg-pos-card text-pos-text hover:border-pos-primary"
                                }`}
                              >
                                {option.name}
                                {adjustment !== 0 && (
                                  <span className={`pos-num ${isSelected ? "text-white/80" : "text-pos-muted"}`}>
                                    {adjustment > 0 ? "+" : ""}
                                    {formatMoney(adjustment, draftOrder?.currencyCode || catalogCurrencyCode, 2)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
