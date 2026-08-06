import { Database } from "lucide-react";

export default function Footer() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-6 text-[11px] text-gray-500">
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> جميع الأنظمة تعمل بكفاءة</span>
      <span>نسخة النظام: 3.2.5</span>
      <span className="flex items-center gap-1.5 text-green-400"><Database size={12} /> قاعدة البيانات: متصلة</span>
      <span>آخر نسخ احتياطي: اليوم 02:00 ص</span>
      <span>© 2025 NOBO ERP جميع الحقوق محفوظة</span>
    </div>
  );
}

