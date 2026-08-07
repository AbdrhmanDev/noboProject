import { useNavigate } from "react-router-dom";
import { Home, Compass } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

export default function NotFound() {
  const navigate = useNavigate();
  const { t, dir } = useI18n();

  return (
    <div dir={dir} className="bg-space min-h-screen w-full text-white flex items-center justify-center relative overflow-hidden">
      <div className="bg-stars absolute inset-0 pointer-events-none" />
      <div className="relative z-10 text-center px-6">
        <div className="text-8xl font-black brand-text">404</div>
        <h1 className="mt-4 text-3xl font-black">{t("nf.title")}</h1>
        <p className="mt-3 text-gray-400 text-sm max-w-md mx-auto">
          {t("nf.message")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="primary-btn rounded-xl px-5 py-3 text-sm font-bold flex items-center gap-2"
          >
            <Home size={16} /> {t("nf.backHome")}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="panel rounded-xl px-5 py-3 text-sm font-bold flex items-center gap-2"
          >
            <Compass size={16} /> {t("nf.back")}
          </button>
        </div>
      </div>
    </div>
  );
}
