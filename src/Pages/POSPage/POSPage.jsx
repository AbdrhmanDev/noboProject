import { useState } from "react";
import { Search, Plus, Minus, Trash2, ScanLine, CreditCard, Banknote, Smartphone } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { ROUTES } from "../../utils/routes";

const products = [
  { id: 1, name: "جهاز POS متكامل", price: 1250, stock: 25 },
  { id: 2, name: "طابعة إيصالات حرارية", price: 980, stock: 42 },
  { id: 3, name: "قارئ باركود لاسلكي", price: 750, stock: 37 },
  { id: 4, name: "شاشة لمس 15 بوصة", price: 640, stock: 18 },
  { id: 5, name: "درج كاشير", price: 520, stock: 30 },
  { id: 6, name: "ماسح ضوئي", price: 380, stock: 55 },
];

export default function POSPage({ onLogout }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");

  const addItem = (p) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const filtered = products.filter((p) => p.name.includes(search));

  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.POS}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black brand-text">نقطة البيع POS</h1>
        <span className="text-xs text-gray-400">كاشير: شريف رضا</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        {/* products */}
        <div className="panel rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 input-dark rounded-xl px-3 py-2">
              <Search size={16} color="#60a5fa" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث عن منتج..."
                className="bg-transparent outline-none flex-1 text-sm text-white placeholder-gray-500"
              />
            </div>
            <button className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1">
              <ScanLine size={14} /> مسح
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                className="stat-card rounded-xl p-3 text-right hover:border-blue-500/50 cursor-pointer"
              >
                <div className="text-sm font-bold text-white">{p.name}</div>
                <div className="text-xs text-blue-400 mt-1">{p.price} ر.س</div>
                <div className="text-[10px] text-gray-500 mt-1">المخزون: {p.stock}</div>
              </button>
            ))}
          </div>
        </div>

        {/* cart */}
        <div className="panel rounded-2xl p-4 flex flex-col">
          <h3 className="font-bold text-sm mb-3">سلة البيع</h3>
          <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none max-h-[320px]">
            {cart.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-8">السلة فارغة</div>
            )}
            {cart.map((i) => (
              <div key={i.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                <div>
                  <div className="text-xs font-bold text-white">{i.name}</div>
                  <div className="text-[10px] text-gray-400">{i.price} ر.س</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(i.id, 1)} className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center"><Plus size={12} /></button>
                  <span className="text-sm font-bold w-5 text-center">{i.qty}</span>
                  <button onClick={() => changeQty(i.id, -1)} className="w-6 h-6 rounded bg-white/10 flex items-center justify-center"><Minus size={12} /></button>
                  <button onClick={() => removeItem(i.id)} className="text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>الضريبة (15%)</span>
              <span>{(total * 0.15).toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>الإجمالي</span>
              <span className="text-blue-400">{(total * 1.15).toFixed(2)} ر.س</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button className="primary-btn rounded-xl py-2 text-[11px] font-bold flex items-center justify-center gap-1"><CreditCard size={12} /> بطاقة</button>
            <button className="stat-card rounded-xl py-2 text-[11px] font-bold flex items-center justify-center gap-1"><Banknote size={12} /> نقدي</button>
            <button className="stat-card rounded-xl py-2 text-[11px] font-bold flex items-center justify-center gap-1"><Smartphone size={12} /> محفظة</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
