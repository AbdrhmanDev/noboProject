import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Truck, X } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useActivateSupplier, useSuppliers, useSuspendSupplier } from "../../features/procurement/hooks/useSuppliers";
import { SupplierStatusBadge } from "../../features/procurement/components/SupplierStatusBadge";
import { SupplierFormDialog } from "../../features/procurement/components/SupplierFormDialog";
import { ConfirmActionDialog } from "../../features/procurement/components/ConfirmActionDialog";
import { ROUTES } from "../../utils/routes";

const PURCHASES_VIEW_PERMISSION = "Purchases.View";
const PURCHASES_MANAGE_PERMISSION = "Purchases.Manage";
const PAGE_SIZE = 25;
const STATUS_OPTIONS = ["Active", "Suspended"];

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-slate-100">{value ?? "—"}</div>
    </div>
  );
}

export default function SuppliersPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();

  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [dialog, setDialog] = useState(null); // { type: "create" | "edit", supplier? }
  const [confirmAction, setConfirmAction] = useState(null); // { type: "activate"|"suspend", supplier }
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  const viewPermissionQuery = useHasPermission(currentCompanyId, PURCHASES_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, PURCHASES_MANAGE_PERMISSION);
  const canQuery = Boolean(currentCompanyId) && !viewPermissionQuery.isLoading && viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;

  // Debounced server-side search — never filters an already-fetched page.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageNumber(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filters = useMemo(() => ({ pageNumber, pageSize: PAGE_SIZE, status, search }), [pageNumber, status, search]);
  const suppliersQuery = useSuppliers(currentCompanyId, filters, canQuery);
  const suppliers = suppliersQuery.data?.items || [];

  const activateMutation = useActivateSupplier(currentCompanyId);
  const suspendMutation = useSuspendSupplier(currentCompanyId);

  const selectedSupplier = suppliers.find((supplier) => supplier.supplierId === selectedSupplierId) || null;

  const runConfirm = async () => {
    if (!confirmAction) return;
    const { type, supplier } = confirmAction;
    try {
      if (type === "activate") {
        await activateMutation.mutateAsync(supplier.supplierId);
        toast.success(t("procurement.toast.supplierActivated", { name: supplier.name }));
      } else {
        await suspendMutation.mutateAsync(supplier.supplierId);
        toast.success(t("procurement.toast.supplierSuspended", { name: supplier.name }));
      }
      setConfirmAction(null);
    } catch (error) {
      toast.error(error?.message || t("procurement.error.message"));
    }
  };

  return (
    <AppLayout activePath={ROUTES.SUPPLIERS}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Truck size={16} className="text-blue-300" />
                {t("nav.purchases")}
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">{t("procurement.supplier.title")}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">{t("procurement.supplier.subtitle")}</p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setDialog({ type: "create" })}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
              >
                <Plus size={14} />
                {t("procurement.supplier.new")}
              </button>
            )}
          </div>
        </header>

        {!currentCompanyId ? (
          <EmptyState
            title={t("procurement.companyRequired.title")}
            message={t("procurement.companyRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("procurement.loading")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title={t("procurement.permissionRequired.title")}
            message={t("procurement.permissionRequired.message")}
          />
        ) : (
          <>
            <section className="grid gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3 md:grid-cols-4">
              <label className="text-[11px] font-semibold text-slate-400 md:col-span-2">
                {t("procurement.supplier.search")}
                <div className="mt-1 flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
                  <Search size={13} className="shrink-0 text-slate-500" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={t("procurement.supplier.search")}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("procurement.filters.status")}
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPageNumber(1);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("procurement.filters.statusAll")}</option>
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`procurement.supplier.status.${value.toLowerCase()}`)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setStatus("");
                  setSearchInput("");
                  setSearch("");
                  setPageNumber(1);
                }}
                className="mt-auto h-10 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-bold text-slate-200"
              >
                {t("procurement.filters.reset")}
              </button>
            </section>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
              <section className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-black text-white">{t("procurement.supplier.title")}</div>
                  <div className="text-[11px] text-slate-500">
                    {t("procurement.totalCount", { count: suppliersQuery.data?.totalCount ?? 0 })}
                  </div>
                </div>

                {suppliersQuery.isLoading && <LoadingState label={t("procurement.loading")} />}
                {suppliersQuery.isError && (
                  <>
                    <ErrorState
                      title={t("procurement.error.title")}
                      message={suppliersQuery.error?.message || t("procurement.error.message")}
                    />
                    <button
                      type="button"
                      onClick={() => suppliersQuery.refetch()}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
                    >
                      {t("procurement.retry")}
                    </button>
                  </>
                )}
                {!suppliersQuery.isLoading && !suppliersQuery.isError && suppliers.length === 0 && (
                  <EmptyState
                    title={t("procurement.supplier.empty.title")}
                    message={t("procurement.supplier.empty.message")}
                  />
                )}

                {!suppliersQuery.isLoading && !suppliersQuery.isError && suppliers.length > 0 && (
                  <>
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-start text-slate-500">
                            <th className="pb-2 text-start font-medium">{t("procurement.supplier.code")}</th>
                            <th className="pb-2 text-start font-medium">{t("procurement.supplier.name")}</th>
                            <th className="pb-2 text-start font-medium">{t("procurement.supplier.contactPerson")}</th>
                            <th className="pb-2 text-start font-medium">{t("procurement.supplier.phone")}</th>
                            <th className="pb-2 text-start font-medium">{t("procurement.supplier.email")}</th>
                            <th className="pb-2 text-start font-medium">{t("procurement.filters.status")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {suppliers.map((supplier) => (
                            <tr
                              key={supplier.supplierId}
                              onClick={() => setSelectedSupplierId(supplier.supplierId)}
                              className={`cursor-pointer border-t border-white/5 hover:bg-white/[0.03] ${
                                selectedSupplierId === supplier.supplierId ? "bg-blue-500/[0.06]" : ""
                              }`}
                            >
                              <td className="py-2.5 font-bold text-white">{supplier.code}</td>
                              <td className="py-2.5 text-slate-200">{supplier.name}</td>
                              <td className="py-2.5 text-slate-300">{supplier.contactPerson || "—"}</td>
                              <td className="py-2.5 text-slate-300">{supplier.phone || "—"}</td>
                              <td className="py-2.5 text-slate-300">{supplier.email || "—"}</td>
                              <td className="py-2.5">
                                <SupplierStatusBadge status={supplier.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-2 lg:hidden">
                      {suppliers.map((supplier) => (
                        <button
                          key={supplier.supplierId}
                          type="button"
                          onClick={() => setSelectedSupplierId(supplier.supplierId)}
                          className="flex w-full flex-col gap-1.5 rounded-xl border border-white/10 bg-[#0d1728] p-3 text-start transition hover:border-blue-400/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-black text-white">{supplier.name}</span>
                            <SupplierStatusBadge status={supplier.status} />
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {supplier.code} · {supplier.contactPerson || "—"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {suppliersQuery.data && suppliersQuery.data.totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                      className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("procurement.pagination.previous")}
                    </button>
                    <span className="text-xs text-slate-400">
                      {t("procurement.pagination.page", {
                        current: suppliersQuery.data.pageNumber,
                        total: suppliersQuery.data.totalPages,
                      })}
                    </span>
                    <button
                      type="button"
                      disabled={pageNumber >= suppliersQuery.data.totalPages}
                      onClick={() => setPageNumber((page) => page + 1)}
                      className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("procurement.pagination.next")}
                    </button>
                  </div>
                )}
              </section>

              {selectedSupplier && (
                <aside className="w-full shrink-0 rounded-2xl border border-white/10 bg-[#0c1424] p-4 xl:w-[360px]">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-slate-500">{selectedSupplier.code}</div>
                      <h2 className="text-lg font-black text-white">{selectedSupplier.name}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSupplierId(null)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <SupplierStatusBadge status={selectedSupplier.status} />

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Field label={t("procurement.supplier.contactPerson")} value={selectedSupplier.contactPerson} />
                    <Field label={t("procurement.supplier.phone")} value={selectedSupplier.phone} />
                    <Field label={t("procurement.supplier.email")} value={selectedSupplier.email} />
                    <Field label={t("procurement.supplier.taxNumber")} value={selectedSupplier.taxNumber} />
                  </div>
                  {selectedSupplier.address && (
                    <div className="mt-2">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {t("procurement.supplier.address")}
                      </div>
                      <p className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5 text-xs leading-5 text-slate-300">
                        {selectedSupplier.address}
                      </p>
                    </div>
                  )}
                  {selectedSupplier.note && (
                    <div className="mt-2">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {t("procurement.supplier.note")}
                      </div>
                      <p className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5 text-xs leading-5 text-slate-300">
                        {selectedSupplier.note}
                      </p>
                    </div>
                  )}

                  <a
                    href={`${ROUTES.PURCHASES}?supplierId=${selectedSupplier.supplierId}`}
                    className="mt-3 block rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-center text-xs font-bold text-blue-200 hover:bg-blue-500/20"
                  >
                    {t("procurement.supplier.viewPurchaseOrders")}
                  </a>

                  {canManage && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDialog({ type: "edit", supplier: selectedSupplier })}
                        className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-xs font-bold text-slate-100 hover:bg-white/10"
                      >
                        {t("procurement.actions.editSupplier")}
                      </button>
                      {selectedSupplier.status === "Active" ? (
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: "suspend", supplier: selectedSupplier })}
                          className="flex h-10 flex-1 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-xs font-bold text-rose-200 hover:bg-rose-500/20"
                        >
                          {t("procurement.actions.suspend")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: "activate", supplier: selectedSupplier })}
                          className="flex h-10 flex-1 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20"
                        >
                          {t("procurement.actions.activate")}
                        </button>
                      )}
                    </div>
                  )}
                </aside>
              )}
            </div>
          </>
        )}
      </main>

      {dialog && (
        <SupplierFormDialog
          companyId={currentCompanyId}
          supplier={dialog.type === "edit" ? dialog.supplier : null}
          onClose={() => setDialog(null)}
          onSuccess={() => setDialog(null)}
        />
      )}

      {confirmAction && (
        <ConfirmActionDialog
          title={
            confirmAction.type === "activate"
              ? t("procurement.actions.activate")
              : t("procurement.actions.suspend")
          }
          message={
            confirmAction.type === "activate"
              ? t("procurement.confirm.activateSupplier", { name: confirmAction.supplier.name })
              : t("procurement.confirm.suspendSupplier", { name: confirmAction.supplier.name })
          }
          confirmLabel={
            confirmAction.type === "activate"
              ? t("procurement.actions.activate")
              : t("procurement.actions.suspend")
          }
          tone={confirmAction.type === "suspend" ? "danger" : "default"}
          isPending={activateMutation.isPending || suspendMutation.isPending}
          onConfirm={runConfirm}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </AppLayout>
  );
}
