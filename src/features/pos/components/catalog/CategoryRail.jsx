import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SCROLL_CHUNK_RATIO = 0.75;

function isDocumentRtl() {
  if (typeof document === "undefined") return false;
  return document.documentElement.dir === "rtl";
}

function ScrollButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="z-10 hidden h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted shadow-[var(--shadow-surface)] transition hover:border-accent-line hover:bg-accent-soft hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:grid"
    >
      <Icon size={16} />
    </button>
  );
}

export function CategoryRail({ categories, activeCategoryId, onSelect }) {
  const railRef = useRef(null);
  const chipRefs = useRef(new Map());
  const rafRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [rtl, setRtl] = useState(isDocumentRtl);

  const updateEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const overflow = maxScroll > 1;
    const distance = Math.abs(el.scrollLeft);

    setCanScrollPrev(overflow && distance > 1);
    setCanScrollNext(overflow && distance < maxScroll - 1);
  }, []);

  const scheduleUpdateEdges = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateEdges();
    });
  }, [updateEdges]);

  useLayoutEffect(() => {
    updateEdges();
  }, [updateEdges, categories]);

  useEffect(() => {
    const el = railRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => scheduleUpdateEdges());
    observer.observe(el);
    return () => observer.disconnect();
  }, [scheduleUpdateEdges]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return undefined;

    const root = document.documentElement;
    const syncRtl = () => setRtl(isDocumentRtl());
    const observer = new MutationObserver(syncRtl);
    observer.observe(root, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const chip = chipRefs.current.get(activeCategoryId);
    chip?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeCategoryId]);

  const scrollByDirection = (toward) => {
    const el = railRef.current;
    if (!el) return;

    const chunk = Math.max(el.clientWidth * SCROLL_CHUNK_RATIO, 120);
    const sign = rtl ? -1 : 1;
    const amount = toward === "start" ? -sign * chunk : sign * chunk;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleWheel = (event) => {
    const el = railRef.current;
    if (!el) return;

    const isMostlyVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (!isMostlyVertical || maxScroll <= 1) return;

    event.preventDefault();
    el.scrollLeft += event.deltaY;
  };

  const fadeStyle = (edge) => ({
    position: "absolute",
    insetBlock: 0,
    [edge === "start" ? "insetInlineStart" : "insetInlineEnd"]: 0,
    width: "1.5rem",
    pointerEvents: "none",
    zIndex: 1,
    background: `linear-gradient(to ${
      (edge === "start") === !rtl ? "right" : "left"
    }, var(--nobo-surface), transparent)`,
  });

  return (
    <div className="flex items-center">
      {canScrollPrev && (
        <ScrollButton
          icon={rtl ? ChevronRight : ChevronLeft}
          label="Scroll categories backward"
          onClick={() => scrollByDirection("start")}
        />
      )}

      <div className="relative min-w-0 flex-1">
        {canScrollPrev && <div style={fadeStyle("start")} />}
        {canScrollNext && <div style={fadeStyle("end")} />}

        <div
          ref={railRef}
          onScroll={scheduleUpdateEdges}
          onWheel={handleWheel}
          className="flex items-center gap-1.5 overflow-x-auto scroll-smooth scrollbar-none"
        >
          {categories.map(({ id, label, icon: Icon }) => {
            const active = activeCategoryId === id;

            return (
              <button
                key={id}
                type="button"
                ref={(node) => {
                  if (node) chipRefs.current.set(id, node);
                  else chipRefs.current.delete(id);
                }}
                onClick={() => onSelect(id)}
                aria-pressed={active}
                className={`flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-xs font-bold transition ${
                  active
                    ? "border-accent bg-accent text-white shadow-[var(--shadow-surface)]"
                    : "border-line bg-surface text-muted hover:border-line-strong hover:bg-hover hover:text-ink"
                }`}
              >
                <Icon size={14} className={active ? "text-white" : "text-subtle"} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {canScrollNext && (
        <ScrollButton
          icon={rtl ? ChevronLeft : ChevronRight}
          label="Scroll categories forward"
          onClick={() => scrollByDirection("end")}
        />
      )}
    </div>
  );
}
