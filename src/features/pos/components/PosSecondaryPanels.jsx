import { Barcode, Bot, Box, Database, Gift, Printer, WalletCards } from "lucide-react";
import { formatMoney } from "../../../shared/utils/formatters";
import { Metric } from "./PosPrimitives";

export function PosSecondaryPanels({
  setModal,
  expectedCashAmount,
  shiftCurrencyCode,
  shiftMinorUnitDigits,
  openShiftQuery,
  openShiftId,
  cashDrawerPermissionQuery,
  notify,
  insights,
  aiDismissed,
  setAiDismissed,
}) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#0c1627] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <WalletCards size={16} className="text-emerald-300" />
              تحكم الكاشير
            </h3>
            <button
              type="button"
              onClick={() => setModal("closeShift")}
              className="text-[10px] text-blue-300"
            >
              إدارة الوردية
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Metric
              label="Expected cash"
              value={formatMoney(expectedCashAmount, shiftCurrencyCode, shiftMinorUnitDigits)}
              detail="Server"
              tone="green"
            />
            <Metric
              label="Manual In / Out"
              value={`${formatMoney(
                openShiftQuery.data?.cashInAmount ?? 0,
                shiftCurrencyCode,
                shiftMinorUnitDigits,
              )} / ${formatMoney(
                openShiftQuery.data?.cashOutAmount ?? 0,
                shiftCurrencyCode,
                shiftMinorUnitDigits,
              )}`}
              detail="Current shift"
              tone="gold"
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] p-2 text-[11px]">
            <span className="text-slate-400">Drawer activity</span>
            <button
              type="button"
              disabled={!openShiftId || !cashDrawerPermissionQuery.hasPermission}
              onClick={() => setModal("cashMovement")}
              className="font-bold text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cash In / Out
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0c1627] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Gift size={16} className="text-pink-300" />
              العروض والخصومات
            </h3>
            <button
              type="button"
              onClick={() => setModal("promotions")}
              className="text-[10px] text-pink-300"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-pink-400/20 bg-pink-500/10 p-2.5">
              <div className="text-xs font-bold text-pink-100">خصم عام 10%</div>
              <div className="mt-1 text-[10px] text-slate-400">حتى 31 مايو · كل المنتجات</div>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2.5">
              <div className="text-xs font-bold text-amber-100">اشترِ 2 مشروب وخذ 1 مجانًا</div>
              <div className="mt-1 text-[10px] text-slate-400">عرض الفئة · نشط الآن</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0c1627] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Database size={16} className="text-amber-300" />
              ذكاء المخزون
            </h3>
            <button
              type="button"
              onClick={() => notify("تم فتح قائمة إعادة الطلب المقترحة.")}
              className="text-[10px] text-amber-300"
            >
              إعادة طلب
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">منتجات تحت حد الطلب</span>
              <span className="font-bold text-amber-300">18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">قريبة الانتهاء</span>
              <span className="font-bold text-rose-300">6</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">منتجات راكدة</span>
              <span className="font-bold text-blue-300">12</span>
            </div>
            <div className="mt-3 rounded-xl bg-amber-500/10 p-2 text-[10px] text-amber-100">
              المياه وصلت إلى حد إعادة الطلب المقترح.
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0c1627] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Printer size={16} className="text-blue-300" />
              مركز الأجهزة
            </h3>
            <button
              type="button"
              onClick={() => notify("تمت مزامنة حالة الأجهزة.")}
              className="text-[10px] text-blue-300"
            >
              مزامنة
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              [Printer, "الطابعة"],
              [Barcode, "الباركود"],
              [WalletCards, "الدفع"],
              [Box, "درج النقد"],
            ].map(([Icon, label]) => (
              <div key={label} className="rounded-xl border border-white/8 bg-white/[0.025] p-2">
                <Icon size={16} className="text-slate-300" />
                <div className="mt-1 text-[10px]">{label}</div>
                <div className="mt-0.5 text-[9px] text-emerald-300">● متصل</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-pink-400/20 bg-gradient-to-l from-pink-500/[0.11] to-[#0c1627] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-pink-100">
              <Bot size={17} />
              NOBO AI Retail Copilot
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              يكتشف → يشرح → يقترح. التنفيذ دائمًا بعد تأكيدك.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal("askAi")}
            className="rounded-xl border border-pink-400/30 bg-pink-500/15 px-3 py-2 text-xs font-bold text-pink-100 hover:bg-pink-500/25"
          >
            اسأل NOBO AI
          </button>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {insights
            .filter((item) => !aiDismissed.includes(item.id))
            .map(({ id, title, detail, action, icon: Icon }) => (
              <div key={id} className="rounded-xl border border-pink-400/15 bg-[#10182a]/80 p-3">
                <div className="flex gap-2">
                  <Icon size={17} className="mt-0.5 shrink-0 text-pink-300" />
                  <div>
                    <div className="text-xs font-bold text-pink-50">{title}</div>
                    <p className="mt-1 text-[10px] leading-4 text-slate-400">{detail}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModal("aiConfirm");
                    }}
                    className="rounded-lg bg-pink-500/20 px-2.5 py-1.5 text-[10px] font-bold text-pink-100"
                  >
                    {action}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiDismissed((items) => [...items, id])}
                    className="rounded-lg px-2 py-1.5 text-[10px] text-slate-400 hover:bg-white/10"
                  >
                    تجاهل
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
