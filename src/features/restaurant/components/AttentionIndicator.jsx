import { CircleAlert } from "lucide-react";
import { hasOpenAttention } from "../utils/floorOperationalState";

// Restrained manager indicator: a small red dot that pulses only while at
// least one attention is still Open (nobody has taken ownership). Once
// every active attention has been Acknowledged, the dot stays visible but
// the pulse stops — this is the visual cue the Floor Manager workflow
// relies on to tell "unseen" apart from "being handled". Never applied to
// the whole tile — only this small indicator carries the animation.
export function AttentionIndicator({ activeAttentions, size = "sm" }) {
  if (!activeAttentions?.length) return null;

  const pulsing = hasOpenAttention(activeAttentions);
  const dimensions = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <span className="relative inline-flex" aria-hidden="true">
      {pulsing && (
        <span className={`absolute inline-flex ${dimensions} animate-ping rounded-full bg-rose-500 opacity-75`} />
      )}
      <span className={`relative inline-flex ${dimensions} rounded-full bg-rose-500`} />
    </span>
  );
}

export function AttentionIcon({ activeAttentions, className = "" }) {
  if (!activeAttentions?.length) return null;
  return <CircleAlert size={14} className={`text-rose-400 ${className}`} />;
}
