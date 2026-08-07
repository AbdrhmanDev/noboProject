import { useState } from "react";
import { Save, Bell, Shield, Store, Users, Globe } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const sections = [
  { icon: Store, labelKey: "set.company" },
  { icon: Users, labelKey: "set.users" },
  { icon: Bell, labelKey: "set.notifications" },
  { icon: Shield, labelKey: "set.security" },
  { icon: Globe, labelKey: "set.region" },
];

export default function SettingsPage({ onLogout }) {
  const { t, lang, setLang, LANGUAGES } = useI18n();
  const [active, setActive] = useState(0);
  const [currency, setCurrency] = useState(t("set.currencySAR"));
  const [vat, setVat] = useState("15");
  const [notifications, setNotifications] = useState(true);

  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.SETTINGS}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("set.title")}</h1>
        <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Save size={13} /> {t("set.save")}</button>
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
              {t(s.labelKey)}
            </button>
          ))}
        </div>

        {/* settings form */}
        <div className="panel rounded-2xl p-5">
          {active === 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">{t("set.company")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">{t("set.companyName")}</label>
                  <input defaultValue="شركة NOBO التقنية" className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">{t("set.commercialReg")}</label>
                  <input defaultValue="1010456789" className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">{t("set.currency")}</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none">
                    <option className="bg-black">{t("set.currencySAR")}</option>
                    <option className="bg-black">{t("set.currencyAED")}</option>
                    <option className="bg-black">{t("set.currencyKWD")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">{t("set.vatRate")}</label>
                  <input value={vat} onChange={(e) => setVat(e.target.value)} className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
                </div>
              </div>
            </div>
          )}

          {active === 1 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm mb-3">{t("set.users")}</h3>
              {["مدير النظام", "محاسب", "مندوب مبيعات", "أمين مستودع"].map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-3">
                  <span className="text-xs text-gray-200">{r}</span>
                  <span className="text-[10px] text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/15">{t("set.fullPermissions")}</span>
                </div>
              ))}
            </div>
          )}

          {active === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">{t("set.notifications")}</h3>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-3">
                <span className="text-xs text-gray-200">{t("set.enableNotifications")}</span>
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
              <h3 className="font-bold text-sm">{t("set.security")}</h3>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">{t("set.currentPassword")}</label>
                <input type="password" className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">{t("set.newPassword")}</label>
                <input type="password" className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-3">
                <span className="text-xs text-gray-200">{t("set.twoFA")}</span>
                <span className="w-2 h-2 rounded-full bg-green-400" />
              </div>
            </div>
          )}

          {active === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">{t("set.region")}</h3>
<div>
                <label className="text-[11px] text-gray-400 block mb-1">{t("set.language")}</label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-black">{l.native}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">{t("set.timezone")}</label>
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
