export function IconButton({ icon: Icon, label, onClick, tone = "default", disabled = false, hint = null }) {
  const tones = {
    default:
      "border-white/10 bg-white/[0.035] hover:border-blue-400/45 hover:bg-blue-500/10",
    danger:
      "border-rose-500/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
    pink: "border-pink-400/25 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      <Icon size={15} />
      {label}
      {hint}
    </button>
  );
}

export function Metric({ label, value, detail, tone = "blue" }) {
  const colors = {
    blue: "text-blue-300",
    green: "text-emerald-300",
    gold: "text-amber-300",
    pink: "text-pink-300",
  };
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-black ${colors[tone]}`}>{value}</div>
      {detail && <div className="mt-1 text-[10px] text-slate-500">{detail}</div>}
    </div>
  );
}
