import { Plus, ShieldCheck, UserRound } from "lucide-react";
import { PosModal } from "./PosModal";

export function PosMiscDialogs({ modal, setModal, setCustomer, notify }) {
  return (
    <>
      {modal === "customer" && (
        <PosModal title="اختيار عميل" onClose={() => setModal(null)}>
          <div className="space-y-2">
            {["عميل زيارة", "شركة النور التجارية", "عميل VIP · محمد العتيبي"].map((name, index) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setCustomer({ name, id: `CUST-00${index + 1}` });
                  setModal(null);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 p-3 text-right hover:border-blue-400/50 hover:bg-blue-500/10"
              >
                <span className="flex items-center gap-2 text-xs font-bold">
                  <UserRound size={15} className="text-blue-300" />
                  {name}
                </span>
                <span className="text-[10px] text-slate-500">CUST-00{index + 1}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setCustomer({ name: "عميل جديد", id: "CUST-NEW" });
              setModal(null);
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold"
          >
            <Plus size={15} />
            إنشاء عميل جديد
          </button>
        </PosModal>
      )}

      {modal === "retrieve" && (
        <PosModal title="Held Drafts" onClose={() => setModal(null)}>
          <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
            Draft retrieval is not integrated yet.
          </p>
        </PosModal>
      )}

      {modal === "promotions" && (
        <PosModal title="Promotions Engine" onClose={() => setModal(null)}>
          <div className="space-y-2 text-xs">
            <div className="rounded-xl border border-pink-400/20 bg-pink-500/10 p-3">
              <b>خصم 10% عام</b>
              <p className="mt-1 text-slate-400">نشط · كل المنتجات · ينتهي 31 مايو</p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
              <b>اشترِ 2 وخذ 1 مجانًا</b>
              <p className="mt-1 text-slate-400">المشروبات · أولوية أقل من خصم العميل</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => notify("تم فتح معالج إنشاء عرض جديد.")}
            className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold"
          >
            إنشاء عرض جديد
          </button>
        </PosModal>
      )}

      {modal === "askAi" && (
        <PosModal title="اسأل NOBO AI" onClose={() => setModal(null)}>
          <textarea
            className="h-28 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none"
            placeholder="مثال: اقترح عرضًا على المشروبات الراكدة..."
          />
          <button
            type="button"
            onClick={() => {
              setModal(null);
              notify("تم إرسال سؤالك إلى NOBO AI.");
            }}
            className="mt-3 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold"
          >
            إرسال السؤال
          </button>
        </PosModal>
      )}

      {modal === "aiConfirm" && (
        <PosModal title="تأكيد الإجراء المقترح" onClose={() => setModal(null)}>
          <div className="rounded-xl border border-pink-400/20 bg-pink-500/10 p-3 text-xs leading-5 text-pink-50">
            <ShieldCheck size={17} className="mb-2 text-pink-300" />
            NOBO AI لا ينفذ أي عملية حساسة تلقائيًا. راجع الإجراء ثم أكده ليتم فتح الشاشة المناسبة.
          </div>
          <button
            type="button"
            onClick={() => {
              setModal(null);
              notify("تم تأكيد الاقتراح وفتح الإجراء المرتبط.");
            }}
            className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold"
          >
            تأكيد ومتابعة
          </button>
        </PosModal>
      )}
    </>
  );
}
