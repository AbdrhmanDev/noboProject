import { Plus, AlertTriangle, Package, ArrowLeftRight, Search } from "lucide-react";
import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";

const stats = [
  { labelKey: "inv.totalItems", value: "2,540", color: "#2b8cff" },
  { labelKey: "inv.stockValue", value: "486,200 ر.س", color: "#f5b800" },
  { labelKey: "inv.lowStock", value: "18", color: "#ff3d6b" },
  { labelKey: "inv.outOfStock", value: "6", color: "#8b5cf6" },
];

const items = [
  { name: "جهاز POS متكامل", sku: "POS-001", qty: 25, min: 10, loc: "مستودع أ" },
  { name: "طابعة إيصالات حرارية", sku: "PRN-042", qty: 42, min: 15, loc: "مستودع أ" },
  { name: "قارئ باركود لاسلكي", sku: "BAR-118", qty: 7, min: 20, loc: "مستودع ب" },
  { name: "شاشة لمس 15 بوصة", sku: "SCR-330", qty: 18, min: 8, loc: "مستودع أ" },
  { name: "درج كاشير", sku: "DRW-205", qty: 0, min: 5, loc: "مستودع ب" },
];

const lowStock = items.filter((i) => i.qty <= i.min);

export default function InventoryPage({ onLogout }) {
  const { t } = useI18n();
  const [itemsList, setItemsList] = useState(items);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", qty: 0, loc: "" });
  const [showTransfer, setShowTransfer] = useState(false);
  const [transfer, setTransfer] = useState({ sku: "", qty: 0, to: "" });
  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.INVENTORY}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("inv.title")}</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowTransfer(true)} className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><ArrowLeftRight size={13} /> {t("inv.transfer")}</button>
          <button onClick={() => setShowAddProduct(true)} className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Plus size={13} /> {t("inv.addProduct")}</button>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        {/* items table */}
        <div className="panel rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-sm">{t("inv.itemList")}</h3>
            <div className="flex-1" />
            <div className="flex items-center gap-2 input-dark rounded-xl px-3 py-2">
              <Search size={14} color="#60a5fa" />
              <input placeholder={t("inv.search")} className="bg-transparent outline-none text-xs text-white placeholder-gray-500" />
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 text-right">
                <th className="font-medium pb-2">{t("inv.product")}</th>
                <th className="font-medium pb-2">SKU</th>
                <th className="font-medium pb-2">{t("inv.qty")}</th>
                <th className="font-medium pb-2">{t("inv.min")}</th>
                <th className="font-medium pb-2">{t("inv.location")}</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((it, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-2.5 text-gray-200">{it.name}</td>
                  <td className="py-2.5 text-blue-400">{it.sku}</td>
                  <td className={`py-2.5 font-bold ${it.qty === 0 ? "text-red-400" : it.qty <= it.min ? "text-yellow-400" : "text-gray-300"}`}>{it.qty}</td>
                  <td className="py-2.5 text-gray-400">{it.min}</td>
                  <td className="py-2.5 text-gray-300">{it.loc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAddProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-4">
              <h3 className="font-bold mb-3">{t("inv.createProduct")}</h3>
              <div className="space-y-2">
                <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder={t("inv.product") } className="w-full input-dark p-2 rounded" />
                <input value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} placeholder="SKU" className="w-full input-dark p-2 rounded" />
                <input value={newProduct.qty} onChange={(e) => setNewProduct({ ...newProduct, qty: Number(e.target.value) })} placeholder={t("inv.qty")} className="w-full input-dark p-2 rounded" />
                <input value={newProduct.loc} onChange={(e) => setNewProduct({ ...newProduct, loc: e.target.value })} placeholder={t("inv.location")} className="w-full input-dark p-2 rounded" />
                <div className="flex gap-2 justify-end mt-3">
                  <button onClick={() => setShowAddProduct(false)} className="panel px-3 py-2 rounded">{t("common.cancel")}</button>
                  <button onClick={() => {
                    setItemsList([{ name: newProduct.name || "-", sku: newProduct.sku || `SKU-${Date.now()}`, qty: newProduct.qty || 0, min: 1, loc: newProduct.loc || "مستودع" }, ...itemsList]);
                    setNewProduct({ name: "", sku: "", qty: 0, loc: "" });
                    setShowAddProduct(false);
                  }} className="primary-btn px-3 py-2 rounded">{t("common.save")}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showTransfer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-4">
              <h3 className="font-bold mb-3">{t("inv.transferStock")}</h3>
              <div className="space-y-2">
                <input value={transfer.sku} onChange={(e) => setTransfer({ ...transfer, sku: e.target.value })} placeholder="SKU" className="w-full input-dark p-2 rounded" />
                <input value={transfer.qty} onChange={(e) => setTransfer({ ...transfer, qty: Number(e.target.value) })} placeholder={t("inv.qty")} className="w-full input-dark p-2 rounded" />
                <input value={transfer.to} onChange={(e) => setTransfer({ ...transfer, to: e.target.value })} placeholder={t("inv.location")} className="w-full input-dark p-2 rounded" />
                <div className="flex gap-2 justify-end mt-3">
                  <button onClick={() => setShowTransfer(false)} className="panel px-3 py-2 rounded">{t("common.cancel")}</button>
                  <button onClick={() => {
                    // simple stock transfer simulation: decrement matching sku
                    setItemsList(itemsList.map(it => it.sku === transfer.sku ? { ...it, qty: Math.max(0, it.qty - transfer.qty) } : it));
                    setTransfer({ sku: "", qty: 0, to: "" });
                    setShowTransfer(false);
                  }} className="primary-btn px-3 py-2 rounded">{t("common.save")}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* low stock alerts */}
        <div className="panel rounded-2xl p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={15} color="#ff3d6b" /> {t("inv.alerts")}</h3>
          <div className="space-y-3">
            {lowStock.map((it, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Package size={14} color="#ff3d6b" />
                  <div>
                    <div className="text-xs font-bold text-white">{it.name}</div>
                    <div className="text-[10px] text-gray-400">{it.loc}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.qty === 0 ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                  {it.qty === 0 ? t("inv.out") : t("inv.left", { n: it.qty })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
