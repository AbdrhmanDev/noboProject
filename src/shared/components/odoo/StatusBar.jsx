import "./odoo.css";
// Odoo-style status bar for a record's stages ("Draft > Confirmed > Closed"): chevron-shaped
// steps, the current one highlighted, earlier ones marked done. Read-only -- it shows where the
// record is; actions that move it live elsewhere. `exception` replaces the pipeline with a single
// highlighted step for an off-path state (e.g. Cancelled). Theme-aware; mirrors in RTL.
export function StatusBar({ stages, current, exception }) {
  if (exception) {
    return (
      <div className="flex justify-end">
        <span className="rounded-md border border-danger bg-danger-soft px-3 py-1.5 text-sm font-bold text-danger">
          {exception}
        </span>
      </div>
    );
  }

  const currentIndex = stages.findIndex((stage) => stage.id === current);

  return (
    <ol className="flex flex-wrap justify-end" aria-label="status">
      {stages.map((stage, index) => {
        const isCurrent = index === currentIndex;
        const isDone = currentIndex >= 0 && index < currentIndex;
        return (
          <li
            key={stage.id}
            aria-current={isCurrent ? "step" : undefined}
            className={`odoo-stage relative -ms-px px-4 py-1.5 text-sm font-bold first:ms-0 ${
              isCurrent
                ? "z-10 bg-accent text-white"
                : isDone
                  ? "bg-accent-soft text-accent"
                  : "bg-raised text-muted"
            }`}
          >
            {stage.label}
          </li>
        );
      })}
    </ol>
  );
}

// Small rounded status label for list rows and headers.
const PILL_TONES = {
  neutral: "bg-inset text-muted",
  info: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function StatusPill({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}
