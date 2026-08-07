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
        onClick={() => setOpen((o) => !o)}
        className="
          flex
          items-center
          gap-2
          rounded-xl
          border
          border-white/10
          bg-white/5
          px-4
          py-2
          text-sm
          hover:bg-white/10
          transition
        "
      >
        <Globe size={14} className="text-gray-300" />
        <span>{current.label}</span>
        <ChevronDown size={12} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 w-44 rounded-xl border border-white/10 bg-[#0d1224]/95 backdrop-blur-xl shadow-xl overflow-hidden z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`
                w-full
                flex
                items-center
                justify-between
                gap-2
                px-4
                py-2.5
                text-sm
                transition
                hover:bg-white/10
                ${l.code === lang ? "text-violet-300 font-semibold" : "text-gray-300"}
              `}
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
