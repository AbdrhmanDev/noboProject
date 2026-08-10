type StatusBadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
  children: string;
  tone?: StatusBadgeTone;
};

const toneClasses: Record<StatusBadgeTone, string> = {
  success: "bg-green-500/15 text-green-400",
  warning: "bg-yellow-500/15 text-yellow-400",
  danger: "bg-red-500/15 text-red-400",
  info: "bg-blue-500/15 text-blue-400",
  neutral: "bg-white/10 text-gray-300",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
