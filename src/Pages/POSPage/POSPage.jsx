import { useMemo, useState } from "react";
import {
  AlertTriangle, Apple, Banknote, Barcode, Bot, Box, Check, CupSoda,
  Package,
  CircleDollarSign, CreditCard, Crown, Database, Gift, Minus, Nfc,
  Layers3, PauseCircle, Plus, Printer, QrCode, RotateCcw, Search, ShieldCheck,
  Sandwich, ShoppingCart, Sparkles, Trash2, Truck, UserRound, WalletCards, Wifi, X, Edit,
} from "lucide-react";
import { ROUTES } from "../../utils/routes";
import AppLayout from "../../components/AppLayout";

const SAR = new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 2 });

const categories = [
  { id: "الكل", label: "الكل", icon: Layers3 }, { id: "المشروبات", label: "المشروبات", icon: CupSoda },
  { id: "السناكات", label: "السناكات", icon: Gift }, { id: "الألبان", label: "الألبان", icon: Package },
  { id: "الفواكه والخضار", label: "الفواكه والخضار", icon: Apple }, { id: "المخبوزات", label: "المخبوزات", icon: Sandwich },
  { id: "العناية الشخصية", label: "العناية الشخصية", icon: Sparkles },
];
const initialProducts = [
  { id: 1, name: "كوكا كولا 330 مل", sku: "SKU 1001", price: 4, stock: 84, category: "المشروبات", art: "🥤", color: "from-red-500/30 to-rose-800/10" },
  { id: 2, name: "بيبسي 330 مل", sku: "SKU 1002", price: 4, stock: 61, category: "المشروبات", art: "🥫", color: "from-blue-500/30 to-blue-800/10" },
  { id: 3, name: "مياه 600 مل", sku: "SKU 1003", price: 1.5, stock: 18, category: "المشروبات", art: "💧", color: "from-cyan-400/30 to-slate-700/10" },
  { id: 4, name: "عصير برتقال 1 لتر", sku: "SKU 1004", price: 8, stock: 25, category: "المشروبات", art: "🧃", color: "from-orange-400/30 to-amber-800/10" },
  { id: 5, name: "شيبس كلاسيك 23 جم", sku: "SKU 1005", price: 2.5, stock: 42, category: "السناكات", art: "🍟", color: "from-amber-400/30 to-yellow-800/10" },
  { id: 6, name: "سنيكرز 50 جم", sku: "SKU 1006", price: 3, stock: 39, category: "السناكات", art: "🍫", color: "from-rose-500/30 to-red-900/10" },
  { id: 7, name: "حليب كامل الدسم 1 لتر", sku: "SKU 1007", price: 5.5, stock: 9, category: "الألبان", art: "🥛", color: "from-slate-300/25 to-blue-900/10" },
  { id: 8, name: "بيض 30 حبة", sku: "SKU 1008", price: 18, stock: 20, category: "الألبان", art: "🥚", color: "from-amber-100/25 to-amber-700/10" },
  { id: 9, name: "موز كيلو", sku: "SKU 1009", price: 6, stock: 33, category: "الفواكه والخضار", art: "🍌", color: "from-yellow-400/30 to-amber-800/10" },
  { id: 10, name: "تفاح أحمر كيلو", sku: "SKU 1010", price: 7, stock: 28, category: "الفواكه والخضار", art: "🍎", color: "from-red-400/30 to-rose-900/10" },
  { id: 11, name: "خبز توست", sku: "SKU 1011", price: 4, stock: 15, category: "المخبوزات", art: "🍞", color: "from-amber-200/30 to-orange-900/10" },
  { id: 12, name: "مناديل ورقية", sku: "SKU 1012", price: 11, stock: 7, category: "العناية الشخصية", art: "🧻", color: "from-violet-300/20 to-slate-700/10" },
];

const paymentMethods = [
  { id: "cash", label: "نقدي", icon: Banknote, key: "F9", color: "text-emerald-300" },
  { id: "card", label: "بطاقة", icon: CreditCard, key: "F10", color: "text-blue-300" },
  { id: "nfc", label: "NFC / Tap", icon: Nfc, key: "F11", color: "text-violet-300" },
  { id: "qr", label: "QR", icon: QrCode, key: "F12", color: "text-amber-300" },
];

