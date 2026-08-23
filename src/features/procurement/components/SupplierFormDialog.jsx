import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import { ProcurementModal } from "./ProcurementModal";
import { useCreateSupplier, useUpdateSupplier } from "../hooks/useSuppliers";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

export function SupplierFormDialog({ companyId, supplier, onClose, onSuccess }) {
  const { t } = useI18n();
  const isEdit = Boolean(supplier);

  const [code, setCode] = useState(supplier?.code || "");
  const [name, setName] = useState(supplier?.name || "");
  const [contactPerson, setContactPerson] = useState(supplier?.contactPerson || "");
  const [phone, setPhone] = useState(supplier?.phone || "");
  const [email, setEmail] = useState(supplier?.email || "");
  const [taxNumber, setTaxNumber] = useState(supplier?.taxNumber || "");
  const [address, setAddress] = useState(supplier?.address || "");
  const [note, setNote] = useState(supplier?.note || "");
  const [formError, setFormError] = useState("");

  const createMutation = useCreateSupplier(companyId);
  const updateMutation = useUpdateSupplier(companyId, supplier?.supplierId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!code.trim()) {
      setFormError(t("procurement.supplier.form.codeRequired"));
      return;
    }
    if (!name.trim()) {
      setFormError(t("procurement.supplier.form.nameRequired"));
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError(t("procurement.supplier.form.emailInvalid"));
      return;
    }

    const payload = {
      code: code.trim(),
      name: name.trim(),
      contactPerson: contactPerson.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      taxNumber: taxNumber.trim() || null,
      address: address.trim() || null,
      note: note.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success(t("procurement.toast.supplierUpdated"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("procurement.toast.supplierCreated"));
      }
      onSuccess();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <ProcurementModal
      title={isEdit ? t("procurement.supplier.edit") : t("procurement.supplier.new")}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3">
        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("procurement.supplier.code")}
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={50}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("procurement.supplier.name")}
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("procurement.supplier.contactPerson")}
            <input
              type="text"
              value={contactPerson}
              onChange={(event) => setContactPerson(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("procurement.supplier.phone")}
            <input
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("procurement.supplier.email")}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("procurement.supplier.taxNumber")}
            <input
              type="text"
              value={taxNumber}
              onChange={(event) => setTaxNumber(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
        </div>

        <label className="block text-xs font-semibold text-slate-400">
          {t("procurement.supplier.address")}
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            maxLength={500}
            className="mt-1 h-16 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          {t("procurement.supplier.note")}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            className="mt-1 h-16 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? t("procurement.actions.saving")
            : isEdit
              ? t("procurement.actions.saveChanges")
              : t("procurement.supplier.new")}
        </button>
      </form>
    </ProcurementModal>
  );
}
