import "./odoo.css";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Layers, Search, X } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";

// Odoo-style control panel shared by list pages (Sales orders, Stock, ...). Theme-aware: built only
// on the app's semantic tokens (bg-surface, text-ink, border-line, ...), so it works in light and
// dark. Purely presentational: every filter / grouping / paging decision is the caller's.
//
//   breadcrumbs  ["Sales", "Orders"]                         -- last one is the current page
//   actions      node rendered next to the breadcrumbs      -- e.g. a "New" button
//   search       { value, onChange, placeholder }
//   facets       [{ id, label, onRemove }]                    -- active filters/grouping as chips
//   filters      [{ id, label, active, onToggle }] | [[...], [...]] (sections, divided)
//   groupBy      [{ id, label, active, onSelect }]
//   views        { current, options: [{ id, label, icon }], onChange }
//   pager        { start, end, total, onPrev, onNext }
export function ControlPanel({ breadcrumbs = [], actions, search, facets = [], filters, groupBy, views, pager }) {
  const { t } = useI18n();
  const filterSections = filters ? (Array.isArray(filters[0]) ? filters : [filters]) : [];

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-2.5 shadow-[var(--shadow-surface)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-base">
          {breadcrumbs.map((crumb, index) => {
            const last = index === breadcrumbs.length - 1;
            return (
              <span key={`${crumb}-${index}`} className="flex min-w-0 items-center gap-1.5">
                {index > 0 && <span className="text-subtle">/</span>}
                <span className={`truncate ${last ? "font-bold text-ink" : "odoo-link"}`}>{crumb}</span>
              </span>
            );
          })}
        </nav>
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        <div className="ms-auto flex items-center gap-2">
          {pager && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <span className="pos-num whitespace-nowrap">
                {pager.total ? `${pager.start}-${pager.end} / ${pager.total}` : "0"}
              </span>
              <PagerButton onClick={pager.onPrev} disabled={!pager.onPrev} label={t("odoo.pager.previous")}>
                <ChevronRight size={15} className="ltr:-scale-x-100" />
              </PagerButton>
              <PagerButton onClick={pager.onNext} disabled={!pager.onNext} label={t("odoo.pager.next")}>
                <ChevronLeft size={15} className="ltr:-scale-x-100" />
              </PagerButton>
            </div>
          )}
          {views && (
            <div className="flex overflow-hidden rounded-lg border border-line" role="group" aria-label={t("odoo.views")}>
              {views.options.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => views.onChange(id)}
                  aria-pressed={views.current === id}
                  aria-label={label}
                  title={label}
                  className={`grid h-8 w-9 place-items-center transition ${
                    views.current === id ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover"
                  }`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {search && (
          <label className="flex min-h-9 min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-canvas px-2 py-1 focus-within:border-accent-line">
            <Search size={15} className="shrink-0 text-subtle" />
            {facets.map((facet) => (
              <span
                key={facet.id}
                className="flex max-w-full items-center gap-1 rounded-md bg-accent-soft py-0.5 pe-1 ps-2 text-xs font-bold text-accent"
              >
                <span className="truncate">{facet.label}</span>
                <button
                  type="button"
                  onClick={facet.onRemove}
                  aria-label={t("odoo.removeFacet", { label: facet.label })}
                  className="grid h-4 w-4 place-items-center rounded hover:bg-accent-soft"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={search.placeholder}
              className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-subtle"
            />
          </label>
        )}
        <div className="flex items-center gap-1.5">
          {filterSections.length > 0 && (
            <Dropdown icon={Filter} label={t("odoo.filters")}>
              {filterSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className={sectionIndex > 0 ? "mt-1 border-t border-line pt-1" : ""}>
                  {section.map((option) => (
                    <MenuOption key={option.id} active={option.active} onClick={option.onToggle}>
                      {option.label}
                    </MenuOption>
                  ))}
                </div>
              ))}
            </Dropdown>
          )}
          {groupBy && groupBy.length > 0 && (
            <Dropdown icon={Layers} label={t("odoo.groupBy")}>
              {groupBy.map((option) => (
                <MenuOption key={option.id} active={option.active} onClick={option.onSelect}>
                  {option.label}
                </MenuOption>
              ))}
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
}

function PagerButton({ onClick, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-md border border-line text-muted transition hover:bg-hover disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function MenuOption({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={Boolean(active)}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-start text-sm text-ink transition hover:bg-hover"
    >
      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${active ? "border-accent bg-accent text-white" : "border-line-strong"}`}>
        {active && <span className="text-[10px] leading-none">✓</span>}
      </span>
      <span className="truncate">{children}</span>
    </button>
  );
}

// Small click-to-open menu; closes on outside click or Escape.
function Dropdown({ icon: Icon, label, children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-bold transition ${
          open ? "border-accent-line bg-accent-soft text-accent" : "border-line text-ink hover:bg-hover"
        }`}
      >
        <Icon size={15} />
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-40 mt-1 max-h-80 w-56 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-[var(--shadow-float)]"
        >
          {children}
        </div>
      )}
    </div>
  );
}
