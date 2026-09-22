import { useEffect, useState } from "react";
import { Clock, Phone, Plus, UserRound } from "lucide-react";
import { PosModal } from "./PosModal";
import { useCreateCustomer, useCustomers } from "../../customers/hooks/useCustomers";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

// Real backend-wired customer search/select/create (POS Customer Data task) -- no hardcoded
// names, no local-only fake records, no simulated responses. Customers.View gates search/select;
// Customers.Manage additionally gates create. Backend remains authoritative for both.
function CustomerPickerDialog({ onClose, currentCompanyId, canViewCustomers, canManageCustomers, onSelectCustomer }) {
  const [view, setView] = useState("search");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectError, setSelectError] = useState("");
  const [selectingId, setSelectingId] = useState(null);

  // Same 350ms debounce pattern already used elsewhere in this app (Sales/Platform lists) --
  // server-side search, never a full customer list filtered client-side.
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const customersQuery = useCustomers(
    currentCompanyId,
    { search, pageSize: 20 },
    view === "search" && canViewCustomers,
  );
  const customers = customersQuery.data?.items || [];

  const selectCustomer = async (customer) => {
    setSelectError("");
    setSelectingId(customer.customerId);
    try {
      await onSelectCustomer(customer);
      onClose();
    } catch (error) {
      setSelectError(getErrorMessage(error));
    } finally {
      setSelectingId(null);
    }
  };

  if (view === "create") {
    return (
      <CreateCustomerForm
        onCancel={() => setView("search")}
        currentCompanyId={currentCompanyId}
        onSelectCustomer={onSelectCustomer}
        onDone={onClose}
      />
    );
  }

  return (
    <>
      {!canViewCustomers && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">
          Customers.View permission is required.
        </div>
      )}

      {canViewCustomers && (
        <>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ابحث بالاسم أو الهاتف أو البريد..."
            className="mb-2 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400"
            autoFocus
          />

          {customersQuery.isLoading && (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
              جارٍ البحث...
            </p>
          )}

          {customersQuery.isError && (
            <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-100">
              {getErrorMessage(customersQuery.error)}
            </p>
          )}

          {!customersQuery.isLoading && !customersQuery.isError && customers.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
              No customers found.
            </p>
          )}

          {!customersQuery.isLoading && !customersQuery.isError && customers.length > 0 && (
            <div className="space-y-1.5">
              {customers.map((customer) => (
                <button
                  key={customer.customerId}
                  type="button"
                  disabled={selectingId === customer.customerId}
                  onClick={() => selectCustomer(customer)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 p-3 text-start hover:border-blue-400/50 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-xs font-bold">
                      <UserRound size={15} className="shrink-0 text-blue-300" />
                      {customer.name}
                    </span>
                    {customer.phone && (
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                        <Phone size={10} />
                        {customer.phone}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-500">{customer.customerNumberFormatted}</span>
                </button>
              ))}
            </div>
          )}

          {selectError && (
            <p className="mt-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-100">
              {selectError}
            </p>
          )}
        </>
      )}

      {canManageCustomers && (
        <button
          type="button"
          onClick={() => setView("create")}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold"
        >
          <Plus size={15} />
          إنشاء عميل جديد
        </button>
      )}
    </>
  );
}

// Minimal capture form for a fast POS flow -- Name/Phone/Email only (the fields actually useful
// at the register). TaxNumber/Address/Note are real backend fields too but belong to a fuller
// customer-profile edit, not this quick-create step (Phase 6/8: no invented fields, no scope-
// creep into a full CRM form).
function CreateCustomerForm({ onCancel, currentCompanyId, onSelectCustomer, onDone }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [createdCustomer, setCreatedCustomer] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const createCustomer = useCreateCustomer(currentCompanyId);

  const assign = async (customer) => {
    setAssigning(true);
    setError("");
    try {
      await onSelectCustomer(customer);
      onDone();
    } catch (assignError) {
      // The customer now genuinely exists in the backend -- never pretend the assignment also
      // succeeded. Keep it available so the cashier can retry attaching it to this order.
      setCreatedCustomer(customer);
      setError(getErrorMessage(assignError));
    } finally {
      setAssigning(false);
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    try {
      const customer = await createCustomer.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        taxNumber: null,
        address: null,
        note: null,
      });
      await assign(customer);
    } catch (createError) {
      setError(getErrorMessage(createError));
    }
  };

  return (
    <div className="space-y-3">
      {createdCustomer ? (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
          تم إنشاء العميل {createdCustomer.name} ({createdCustomer.customerNumberFormatted}) بنجاح، لكن تعذّر ربطه
          بالطلب الحالي.
        </div>
      ) : (
        <>
          <label className="block text-[11px] font-bold text-slate-400">
            الاسم *
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={createCustomer.isPending || assigning}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400 disabled:opacity-50"
            />
          </label>
          <label className="block text-[11px] font-bold text-slate-400">
            الهاتف
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={createCustomer.isPending || assigning}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400 disabled:opacity-50"
            />
          </label>
          <label className="block text-[11px] font-bold text-slate-400">
            البريد الإلكتروني
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={createCustomer.isPending || assigning}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400 disabled:opacity-50"
            />
          </label>
        </>
      )}

      {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-100">{error}</div>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={createCustomer.isPending || assigning}
          className="h-10 flex-1 rounded-xl border border-white/10 text-xs font-bold text-slate-300 disabled:opacity-50"
        >
          إلغاء
        </button>
        {createdCustomer ? (
          <button
            type="button"
            onClick={() => assign(createdCustomer)}
            disabled={assigning}
            className="h-10 flex-1 rounded-xl bg-blue-600 text-xs font-bold disabled:opacity-50"
          >
            {assigning ? "جارٍ إعادة المحاولة..." : "إعادة المحاولة"}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={createCustomer.isPending || assigning}
            className="h-10 flex-1 rounded-xl bg-blue-600 text-xs font-bold disabled:opacity-50"
          >
            {createCustomer.isPending || assigning ? "جارٍ الحفظ..." : "إنشاء واختيار"}
          </button>
        )}
      </div>
    </div>
  );
}

export function PosMiscDialogs({
  modal,
  setModal,
  currentCompanyId,
  canViewCustomers,
  canManageCustomers,
  onSelectCustomer,
}) {
  return (
    <>
      {modal === "customer" && (
        <PosModal title="اختيار عميل" onClose={() => setModal(null)} size="lg">
          <CustomerPickerDialog
            onClose={() => setModal(null)}
            currentCompanyId={currentCompanyId}
            canViewCustomers={canViewCustomers}
            canManageCustomers={canManageCustomers}
            onSelectCustomer={onSelectCustomer}
          />
        </PosModal>
      )}

      {modal === "promotions" && (
        <PosModal title="العروض والخصومات" onClose={() => setModal(null)}>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
            <Clock size={22} className="text-slate-500" />
            <p className="text-xs font-bold text-slate-300">ميزة العروض التلقائية قادمة قريبًا</p>
            <p className="text-[11px] text-slate-500">
              يمكنك تطبيق خصم يدوي على الفاتورة الحالية من زر "خصم وعروض" في السلة.
            </p>
          </div>
        </PosModal>
      )}
    </>
  );
}