function IconButton({ icon: Icon, label, onClick, tone = "default", disabled = false }) {
  const tones = {
    default: "border-white/10 bg-white/[0.035] hover:border-blue-400/45 hover:bg-blue-500/10",
    danger: "border-rose-500/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
    pink: "border-pink-400/25 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20",
  };
  return <button type="button" disabled={disabled} onClick={onClick} className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}><Icon size={15} />{label}</button>;
}

function Metric({ label, value, detail, tone = "blue" }) {
  const colors = { blue: "text-blue-300", green: "text-emerald-300", gold: "text-amber-300", pink: "text-pink-300" };
  return <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><div className="text-[11px] text-slate-400">{label}</div><div className={`mt-1 text-lg font-black ${colors[tone]}`}>{value}</div>{detail && <div className="mt-1 text-[10px] text-slate-500">{detail}</div>}</div>;
}

function Modal({ title, children, onClose }) {
  let theme = typeof document !== "undefined" ? document.documentElement.dataset.theme : "dark";
  const isDark = theme !== "light";
  return <div className={`fixed inset-0 z-[100] grid place-items-center ${isDark ? 'bg-black/50' : 'bg-white/60'} p-4 backdrop-blur-sm`}>
    <div role="dialog" aria-modal="true" className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${isDark ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-900'}`}>
      <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{title}</h2><button type="button" onClick={onClose} className={`${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'} rounded-lg p-1`}><X size={18} /></button></div>
      {children}
    </div>
  </div>;
}

export default function POSPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [tender, setTender] = useState("cash");
  const [cashGiven, setCashGiven] = useState(0);
  const [heldOrders, setHeldOrders] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [productList, setProductList] = useState(() => initialProducts);
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", price: "", stock: "", category: categories[0].id, art: "", color: "from-slate-300/25 to-blue-900/10" });
  const [shiftOpen, setShiftOpen] = useState(true);
  const [actualCash, setActualCash] = useState("4625");
  const [aiDismissed, setAiDismissed] = useState([]);

  const filteredProducts = useMemo(() => productList.filter((product) => (category === "الكل" || product.category === category) && `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase())), [category, query, productList]);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountValue = subtotal * (Number(discount) / 100);
  const vat = (subtotal - discountValue) * 0.15;
  const total = subtotal - discountValue + vat;
  const cashChange = Math.max(0, Number(cashGiven || 0) - total);
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 3000); };

  const addItem = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing && existing.qty >= product.stock) { notify("لا يمكن إضافة كمية أكبر من المخزون المتاح."); return current; }
      return existing ? current.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item) : [...current, { ...product, qty: 1 }];
    });
  };
  const changeQty = (id, amount) => setCart((current) => current.flatMap((item) => {
    if (item.id !== id) return [item];
    const next = item.qty + amount;
    if (next <= 0) return [];
    if (next > item.stock) { notify("وصلت للكمية المتاحة في المخزون."); return [item]; }
    return [{ ...item, qty: next }];
  }));
  const handleAddProduct = () => {
    if (!newProduct.name) { notify("أدخل اسم المنتج"); return; }
    const id = Date.now();
    const prod = {
      id,
      name: newProduct.name,
      sku: newProduct.sku || `SKU ${id}`,
      price: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      category: newProduct.category,
      art: newProduct.art || "📦",
      color: newProduct.color || "from-slate-300/25 to-blue-900/10",
    };
    setProductList((cur) => [prod, ...cur]);
    setModal(null);
    setCategory(prod.category);
    setNewProduct({ name: "", sku: "", price: "", stock: "", category: categories[0].id, art: "", color: "from-slate-300/25 to-blue-900/10" });
    notify("تم إضافة المنتج.");
  };
  const [editingProduct, setEditingProduct] = useState(null);

  const [lastDeleted, setLastDeleted] = useState(null);

  const handleUpdateProduct = () => {
    if (!editingProduct || !editingProduct.name) { notify("أدخل اسم المنتج"); return; }
    setProductList((cur) => cur.map((p) => p.id === editingProduct.id ? { ...editingProduct, price: Number(editingProduct.price || 0), stock: Number(editingProduct.stock || 0) } : p));
    setModal(null);
    setCategory(editingProduct.category);
    setEditingProduct(null);
    notify("تم تحديث المنتج.");
  };

  const handleDeleteProduct = (id) => {
    const prod = productList.find((p) => p.id === id);
    if (!prod) return;
    if (!window.confirm("هل تريد حذف هذا المنتج؟")) return;
    const idx = productList.findIndex((p) => p.id === id);
    setProductList((cur) => cur.filter((p) => p.id !== id));
    // set undo state with timeout
    const timer = setTimeout(() => setLastDeleted(null), 7000);
    setLastDeleted({ product: prod, index: idx, timer });
    notify("تم حذف المنتج.");
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    clearTimeout(lastDeleted.timer);
    setProductList((cur) => {
      const next = [...cur];
      const insertAt = Math.min(Math.max(0, lastDeleted.index ?? 0), next.length);
      next.splice(insertAt, 0, lastDeleted.product);
      return next;
    });
    setLastDeleted(null);
    notify("تم استعادة المنتج.");
  };
  const holdOrder = () => {
    if (!cart.length) return notify("أضف منتجات إلى السلة أولًا.");
    setHeldOrders((orders) => [...orders, { id: Date.now(), items: cart, discount, customer, total }]);
    setCart([]); setDiscount(0); setCustomer(null); notify("تم حفظ الفاتورة مؤقتًا.");
  };
  const retrieveOrder = (id) => {
    const order = heldOrders.find((item) => item.id === id);
    if (!order) return;
    setCart(order.items); setDiscount(order.discount); setCustomer(order.customer); setHeldOrders((orders) => orders.filter((item) => item.id !== id)); setModal(null); notify("تم استرجاع الفاتورة المؤقتة.");
  };
  const completeSale = () => {
    if (!cart.length) return notify("السلة فارغة. اختر منتجًا لإتمام البيع.");
    if (tender === "cash" && Number(cashGiven || 0) < total) return notify("المبلغ المستلم أقل من إجمالي الفاتورة.");
    setModal("success");
  };
  const resetSale = () => { setCart([]); setDiscount(0); setCustomer(null); setCashGiven(0); setModal(null); notify("تم إنشاء فاتورة جديدة."); };
  const insights = [
    { id: "water", title: "المياه ستنفد خلال 3 أيام.", detail: "مخزون فرع الرياض: 18 وحدة مقابل معدل بيع 6 وحدات يوميًا.", action: "إنشاء طلب شراء", icon: AlertTriangle },
    { id: "sales", title: "مبيعات الشيبس انخفضت 18%.", detail: "مقارنة بمتوسط آخر 4 أسابيع، بثقة 91%.", action: "اقتراح عرض", icon: Bot },
    { id: "branch", title: "فرع جدة يحتاج 40 وحدة من المنتج X.", detail: "الطلب المتوقع يتجاوز المخزون المتاح نهاية الأسبوع.", action: "إنشاء تحويل", icon: Truck },
  ];

  return (
    <AppLayout activePath={ROUTES.POS}>
      <main className="min-w-0 flex-1 p-3 sm:p-4 xl:p-5">
      <div className="mx-auto max-w-[1680px] space-y-4" dir="rtl">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-black/15 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2"><div className="text-[10px] text-slate-400">POS MAIN / SMART CHECKOUT</div><div className="text-xs font-bold text-slate-900">الرياض الرئيسي · POS-01</div></div>
            <div className="rounded-xl border border-white/10 px-3 py-2"><div className="text-[10px] text-slate-400">الكاشير</div><div className="flex items-center gap-1 text-xs font-bold"><UserRound size={13} className="text-blue-300" /> أحمد محمد</div></div>
            <button type="button" onClick={() => setModal(shiftOpen ? "closeShift" : "openShift")} className={`rounded-xl border px-3 py-2 text-xs font-bold ${shiftOpen ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : "border-amber-400/25 bg-amber-500/10 text-amber-200"}`}><span className="ml-1 inline-block h-2 w-2 rounded-full bg-current" />{shiftOpen ? "وردية نشطة · 05:42 س" : "فتح وردية"}</button>
          </div>
          <div className="flex flex-1 items-center gap-2 lg:max-w-xl">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-blue-400/60"><Search size={16} className="shrink-0 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-500" placeholder="ابحث بالباركود أو الاسم أو SKU..." /><kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">F2</kbd></div>
            <div className="hidden items-center gap-1 rounded-lg border border-emerald-400/15 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-300 sm:flex"><Wifi size={15} /> Online</div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0 space-y-4">
            <div className="grid grid-flow-col auto-cols-[82px] gap-2 overflow-x-auto pb-1 scrollbar-none sm:auto-cols-[96px]">
              {categories.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setCategory(id)} className={`flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-xl border px-2 text-[10px] font-semibold transition ${category === id ? "border-blue-400/70 bg-blue-500/15 text-blue-100 shadow-lg shadow-blue-950/30" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/[0.06]"}`}><Icon size={18} className={category === id ? "text-blue-300" : "text-slate-500"} /><span className="max-w-full truncate">{label}</span></button>) }
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5"><div><h1 className="text-base font-black text-slate-900">جميع المنتجات <span className="text-slate-500">({filteredProducts.length})</span></h1><p className="mt-0.5 text-[10px] text-slate-500">أسعار لحظية · مخزون مباشر · لمس للإضافة للسلة</p></div><div className="flex gap-2"><IconButton icon={Barcode} label="مسح باركود" onClick={() => notify("وضع المسح جاهز لاستقبال الباركود.")} /><IconButton icon={Gift} label="العروض النشطة" onClick={() => setModal("promotions")} tone="pink" /><IconButton icon={Box} label="إضافة منتج" onClick={() => setModal("addProduct")} /></div></div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredProducts.map((product) => (
                <div key={product.id} role="button" tabIndex={0} onClick={() => addItem(product)} className="pos-product-card relative group overflow-hidden rounded-xl border p-2.5 text-right transition hover:-translate-y-0.5 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-950/20">
                  <div className={`relative mb-2 grid aspect-[1.3] place-items-center rounded-lg bg-gradient-to-br text-4xl ${product.color}`}>
                    <span className="absolute left-2 top-2 text-slate-400/80">☆</span>
                    {product.art}
                    <span className="absolute bottom-1.5 right-2 rounded px-1.5 py-0.5 text-[9px] pos-sku-badge">SKU {product.sku.replace("SKU ", "")}</span>
                  </div>
                  <div className="line-clamp-2 min-h-8 text-[11px] font-bold leading-4 pos-product-name">{product.name}</div>
                  <div className="mt-2 flex items-end justify-between"><span className="text-xs font-black pos-product-price">{SAR.format(product.price)}</span><span className={`text-[9px] font-bold ${product.stock <= 10 ? "text-amber-400" : "text-emerald-300"}`}>{product.stock > 10 ? "متوفر" : "مخزون منخفض"}</span></div>
                  <div className="absolute top-2 left-2 flex gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }} className="rounded bg-white/10 p-1 text-sm hover:bg-rose-500/10"><Trash2 size={14} /></button>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setModal('editProduct'); }} className="rounded bg-white/10 p-1 text-sm hover:bg-blue-500/10"><Edit size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="pos-aside flex min-h-[620px] flex-col rounded-2xl border border-white/10 bg-slate-950/75 p-3 shadow-xl shadow-black/20 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 text-blue-300"><ShoppingCart size={16} /></div><div><h2 className="text-sm font-bold">سلة المشتريات</h2><span className="text-[10px] text-slate-500">{cart.reduce((sum, item) => sum + item.qty, 0)} صنف في الفاتورة</span></div></div><button type="button" onClick={() => setModal("customer")} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-blue-300 hover:bg-blue-500/10">{customer ? customer.name : "اختيار عميل"}</button></div>
            {customer && <div className="mb-2 flex items-center justify-between rounded-xl bg-blue-500/10 px-3 py-2 text-xs text-blue-100"><span className="flex items-center gap-1"><Crown size={13} className="text-amber-300" />{customer.name} · سعر VIP</span><button type="button" onClick={() => setCustomer(null)}><X size={14} /></button></div>}
            <div className="min-h-36 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
              {!cart.length && <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-white/10 text-center"><div><ShoppingCart className="mx-auto mb-2 text-slate-600" size={26} /><p className="text-xs text-slate-500">السلة فارغة</p><p className="mt-1 text-[10px] text-slate-600">اختر المنتجات لتبدأ عملية البيع</p></div></div>}
              {cart.map((item) => <div key={item.id} className="pos-card-box rounded-xl border border-white/7 bg-slate-950/70 p-2.5"><div className="flex gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-lg">{item.art}</span><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-slate-100">{item.name}</div><div className="mt-0.5 text-[10px] text-slate-500">{SAR.format(item.price)} · {item.sku}</div></div><button type="button" onClick={() => setCart((items) => items.filter((cartItem) => cartItem.id !== item.id))} className="text-slate-500 hover:text-rose-300"><Trash2 size={15} /></button></div><div className="mt-2 flex items-center justify-between"><div className="flex items-center rounded-lg border border-white/10"><button type="button" onClick={() => changeQty(item.id, -1)} className="grid h-7 w-7 place-items-center text-slate-300 hover:bg-white/10"><Minus size={13} /></button><span className="w-7 text-center text-xs font-bold">{item.qty}</span><button type="button" onClick={() => changeQty(item.id, 1)} className="grid h-7 w-7 place-items-center text-blue-300 hover:bg-blue-500/15"><Plus size={13} /></button></div><span className="text-xs font-bold">{SAR.format(item.qty * item.price)}</span></div></div>)}
            </div>
            <div className="mt-3 border-t border-white/10 pt-3">
              <button type="button" onClick={() => setModal("discount")} className="mb-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-300 hover:border-pink-400/35"><span className="flex items-center gap-2"><Gift size={14} className="text-pink-300" />خصم وعروض</span><span className="font-bold text-pink-300">{discount ? `${discount}%` : "إضافة"}</span></button>
              <div className="space-y-1 text-xs"><div className="flex justify-between text-slate-400"><span>المجموع الفرعي</span><span>{SAR.format(subtotal)}</span></div><div className="flex justify-between text-pink-300"><span>الخصم</span><span>- {SAR.format(discountValue)}</span></div><div className="flex justify-between text-slate-400"><span>ضريبة القيمة المضافة 15%</span><span>{SAR.format(vat)}</span></div><div className="mt-2 flex items-end justify-between border-t border-white/10 pt-2"><span className="font-bold">الإجمالي</span><span className="text-2xl font-black text-blue-300">{SAR.format(total)}</span></div></div>
              <div className="mt-3 grid grid-cols-4 gap-2">{paymentMethods.map(({ id, label, icon: Icon, key, color }) => <button type="button" key={id} onClick={() => setTender(id)} className={`rounded-xl border py-2 text-center transition ${tender === id ? "border-blue-400 bg-blue-500/15" : "border-white/10 bg-white/[0.025] hover:bg-white/10"}`}><Icon size={16} className={`mx-auto ${color}`} /><span className="mt-1 block text-[10px] font-bold">{label}</span><span className="text-[9px] text-slate-500">{key}</span></button>)}</div>
              {tender === "cash" && <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-500/8 p-2"><Banknote size={16} className="text-emerald-300" /><input type="number" min="0" value={cashGiven} onChange={(event) => setCashGiven(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="المبلغ المستلم" /><span className="text-[10px] text-emerald-300">الباقي {SAR.format(cashChange)}</span></div>}
              <div className="mt-3 grid grid-cols-3 gap-2"><IconButton icon={PauseCircle} label="حفظ مؤقت" onClick={holdOrder} /><IconButton icon={RotateCcw} label="استرجاع" onClick={() => setModal("retrieve")} /><IconButton icon={CircleDollarSign} label="حركة نقدية" onClick={() => setModal("cashMovement")} /></div>
              <button type="button" disabled={!shiftOpen} onClick={completeSale} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-[#0A84FF] text-sm font-black shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><Check size={19} />إتمام البيع · {SAR.format(total)}<kbd className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px]">F1</kbd></button>
            </div>
          </aside>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="pos-stat-card rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold"><WalletCards size={16} className="text-emerald-300" />تحكم الكاشير</h3><button type="button" onClick={() => setModal("closeShift")} className="text-[10px] text-blue-300">إدارة الوردية</button></div><div className="grid grid-cols-2 gap-2"><Metric label="النقدية المتوقعة" value="4,625" detail="SAR" tone="green" /><Metric label="النقدية الفعلية" value={actualCash || "0"} detail="SAR" tone="gold" /></div><div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 p-2 text-[11px]"><span className="text-slate-500">فرق الصندوق</span><span className="font-bold text-emerald-300">0.00 SAR</span></div></div>
          <div className="pos-stat-card rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold"><Gift size={16} className="text-pink-300" />العروض والخصومات</h3><button type="button" onClick={() => setModal("promotions")} className="text-[10px] text-pink-300">عرض الكل</button></div><div className="space-y-2"><div className="rounded-xl border border-pink-400/20 bg-pink-500/10 p-2.5"><div className="text-xs font-bold text-pink-600">خصم عام 10%</div><div className="mt-1 text-[10px] text-slate-500">حتى 31 مايو · كل المنتجات</div></div><div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2.5"><div className="text-xs font-bold text-amber-700">اشترِ 2 مشروب وخذ 1 مجانًا</div><div className="mt-1 text-[10px] text-slate-500">عرض الفئة · نشط الآن</div></div></div></div>
          <div className="pos-stat-card rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold"><Database size={16} className="text-amber-300" />ذكاء المخزون</h3><button type="button" onClick={() => notify("تم فتح قائمة إعادة الطلب المقترحة.")} className="text-[10px] text-amber-300">إعادة طلب</button></div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-500">منتجات تحت حد الطلب</span><span className="font-bold text-amber-600">18</span></div><div className="flex justify-between"><span className="text-slate-500">قريبة الانتهاء</span><span className="font-bold text-rose-500">6</span></div><div className="flex justify-between"><span className="text-slate-500">منتجات راكدة</span><span className="font-bold text-blue-500">12</span></div><div className="mt-3 rounded-xl bg-amber-500/10 p-2 text-[10px] text-amber-700">المياه وصلت إلى حد إعادة الطلب المقترح.</div></div></div>
          <div className="pos-stat-card rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold"><Printer size={16} className="text-blue-300" />مركز الأجهزة</h3><button type="button" onClick={() => notify("تمت مزامنة حالة الأجهزة.")} className="text-[10px] text-blue-300">مزامنة</button></div><div className="grid grid-cols-2 gap-2">{[[Printer, "الطابعة"], [Barcode, "الباركود"], [WalletCards, "الدفع"], [Box, "درج النقد"]].map(([Icon, label]) => <div key={label} className="rounded-xl border border-white/8 bg-white/10 p-2"><Icon size={16} className="text-slate-500" /><div className="mt-1 text-[10px] text-slate-600">{label}</div><div className="mt-0.5 text-[9px] text-emerald-600">● متصل</div></div>)}</div></div>
        </section>

        <section className="rounded-2xl border border-pink-400/20 bg-pink-50 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="flex items-center gap-2 text-sm font-bold text-pink-600"><Bot size={17} />NOBO AI Retail Copilot</h3><p className="mt-1 text-[11px] text-slate-500">يكتشف → يشرح → يقترح. التنفيذ دائمًا بعد تأكيدك.</p></div><button type="button" onClick={() => setModal("askAi")} className="rounded-xl border border-pink-400/30 bg-pink-500/15 px-3 py-2 text-xs font-bold text-pink-700 hover:bg-pink-500/25">اسأل NOBO AI</button></div><div className="grid gap-3 lg:grid-cols-3">{insights.filter((item) => !aiDismissed.includes(item.id)).map(({ id, title, detail, action, icon: Icon }) => <div key={id} className="rounded-xl border border-pink-400/15 bg-white/90 p-3"><div className="flex gap-2"><Icon size={17} className="mt-0.5 shrink-0 text-pink-500" /><div><div className="text-xs font-bold text-pink-700">{title}</div><p className="mt-1 text-[10px] leading-4 text-slate-600">{detail}</p></div></div><div className="mt-3 flex gap-2"><button type="button" onClick={() => { setModal("aiConfirm"); }} className="rounded-lg bg-pink-500/20 px-2.5 py-1.5 text-[10px] font-bold text-pink-700">{action}</button><button type="button" onClick={() => setAiDismissed((items) => [...items, id])} className="rounded-lg px-2 py-1.5 text-[10px] text-slate-500 hover:bg-slate-100">تجاهل</button></div></div>)}</div></section>
      </div>

      {toast && <div className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-xl border border-blue-400/25 bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-xl">{toast}</div>}
      {lastDeleted && (
        <div className={`fixed bottom-5 left-5 z-[120] flex items-center gap-3 rounded-xl border px-3 py-2 ${typeof document !== 'undefined' && document.documentElement.dataset.theme !== 'light' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="text-sm">تم حذف المنتج</div>
          <button onClick={undoDelete} className="rounded-md bg-blue-600 px-3 py-1 text-xs font-bold text-white">تراجع</button>
        </div>
      )}
      {modal === "addProduct" && <Modal title="إضافة منتج" onClose={() => setModal(null)}><div className="space-y-3">
        <label className="text-xs text-slate-400">اسم المنتج</label>
        <input value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400">SKU</label>
            <input value={newProduct.sku} onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400">الفئة</label>
            <select value={newProduct.category} onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400">السعر</label>
            <input value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} type="number" className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400">الكمية</label>
            <input value={newProduct.stock} onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))} type="number" className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
          </div>
        </div>
        <label className="text-xs text-slate-400">رمز المنتج</label>
        <input value={newProduct.art} onChange={(e) => setNewProduct((p) => ({ ...p, art: e.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
        <label className="text-xs text-slate-400">ألوان الخلفية (Tailwind gradient classes)</label>
        <input value={newProduct.color} onChange={(e) => setNewProduct((p) => ({ ...p, color: e.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
        <div className="pt-2"><button type="button" onClick={handleAddProduct} className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold">إضافة المنتج</button></div>
      </div></Modal>}
      {modal === "editProduct" && editingProduct && <Modal title="تعديل منتج" onClose={() => { setModal(null); setEditingProduct(null); }}>
        <div className="space-y-3">
          <label className="text-xs text-slate-400">اسم المنتج</label>
          <input value={editingProduct.name} onChange={(e) => setEditingProduct((p) => ({ ...p, name: e.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">SKU</label>
              <input value={editingProduct.sku} onChange={(e) => setEditingProduct((p) => ({ ...p, sku: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400">الفئة</label>
              <select value={editingProduct.category} onChange={(e) => setEditingProduct((p) => ({ ...p, category: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">السعر</label>
              <input value={editingProduct.price} onChange={(e) => setEditingProduct((p) => ({ ...p, price: e.target.value }))} type="number" className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400">الكمية</label>
              <input value={editingProduct.stock} onChange={(e) => setEditingProduct((p) => ({ ...p, stock: e.target.value }))} type="number" className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
            </div>
          </div>
          <label className="text-xs text-slate-400">رمز المنتج</label>
          <input value={editingProduct.art} onChange={(e) => setEditingProduct((p) => ({ ...p, art: e.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
          <label className="text-xs text-slate-400">ألوان الخلفية (Tailwind gradient classes)</label>
          <input value={editingProduct.color} onChange={(e) => setEditingProduct((p) => ({ ...p, color: e.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" />
          <div className="pt-2 grid grid-cols-2 gap-2"><button type="button" onClick={handleUpdateProduct} className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold">حفظ التعديلات</button><button type="button" onClick={() => { if (editingProduct) { handleDeleteProduct(editingProduct.id); setModal(null); setEditingProduct(null); } }} className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold">حذف</button></div>
        </div>
      </Modal>}
      {modal === "customer" && <Modal title="اختيار عميل" onClose={() => setModal(null)}><div className="space-y-2">{["عميل زيارة", "شركة النور التجارية", "عميل VIP · محمد العتيبي"].map((name, index) => <button key={name} type="button" onClick={() => { setCustomer({ name, id: `CUST-00${index + 1}` }); setModal(null); }} className="flex w-full items-center justify-between rounded-xl border border-white/10 p-3 text-right hover:border-blue-400/50 hover:bg-blue-500/10"><span className="flex items-center gap-2 text-xs font-bold"><UserRound size={15} className="text-blue-300" />{name}</span><span className="text-[10px] text-slate-500">CUST-00{index + 1}</span></button>)}</div><button type="button" onClick={() => { setCustomer({ name: "عميل جديد", id: "CUST-NEW" }); setModal(null); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold"><Plus size={15} />إنشاء عميل جديد</button></Modal>}
      {modal === "discount" && <Modal title="خصم وعروض" onClose={() => setModal(null)}><label className="block text-xs text-slate-500">نسبة الخصم المسموح بها</label><div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-100 px-3"><input type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" /><span className="text-slate-600">%</span></div><div className="mt-3 grid grid-cols-3 gap-2">{[5, 10, 15].map((value) => <button type="button" key={value} onClick={() => setDiscount(value)} className="rounded-xl border border-pink-400/20 bg-pink-500/10 py-2 text-xs text-pink-700">{value}%</button>)}</div><button type="button" onClick={() => { setModal(null); notify("تم تطبيق الخصم وتسجيله في سجل التدقيق."); }} className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold">تطبيق الخصم</button></Modal>}
      {modal === "retrieve" && <Modal title="الفواتير المؤقتة" onClose={() => setModal(null)}>{heldOrders.length ? <div className="space-y-2">{heldOrders.map((order, index) => <button key={order.id} type="button" onClick={() => retrieveOrder(order.id)} className="flex w-full items-center justify-between rounded-xl border border-white/10 p-3 text-right hover:bg-white/5"><span className="text-xs">فاتورة معلقة #{index + 1} · {order.items.length} أصناف</span><span className="text-xs font-bold text-blue-300">{SAR.format(order.total)}</span></button>)}</div> : <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">لا توجد فواتير مؤقتة.</p>}</Modal>}
      {modal === "cashMovement" && <Modal title="حركة نقدية" onClose={() => setModal(null)}><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => notify("تم فتح نموذج إضافة نقدية مع سجل تدقيق.")} className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-100">Paid In<br /><span className="text-[10px] font-normal text-emerald-300">إضافة نقدية</span></button><button type="button" onClick={() => notify("تم فتح نموذج إخراج نقدية ويتطلب سببًا.")} className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-xs font-bold text-amber-100">Paid Out<br /><span className="text-[10px] font-normal text-amber-300">إخراج نقدية</span></button></div></Modal>}
      {modal === "promotions" && <Modal title="Promotions Engine" onClose={() => setModal(null)}><div className="space-y-2 text-xs"><div className="rounded-xl border border-pink-400/20 bg-pink-500/10 p-3"><b>خصم 10% عام</b><p className="mt-1 text-slate-400">نشط · كل المنتجات · ينتهي 31 مايو</p></div><div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3"><b>اشترِ 2 وخذ 1 مجانًا</b><p className="mt-1 text-slate-400">المشروبات · أولوية أقل من خصم العميل</p></div></div><button type="button" onClick={() => notify("تم فتح معالج إنشاء عرض جديد.")} className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold">إنشاء عرض جديد</button></Modal>}
      {modal === "openShift" && <Modal title="فتح وردية جديدة" onClose={() => setModal(null)}><p className="text-xs leading-5 text-slate-500">سيتم تسجيل رصيد افتتاحي للكاشير أحمد محمد على POS-01.</p><input type="number" defaultValue="1500" className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" /><button type="button" onClick={() => { setShiftOpen(true); setModal(null); notify("تم فتح الوردية وتسجيل الرصيد الافتتاحي."); }} className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold">تأكيد فتح الوردية</button></Modal>}
      {modal === "closeShift" && <Modal title="إغلاق الوردية" onClose={() => setModal(null)}><div className="grid grid-cols-2 gap-2"><Metric label="النقدية المتوقعة" value="4,625 SAR" tone="green" /><Metric label="النقدية الفعلية" value={`${actualCash || 0} SAR`} tone="gold" /></div><label className="mt-4 block text-xs text-slate-500">النقدية الفعلية بعد العد</label><input type="number" value={actualCash} onChange={(event) => setActualCash(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-100 px-3 text-sm outline-none" /><button type="button" onClick={() => { setShiftOpen(false); setModal(null); notify("تم إغلاق الوردية وحفظ تقرير الصندوق."); }} className="mt-4 w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold">تأكيد إغلاق الوردية</button></Modal>}
      {modal === "askAi" && <Modal title="اسأل NOBO AI" onClose={() => setModal(null)}><textarea className="h-28 w-full rounded-xl border border-white/10 bg-slate-100 p-3 text-xs outline-none" placeholder="مثال: اقترح عرضًا على المشروبات الراكدة..." /><button type="button" onClick={() => { setModal(null); notify("تم إرسال سؤالك إلى NOBO AI."); }} className="mt-3 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold">إرسال السؤال</button></Modal>}
      {modal === "aiConfirm" && <Modal title="تأكيد الإجراء المقترح" onClose={() => setModal(null)}><div className="rounded-xl border border-pink-400/20 bg-pink-500/10 p-3 text-xs leading-5 text-pink-50"><ShieldCheck size={17} className="mb-2 text-pink-300" />NOBO AI لا ينفذ أي عملية حساسة تلقائيًا. راجع الإجراء ثم أكّده ليتم فتح الشاشة المناسبة.</div><button type="button" onClick={() => { setModal(null); notify("تم تأكيد الاقتراح وفتح الإجراء المرتبط."); }} className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold">تأكيد ومتابعة</button></Modal>}
      {modal === "success" && <Modal title="اكتملت عملية البيع" onClose={resetSale}><div className="py-4 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300"><Check size={32} /></div><h3 className="mt-3 font-bold">تم إنشاء الفاتورة بنجاح</h3><p className="mt-1 text-xs text-slate-400">INV-000486 · تم إرسال العملية إلى ZATCA والطابعة.</p></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => notify("تم إرسال الإيصال للطباعة.")} className="rounded-xl border border-white/10 py-2.5 text-xs">طباعة الإيصال</button><button type="button" onClick={resetSale} className="rounded-xl bg-blue-600 py-2.5 text-xs font-bold">فاتورة جديدة</button></div></Modal>}
      </main>
    </AppLayout>
  );
}
