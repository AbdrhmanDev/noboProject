import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Eye, EyeOff, Lock, MapPin, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "../../i18n/LanguageSwitcher";
import noboLogo from "../../assets/nobo-logo-transparent.png";
import { ROUTES } from "../../utils/routes";

const fieldClass = "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30";

function Field({ label, name, value, onChange, placeholder, type = "text", required = true, inputMode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-gray-300">{label}</span>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} inputMode={inputMode} className={fieldClass} />
    </label>
  );
}

function PasswordField({ label, name, value, onChange, show, onToggle, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-gray-300">{label}</span>
      <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30">
        <Lock size={15} className="shrink-0 text-gray-400" />
        <input name={name} type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} minLength="8" required className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500" />
        <button type="button" onClick={onToggle} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="text-gray-400 hover:text-white">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "", password: "", securityQuestion: "اسم أول مدرسة؟", securityAnswer: "",
    fullName: "", companyName: "", taxNumber: "", commercialRegister: "",
    city: "", district: "", street: "", buildingNumber: "", additionalNumber: "", postalCode: "",
  });
  const [error, setError] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const submitSignup = (event) => {
    event.preventDefault();
    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.");
      return;
    }
    navigate(ROUTES.DASHBOARD);
  };

  const signUpWithGoogle = () => {
    const companyFields = ["fullName", "companyName", "taxNumber", "commercialRegister", "city", "district", "street", "buildingNumber", "additionalNumber", "postalCode"];
    if (companyFields.some((field) => !form[field].trim())) {
      setError("أكمل بيانات الشركة والعنوان الوطني أولاً، ثم سجّل بحساب Google.");
      return;
    }
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <div dir="rtl" className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-space px-4 py-10 text-white">
      <div className="bg-stars pointer-events-none absolute inset-0" />
      <motion.main initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative z-10 w-full max-w-[440px] rounded-[24px] border border-white/10 bg-[#0d1224]/80 p-6 shadow-[0_0_80px_rgba(124,92,255,.2)] backdrop-blur-3xl sm:p-8">
        <div className="flex items-center justify-between" dir="ltr">
          <LanguageSwitcher />
          <button type="button" onClick={() => navigate(ROUTES.LOGIN)} className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
            العودة لتسجيل الدخول <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-5 text-center">
          <img src={noboLogo} alt="NOBO ERP" className="mx-auto w-60 object-contain" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">إنشاء حساب جديد</h1>
          <p className="mt-2 text-sm text-gray-400">أدخل بيانات حسابك وشركتك للبدء مع NOBO ERP.</p>
        </div>

        <form onSubmit={submitSignup} className="mt-7 space-y-4">
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-base font-semibold"><User size={18} className="text-violet-400" /> بيانات الحساب</h2>
            <div className="grid gap-4">
              <Field label="اسم المستخدم" name="username" value={form.username} onChange={updateField} placeholder="أدخل اسم المستخدم" />
              <PasswordField label="كلمة المرور (8 أحرف+)" name="password" value={form.password} onChange={updateField} show={showPassword} onToggle={() => setShowPassword((current) => !current)} placeholder="أنشئ كلمة مرور قوية" />
              <label className="block">
                <span className="mb-1.5 block text-xs text-gray-300">سؤال الأمان (لاستعادة كلمة المرور)</span>
                <select name="securityQuestion" value={form.securityQuestion} onChange={updateField} className={fieldClass}>
                  <option>اسم أول مدرسة؟</option>
                  <option>ما اسم مدينتك المفضلة؟</option>
                  <option>ما اسم أول حيوان أليف لك؟</option>
                </select>
              </label>
              <Field label="إجابة سؤال الأمان" name="securityAnswer" value={form.securityAnswer} onChange={updateField} placeholder="أدخل الإجابة" />
            </div>
            <p className="text-xs text-amber-300">احفظها جيداً — ستحتاجها لو نسيت كلمة المرور.</p>
          </section>

          <section className="space-y-4 border-t border-white/10 pt-5">
            <h2 className="flex items-center gap-2 text-base font-semibold"><Building2 size={18} className="text-violet-400" /> بيانات الشركة</h2>
            <div className="grid gap-4">
              <Field label="الاسم الكامل" name="fullName" value={form.fullName} onChange={updateField} placeholder="أدخل الاسم الكامل" />
              <Field label="اسم الشركة" name="companyName" value={form.companyName} onChange={updateField} placeholder="أدخل اسم الشركة" />
              <Field label="الرقم الضريبي" name="taxNumber" value={form.taxNumber} onChange={updateField} placeholder="310012345600003" inputMode="numeric" />
              <Field label="السجل التجاري" name="commercialRegister" value={form.commercialRegister} onChange={updateField} placeholder="1010123456" inputMode="numeric" />
            </div>
          </section>

          <section className="space-y-4 border-t border-white/10 pt-5">
            <h2 className="flex items-center gap-2 text-base font-semibold"><MapPin size={18} className="text-violet-400" /> العنوان الوطني</h2>
            <div className="grid gap-4">
              <Field label="المدينة" name="city" value={form.city} onChange={updateField} placeholder="الرياض" />
              <Field label="الحي" name="district" value={form.district} onChange={updateField} placeholder="النخيل" />
              <Field label="الشارع" name="street" value={form.street} onChange={updateField} placeholder="شارع الملك فهد" />
              <Field label="رقم المبنى" name="buildingNumber" value={form.buildingNumber} onChange={updateField} placeholder="1234" inputMode="numeric" />
              <Field label="الرقم الإضافي" name="additionalNumber" value={form.additionalNumber} onChange={updateField} placeholder="5678" inputMode="numeric" />
              <Field label="الرمز البريدي" name="postalCode" value={form.postalCode} onChange={updateField} placeholder="12345" inputMode="numeric" />
            </div>
          </section>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 font-bold text-white transition-all hover:from-violet-500 hover:to-blue-400">✅ إنشاء الحساب</motion.button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-gray-500"><span className="h-px flex-1 bg-white/10" />أو<span className="h-px flex-1 bg-white/10" /></div>
        <button type="button" onClick={signUpWithGoogle} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold transition hover:bg-white/10">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-[#4285f4]">G</span>
          سجّل بحساب Google
        </button>
        {error && <p className="mt-3 text-center text-sm text-rose-400" role="alert">{error}</p>}
        <p className="mt-3 text-center text-xs text-gray-400">إملأ بيانات الشركة فوق، وبعدين سجّل بحساب Google بدل ما تحط اسم مستخدم وكلمة مرور.</p>
      </motion.main>
    </div>
  );
}
