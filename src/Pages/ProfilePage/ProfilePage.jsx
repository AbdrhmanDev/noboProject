import { useState, useRef } from "react";
import { Save, Camera, Check, User, Mail, Phone, Building2 } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { useUser } from "../../context/UserContext";
import { ROUTES } from "../../utils/routes";
import { PRESET_AVATARS, buildAvatar } from "../../utils/user";

const ROLES = [
  { value: "systemAdmin", labelKey: "profile.roleSystemAdmin" },
  { value: "accountant", labelKey: "profile.roleAccountant" },
  { value: "sales", labelKey: "profile.roleSales" },
  { value: "warehouse", labelKey: "profile.roleWarehouse" },
];

export default function ProfilePage({ onLogout }) {
  const { t } = useI18n();
  const { user, updateUser } = useUser();
  const fileRef = useRef(null);

  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [company, setCompany] = useState(user.company);
  const [avatar, setAvatar] = useState(user.avatar);
  const [saved, setSaved] = useState(false);

  const previewAvatar = user.avatarFile || avatar;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUser({
      name,
      role,
      email,
      phone,
      company,
      avatar,
      avatarFile: avatar.startsWith("data:") ? avatar : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.PROFILE}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-black brand-text">{t("profile.title")}</h1>
          <p className="text-xs text-gray-400 mt-1">{t("profile.subtitle")}</p>
        </div>
        <button
          onClick={handleSave}
          className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"
        >
          <Save size={13} /> {t("profile.save")}
        </button>
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-400/30 text-green-400 text-xs font-semibold rounded-xl px-3 py-2">
          <Check size={14} /> {t("profile.saved")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        {/* avatar panel */}
        <div className="panel rounded-2xl p-5 flex flex-col items-center text-center">
          <h3 className="font-bold text-sm mb-4 self-start">{t("profile.photo")}</h3>
          <img
            src={previewAvatar}
            alt=""
            className="w-28 h-28 rounded-full bg-gray-700 object-cover"
            style={{ boxShadow: "0 0 35px rgba(43,140,255,.35)" }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-4 primary-btn rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2"
          >
            <Camera size={14} /> {t("profile.changePhoto")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <div className="w-full mt-5">
            <div className="text-[11px] text-gray-400 mb-2">{t("profile.presetAvatar")}</div>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESET_AVATARS.map((seed) => (
                <button
                  key={seed}
                  onClick={() => setAvatar(buildAvatar(seed))}
                  className={`rounded-full overflow-hidden ring-2 transition ${
                    avatar === buildAvatar(seed) ? "ring-blue-500 scale-110" : "ring-transparent hover:ring-blue-500/40"
                  }`}
                >
                  <img src={buildAvatar(seed)} alt="" className="w-10 h-10 bg-gray-700" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* personal info */}
        <div className="panel rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-4">{t("profile.personalInfo")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                <User size={11} /> {t("profile.name")}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">{t("profile.role")}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none"
              >
{ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-black">{t(r.labelKey)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                <Mail size={11} /> {t("profile.email")}
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                <Phone size={11} /> {t("profile.phone")}
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                <Building2 size={11} /> {t("profile.company")}
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full input-dark rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
