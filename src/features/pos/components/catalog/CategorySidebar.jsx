import { brandAccentStyle } from "../../utils/brandAccents";

// Category sidebar (14th pass): a tidy white column instead of the floating colour circles. Each
// category is a full-width tile with its keyword-matched icon (getCategoryIcon) in a small accent
// disc -- the same four cycling brand accents product cards use (brandAccentStyle) -- and its name
// underneath (12px, max 2 lines). The active category gets the primary tint fill, primary text and
// a primary marker bar on its inline-start edge, so it flips correctly in RTL.
export function CategorySidebar({ categories, activeCategoryId, onSelect }) {
  return (
    // xl:mb keeps the column's bottom above the fixed action bar + info strip (from xl up the
    // catalog section is pinned to the viewport height, so its bottom edge sits behind them).
    <nav className="xl:mb-[calc(var(--pos-bottom-chrome-h)+env(safe-area-inset-bottom))] flex w-[88px] shrink-0 flex-col gap-1 overflow-y-auto rounded-pos-lg border border-pos-border bg-pos-card p-1.5 scrollbar-none">
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
            className={`relative flex min-h-[64px] w-full shrink-0 flex-col items-center justify-center gap-1 rounded-pos px-1 py-2 text-center transition active:scale-95 ${
              active
                ? "bg-pos-tint text-pos-primary-text"
                : "text-pos-text hover:bg-pos-bg"
            }`}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-pos-primary"
              />
            )}
            <span className="pos-chip grid h-8 w-8 shrink-0 place-items-center rounded-full">
              <Icon size={17} />
            </span>
            <span className={`pos-fs-label line-clamp-2 w-full break-words leading-tight ${active ? "font-bold" : "font-medium"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
