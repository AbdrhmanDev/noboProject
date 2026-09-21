import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";
import { useI18n } from "./I18nContext";

export default function LanguageSwitcher() {
  const { lang, setLang, LANGUAGES } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-control border border-line bg-raised px-3 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-hover"
      >
        <Globe size={15} className="text-muted" />
        <span>{current.label}</span>
        <ChevronDown size={13} className={`text-subtle transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute end-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-control border border-line bg-surface shadow-[var(--shadow-float)]"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === lang}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex h-11 w-full items-center justify-between gap-2 px-4 text-sm transition-colors hover:bg-hover ${
                l.code === lang ? "font-bold text-accent" : "text-ink"
              }`}
            >
              <span>{l.native}</span>
              {l.code === lang && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
