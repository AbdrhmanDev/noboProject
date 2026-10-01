import { brandAccentStyle } from "../../utils/brandAccents";

// Touch-first POS redesign (12th pass): icon-only, colourful chips -- no text label at all. Each
// category cycles through the same four brand accent colours product cards already use
// (brandAccentStyle), filled solidly (via `pos-chip`) behind a real, keyword-matched icon
// (getCategoryIcon, from the category's own actual name) so every category reads as a distinct,
// recognizable shape+colour at a glance instead of a row of identical grey icons with small text.
// The label still exists as the button's accessible name (title/aria-label), just not drawn on
// screen.
export function CategorySidebar({ categories, activeCategoryId, onSelect }) {
  return (
    <div className="flex w-16 shrink-0 flex-col gap-2 overflow-y-auto scrollbar-none sm:w-[72px]">
      {categories.map(({ id, label, icon: Icon }, index) => {
        const active = activeCategoryId === id;

        return (
          <button
            key={id}
            type="button"
            style={brandAccentStyle(index)}
            onClick={() => onSelect(id)}
            aria-pressed={active}
            title={label}
            aria-label={label}
            className={`pos-chip grid aspect-square shrink-0 place-items-center rounded-full shadow-sm transition active:scale-90 ${
              active ? "ring-[3px] ring-pos-primary ring-offset-2 ring-offset-pos-bg" : "opacity-80 hover:opacity-100"
            }`}
          >
            <Icon size={24} />
          </button>
        );
      })}
    </div>
  );
}
