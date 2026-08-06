import { Bell, Mail } from "lucide-react";

function TopWidget({ label, value, sub, color }) {
  return (
    <div className="rounded-full aspect-square flex flex-col items-center justify-center border" style={{ borderColor: `${color}55`, width: 78, height: 78 }}>
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className="text-sm font-extrabold" style={{ color }}>{value}</span>
      {sub && <span className="text-[9px]" style={{ color: sub.startsWith("+") ? "#34d399" : "#f87171" }}>{sub}</span>}
    </div>
  );
}

export default function Header({ onLogout }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <TopWidget label="الجمعة" value="25" color="#60a5fa" />
        <div className="rounded-full aspect-square flex flex-col items-center justify-center border" style={{ borderColor: "#60a5fa55", width: 78, height: 78 }}>
          <span className="text-[10px] text-gray-400">02:00 م</span>
          <span className="text-sm font-extrabold" style={{ color: "#60a5fa" }}>⏰</span>
        </div>
        <TopWidget label="USD" value="3.7700" sub="+0.45%" color="#34d399" />
        <TopWidget label="الذهب oooooooooooooo" value="2,385" sub="+1.25%" color="#f5b800" />
        <TopWidget label="الفضة" value="28.56" sub="+0.78%" color="#c084fc" />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell size={20} />
          <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-[9px] rounded-full w-4 h-4 flex items-center justify-center">5</span>
        </div>
        <div className="relative">
          <Mail size={20} />
          <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-[9px] rounded-full w-4 h-4 flex items-center justify-center">3</span>
        </div>
        <button onClick={onLogout} className="lg:hidden text-xs text-gray-400 underline">خروج</button>
      </div>
    </div>
  );
}

