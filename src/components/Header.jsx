import { useEffect, useState, useRef } from "react";
import { Bell, Keyboard, Mail, Moon, Sun, CalendarDays, Clock } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { useShortcutContext } from "../features/shortcuts/useShortcuts";

function TopWidget({ label, value, sub, color }) {
  return (
    <div className="h-16 w-16 shrink-0 rounded-full aspect-square flex flex-col items-center justify-center border sm:h-[78px] sm:w-[78px]" style={{ borderColor: `${color}55` }}>
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className="text-sm font-extrabold" style={{ color }}>{value}</span>
      {sub && <span className="text-[9px]" style={{ color: sub.startsWith("+") ? "#34d399" : "#f87171" }}>{sub}</span>}
    </div>
  );
}

export default function Header({
  onLogout,
  companyName,
  onSwitchCompany,
  branchName,
  onSwitchBranch,
}) {
  const { t } = useI18n();
  const { openHelp } = useShortcutContext();
  const [isDark, setIsDark] = useState(() => typeof window !== "undefined" ? localStorage.getItem("nobo-theme") !== "light" : true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nobo-theme", theme);
  }, [isDark]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [showNotif, setShowNotif] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const notifRef = useRef(null);
  const msgRef = useRef(null);

  const [notifications, setNotifications] = useState([
    { id: 1, title: "New order #1054", time: "2m ago" },
    { id: 2, title: "Low stock: Milk", time: "1h ago" },
    { id: 3, title: "Payment failed: INV-1022", time: "3h ago" },
  ]);

  const [messages, setMessages] = useState([
    { id: 1, from: "Aisha", text: "هل يوجد خصم على المشروبات؟", time: "5m" },
    { id: 2, from: "Sale Team", text: "طلب جديد جاهز للشحن.", time: "1h" },
  ]);

  const markNotifRead = (id) => setNotifications((cur) => cur.filter((n) => n.id !== id));
  const markAllNotifRead = () => setNotifications([]);
  const markMsgRead = (id) => setMessages((cur) => cur.filter((m) => m.id !== id));
  const markAllMsgRead = () => setMessages([]);

  useEffect(() => {
    function onDocClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (msgRef.current && !msgRef.current.contains(e.target)) setShowMsg(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const formattedTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formattedDate = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full gap-2 overflow-x-auto pb-1 scrollbar-none sm:w-auto sm:gap-3">
        <div className={`h-16 w-16 shrink-0 rounded-full aspect-square flex flex-col items-center justify-center border shadow-sm sm:h-[78px] sm:w-[78px] ${isDark ? "bg-slate-950/80 text-white shadow-slate-950/20" : "bg-slate-100 text-slate-900 shadow-slate-300/20"}`} style={{ borderColor: isDark ? "#60a5fa55" : "rgba(148,163,184,.3)" }}>
          <CalendarDays size={18} className="mb-1" />
          <div className={`text-[9px] uppercase tracking-[0.1em] ${isDark ? "text-slate-300" : "text-slate-500"}`}>{formattedDate}</div>
        </div>
        <div className={`h-16 w-16 shrink-0 rounded-full aspect-square flex flex-col items-center justify-center border shadow-sm sm:h-[78px] sm:w-[78px] ${isDark ? "bg-slate-950/80 text-white shadow-slate-950/20" : "bg-slate-100 text-slate-900 shadow-slate-300/20"}`} style={{ borderColor: isDark ? "#60a5fa55" : "rgba(148,163,184,.3)" }}>
          <Clock size={18} className="mb-1" />
          <div className="text-[12px] font-black">{formattedTime}</div>
        </div>
        <TopWidget label="USD" value="3.7700" sub="+0.45%" color="#34d399" />
        <TopWidget label={t("header.gold")} value="2,385" sub="+1.25%" color="#f5b800" />
        <TopWidget label={t("header.silver")} value="28.56" sub="+0.78%" color="#c084fc" />
      </div>
      <div className="flex items-center justify-end gap-3">
        {companyName && (
          <button
            type="button"
            onClick={onSwitchCompany}
            disabled={!onSwitchCompany}
            className="max-w-[180px] truncate rounded-2xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-100 transition hover:border-blue-400/50 hover:bg-blue-500/15 disabled:cursor-default disabled:hover:border-blue-400/25 disabled:hover:bg-blue-500/10"
            title={onSwitchCompany ? "Switch company" : companyName}
          >
            {companyName}
          </button>
        )}
        {branchName && (
          <button
            type="button"
            onClick={onSwitchBranch}
            disabled={!onSwitchBranch}
            className="max-w-[160px] truncate rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-blue-400/50 hover:bg-blue-500/10 disabled:cursor-default disabled:hover:border-white/10 disabled:hover:bg-white/5"
            title={onSwitchBranch ? "Switch branch" : branchName}
          >
            {branchName}
          </button>
        )}
        <button type="button" onClick={() => setIsDark((prev) => !prev)} className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-blue-400/50 hover:bg-blue-500/10">
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          type="button"
          onClick={openHelp}
          aria-label={t("header.shortcuts")}
          title={t("header.shortcuts")}
          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-blue-400/50 hover:bg-blue-500/10"
        >
          <Keyboard size={18} />
        </button>
        <div className="relative" ref={notifRef}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowNotif((s) => !s); setShowMsg(false); }} className="relative rounded-lg p-2 hover:bg-white/5">
            <Bell size={20} />
            <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{notifications.length}</span>
          </button>
          {showNotif && (
            <div className="absolute left-1/2 top-full mt-2 z-50 -translate-x-1/2 translate-x-4 transform" role="dialog" onClick={(e) => e.stopPropagation()}>
              <div className={`w-96 rounded-xl border p-3 ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-900"} shadow-lg`}>
                <div className="mb-2 flex items-center justify-between px-2"><strong>Notifications</strong>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); markAllNotifRead(); }} className="text-xs text-slate-400 hover:underline">Mark all read</button>
                    <button onClick={() => setShowNotif(false)} className="text-sm text-slate-400">Close</button>
                  </div>
                </div>
                <div className="space-y-1 max-h-72 overflow-auto">
                  {notifications.length === 0 && <div className="px-2 py-3 text-sm text-slate-500">No new notifications</div>}
                  {notifications.map((n) => (
                    <div key={n.id} className={`w-full rounded px-2 py-2`}>
                      <div className="flex items-start justify-between gap-2">
                        <div onClick={() => { /* open notification */ setShowNotif(false); }} className={`flex-1 text-left cursor-pointer ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} rounded px-2 py-1`}>
                          <div className="text-sm font-medium">{n.title}</div>
                          <div className="text-[11px] text-slate-400 mt-1">{n.time}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); markNotifRead(n.id); }} className="text-xs text-slate-400 hover:text-slate-600">Mark</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={msgRef}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowMsg((s) => !s); setShowNotif(false); }} className="relative rounded-lg p-2 hover:bg-white/5">
            <Mail size={20} />
            <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{messages.length}</span>
          </button>
          {showMsg && (
            <div className="absolute left-1/2 top-full mt-2 z-50 -translate-x-1/2 translate-x-4 transform" role="dialog" onClick={(e) => e.stopPropagation()}>
              <div className={`w-96 rounded-xl border p-3 ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-900"} shadow-lg`}>
                <div className="mb-2 flex items-center justify-between px-2"><strong>Messages</strong>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); markAllMsgRead(); }} className="text-xs text-slate-400 hover:underline">Mark all read</button>
                    <button onClick={() => setShowMsg(false)} className="text-sm text-slate-400">Close</button>
                  </div>
                </div>
                <div className="space-y-1 max-h-72 overflow-auto">
                  {messages.length === 0 && <div className="px-2 py-3 text-sm text-slate-500">No new messages</div>}
                  {messages.map((m) => (
                    <div key={m.id} className={`w-full rounded px-2 py-2`}>
                      <div className="flex items-start justify-between gap-2">
                        <div onClick={() => { /* open conversation */ setShowMsg(false); }} className={`flex-1 text-left cursor-pointer ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} rounded px-2 py-1`}>
                          <div className="text-sm font-medium">{m.from}</div>
                          <div className="text-[12px] text-slate-400 mt-1">{m.text}</div>
                          <div className="text-[11px] text-slate-400 mt-1">{m.time}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); markMsgRead(m.id); }} className="text-xs text-slate-400 hover:text-slate-600">Mark</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <button onClick={onLogout} className="lg:hidden text-xs text-gray-400 underline">{t("header.logout")}</button>
      </div>
    </div>
  );
}
