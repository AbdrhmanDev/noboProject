import type { EdgeAgentHealthStatus } from "../types/devices.types";

type EdgeAgentPulseIndicatorProps = {
  health: EdgeAgentHealthStatus | null | undefined;
  size?: "sm" | "md";
};

// Small pulsing-dot pattern (mirrors AttentionIndicator) — pulses only while
// the agent is reporting Online, stays solid green for a stale-but-not-yet-
// flagged state, and turns amber/rose for Degraded/Error without pulsing.
export function EdgeAgentPulseIndicator({ health, size = "sm" }: EdgeAgentPulseIndicatorProps) {
  if (!health || health === "Unknown") return null;

  const dimensions = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const colorClass =
    health === "Online"
      ? "bg-emerald-400"
      : health === "Degraded"
        ? "bg-amber-400"
        : health === "Error"
          ? "bg-rose-500"
          : "bg-slate-500";
  const pulsing = health === "Online";

  return (
    <span className="relative inline-flex" aria-hidden="true">
      {pulsing && (
        <span
          className={`absolute inline-flex ${dimensions} animate-ping rounded-full ${colorClass} opacity-75`}
        />
      )}
      <span className={`relative inline-flex ${dimensions} rounded-full ${colorClass}`} />
    </span>
  );
}
