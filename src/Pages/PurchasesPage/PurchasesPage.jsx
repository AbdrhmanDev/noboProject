import { Plus, Truck, Search } from "lucide-react";
import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const stats = [
  { labelKey: "purch.purchaseInvoices", value: "96", color: "#2b8cff" },
  { labelKey: "purch.totalPurchases", value: "76,890 ر.س", color: "#f5b800" },
  { labelKey: "purch.activeSuppliers", value: "24", color: "#17d9c4" },
  { labelKey: "purch.pendingOrders", value: "8", color: "#ff3d6b" },
];

const purchases = [
  { no: "PO-2025-1234", date: "25 مايو 2025", supplier: "شركة التقنية المتكاملة", amount: "12,400", status: "مستلمة" },
  { no: "PO-2025-1233", date: "24 مايو 2025", supplier: "مجموعة الخليج", amount: "8,750", status: "قيد الشحن" },
  { no: "PO-2025-1232", date: "23 مايو 2025", supplier: "مؤسسة الريادة", amount: "5,300", status: "مستلمة" },
  { no: "PO-2025-1231", date: "22 مايو 2025", supplier: "شركة النور التجارية", amount: "9,120", status: "معلقة" },
  { no: "PO-2025-1230", date: "21 مايو 2025", supplier: "مصنع البلاد", amount: "3,860", status: "مستلمة" },
];

export default function PurchasesPage({ onLogout }) {
  const { t } = useI18n();
  const [purchasesList, setPurchasesList] = useState([
    { no: "PO-2025-1234", date: "25 مايو 2025", supplier: "شركة التقنية المتكاملة", amount: "12,400", status: "مستلمة" },
    { no: "PO-2025-1233", date: "24 مايو 2025", supplier: "مجموعة الخليج", amount: "8,750", status: "قيد الشحن" },
  ]);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [newPurchase, setNewPurchase] = useState({ supplier: "", amount: "" });
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.PURCHASES}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("purch.title")}</h1>
        <div className="flex flex-wrap gap-2">
          <button className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Truck size={13} /> {t("purch.purchaseOrder")}</button>
          <button onClick={() => setShowAddPurchase(true)} className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Plus size={13} /> {t("purch.purchaseInvoice")}</button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-4">
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{t(s.labelKey)}</div>
          </div>
        ))}
      </div>

      {/* purchases table */}
      <div className="panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-sm">{t("purch.purchaseLog")}</h3>
          <div className="flex-1" />
          <div className="flex items-center gap-2 input-dark rounded-xl px-3 py-2">
            <Search size={14} color="#60a5fa" />
            <input placeholder={t("purch.search")} className="bg-transparent outline-none text-xs text-white placeholder-gray-500" />
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 text-right">
              <th className="font-medium pb-2">{t("purch.number")}</th>
              <th className="font-medium pb-2">{t("purch.date")}</th>
              <th className="font-medium pb-2">{t("purch.supplier")}</th>
              <th className="font-medium pb-2">{t("purch.amount")}</th>
              <th className="font-medium pb-2">{t("purch.status")}</th>
            </tr>
          </thead>
          <tbody>
            {purchasesList.map((p, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2.5 text-blue-400">{p.no}</td>
                <td className="py-2.5 text-gray-300">{p.date}</td>
                <td className="py-2.5 text-gray-200">{p.supplier}</td>
                <td className="py-2.5 text-gray-300">{p.amount}</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === "مستلمة" ? "bg-green-500/15 text-green-400" :
                    p.status === "معلقة" ? "bg-red-500/15 text-red-400" :
                    "bg-yellow-500/15 text-yellow-400"
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAddPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-gray-900 rounded-2xl p-4">
            <h3 className="font-bold mb-3">{t("purch.createPurchase")}</h3>
            <div className="space-y-2">
              <input value={newPurchase.supplier} onChange={(e) => setNewPurchase({ ...newPurchase, supplier: e.target.value })} placeholder={t("purch.supplier")} className="w-full input-dark p-2 rounded" />
              <input value={newPurchase.amount} onChange={(e) => setNewPurchase({ ...newPurchase, amount: e.target.value })} placeholder={t("purch.amount")} className="w-full input-dark p-2 rounded" />
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={() => setShowAddPurchase(false)} className="panel px-3 py-2 rounded">{t("common.cancel")}</button>
                <button onClick={() => {
                  const id = `PO-${Date.now()}`;
                  const today = new Date().toLocaleDateString("ar-SA");
                  setPurchasesList([{ no: id, date: today, supplier: newPurchase.supplier || "-", amount: newPurchase.amount || "0", status: "معلقة" }, ...purchasesList]);
                  setNewPurchase({ supplier: "", amount: "" });
                  setShowAddPurchase(false);
                }} className="primary-btn px-3 py-2 rounded">{t("common.save")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
