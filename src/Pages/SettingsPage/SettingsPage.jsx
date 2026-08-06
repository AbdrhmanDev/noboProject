import { useState } from "react";
import { Save, Bell, Shield, Store, Users, Globe } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { ROUTES } from "../../utils/routes";

const sections = [
  { icon: Store, label: "إعدادات الشركة" },
  { icon: Users, label: "المستخدمون والصلاحيات" },
  { icon: Bell, label: "الإشعارات" },
  { icon: Shield, label: "الأمان والخصوصية" },
  { icon: Globe, label: "المنطقة واللغة" },
];

export default function SettingsPage({ onLogout }) {
  const [active, setActive] = useState(0);
  const [currency, setCurrency] = useState("ريال سعودي (ر.س)");
  const [vat, setVat] = useState("15");
  const [notifications, setNotifications] = useState(true);

  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.SETTINGS}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">الإعدادات</h1>
        <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Save size={13} /> حفظ التغييرات</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-4">
        {/* sections list */}
        <div className="panel rounded-2xl p-4 space-y-1">
          {sections.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold transition ${
                active === i ? "bg-blue-500/15 border border-blue-500/40 text-white" : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <s.icon size={16} color={active === i ? "#2b8cff" : "#60a5fa"} />
              {s.label}
            </button>
          ))}
        </div>

        {/* settings form */}
        <div className="panel rounded-2xl p-5">
          {active === 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">إعدادات الشركة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">اسم الشركة</label>
                  <input defaultValue="شركة NOBO التقنية" className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">السجل التجاري</label>
                  <input defaultValue="1010456789" className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">العملة</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none">
                    <option className="bg-black">ريال سعودي (ر.س)</option>
                    <option className="bg-black">درهم إماراتي (د.إ)</option>
                    <option className="bg-black">دينار كويتي (د.ك)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">نسبة الضريبة (%)</label>
                  <input value={vat} onChange={(e) => setVat(e.target.value)} className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
                </div>
              </div>
            </div>
          )}

          {active === 1 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm mb-3">المستخدمون والصلاحيات</h3>
              {["مدير النظام", "محاسب", "مندوب مبيعات", "أمين مستودع"].map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-3">
                  <span className="text-xs text-gray-200">{r}</span>
                  <span className="text-[10px] text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/15">صلاحيات كاملة</span>
                </div>
              ))}
            </div>
          )}

          {active === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">الإشعارات</h3>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-3">
                <span className="text-xs text-gray-200">تفعيل الإشعارات</span>
                <button onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full transition ${notifications ? "toggle-track" : "bg-white/10"}`}>
                  <span className={`block w-5 h-5 rounded-full bg-white toggle-thumb ${notifications ? "transform translate-x-6" : ""}`} />
                </button>
              </div>
{["تنبيه انخفاض المخزون", "إشعار المبيعات اليومية", "تذكير الفواتير المستحقة"].map((n, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-3">
                  <span className="text-xs text-gray-200">{n}</span>
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                </div>
              ))}
            </div>
          )}

          {active === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">الأمان والخصوصية</h3>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">كلمة المرور الحالية</label>
                <input type="password" className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">كلمة المرور الجديدة</label>
                <input type="password" className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-3">
                <span className="text-xs text-gray-200">المصادقة الثنائية (2FA)</span>
                <span className="w-2 h-2 rounded-full bg-green-400" />
              </div>
            </div>
          )}

          {active === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">المنطقة واللغة</h3>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">اللغة</label>
                <select className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none">
                  <option className="bg-black">العربية (الافتراضي)</option>
                  <option className="bg-black">English</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">المنطقة الزمنية</label>
                <select className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none">
                  <option className="bg-black">(GMT+3) الرياض</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
