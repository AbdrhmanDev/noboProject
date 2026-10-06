type StatusBadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
  children: string;
  tone?: StatusBadgeTone;
};

// Same tones as the Odoo-style StatusPill (shared/components/odoo), theme-aware.
const toneClasses: Record<StatusBadgeTone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-accent-soft text-accent",
  neutral: "bg-inset text-muted",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
