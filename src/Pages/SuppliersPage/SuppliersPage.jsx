import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, Mail, Phone, Plus, Truck, UserRound, X } from "lucide-react";
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
import { ControlPanel } from "../../shared/components/odoo/ControlPanel";
import { ListView } from "../../shared/components/odoo/ListView";
import { ROUTES } from "../../utils/routes";

const PURCHASES_VIEW_PERMISSION = "Purchases.View";
const PURCHASES_MANAGE_PERMISSION = "Purchases.Manage";
// Odoo's default page size for list views.
const PAGE_SIZE = 80;
const STATUS_OPTIONS = ["Active", "Suspended"];

// Odoo form-view field: bold label + value, one per row.
function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-[minmax(6rem,40%)_1fr] items-baseline gap-3 border-b border-line py-1.5 last:border-0">
      <dt className="text-sm font-bold text-ink">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-ink">{children || <span className="text-subtle">—</span>}</dd>
    </div>
  );
}

// Suppliers, Odoo style (same building blocks as Sales / Purchases): control panel -- search,
// Filters by status, Group By status, list <-> kanban, pager -- over a list or kanban view, and the
// selected supplier in a side sheet with its actions (edit / suspend / activate / its purchase
// orders). Same queries, mutations and dialogs as before -- presentation only.
export default function SuppliersPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();

  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [groupBy, setGroupBy] = useState("");
  const [view, setView] = useState("list");
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
  const page = suppliersQuery.data;
  const suppliers = useMemo(() => page?.items ?? [], [page]);

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

  const statusLabel = (value) => t(`procurement.supplier.status.${value.toLowerCase()}`);
  const facets = [
    status && {
      id: "status",
      label: statusLabel(status),
      onRemove: () => {
        setStatus("");
        setPageNumber(1);
      },
    },
    groupBy && { id: "group", label: `${t("odoo.groupBy")}: ${t("procurement.list.groupBy.status")}`, onRemove: () => setGroupBy("") },
  ].filter(Boolean);

  const columns = [
    { key: "code", header: t("procurement.supplier.code"), render: (supplier) => <span className="text-muted">{supplier.code}</span> },
    { key: "name", header: t("procurement.supplier.name"), render: (supplier) => <span className="font-bold">{supplier.name}</span> },
    { key: "contact", header: t("procurement.supplier.contactPerson"), render: (supplier) => supplier.contactPerson || "—" },
    { key: "phone", header: t("procurement.supplier.phone"), render: (supplier) => <span className="pos-num">{supplier.phone || "—"}</span> },
    { key: "email", header: t("procurement.supplier.email"), render: (supplier) => supplier.email || "—" },
    { key: "status", header: t("procurement.filters.status"), render: (supplier) => <SupplierStatusBadge status={supplier.status} /> },
  ];

  const groups = useMemo(() => {
    if (!groupBy) return null;
    return STATUS_OPTIONS.map((value) => ({
      key: value,
      label: t(`procurement.supplier.status.${value.toLowerCase()}`),
      rows: suppliers.filter((supplier) => supplier.status === value),
    })).filter((group) => group.rows.length > 0);
  }, [groupBy, suppliers, t]);

  const total = page?.totalCount ?? 0;
  const start = total ? (pageNumber - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(pageNumber * PAGE_SIZE, total);

  return (
    <AppLayout activePath={ROUTES.SUPPLIERS}>
      <main className="odoo-root space-y-3" dir="rtl">
        {/* Odoo-style app bar: module name. */}
        <header className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-[var(--shadow-surface)]">
          <div className="flex items-center gap-2 text-lg font-bold text-ink">
            <Truck size={18} className="text-accent" />
            {t("nav.purchases")}
          </div>
        </header>

        {!currentCompanyId ? (
          <EmptyState title={t("procurement.companyRequired.title")} message={t("procurement.companyRequired.message")} />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("procurement.loading")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState title={t("procurement.permissionRequired.title")} message={t("procurement.permissionRequired.message")} />
        ) : (
          <>
            <ControlPanel
              breadcrumbs={[t("nav.purchases"), t("procurement.supplier.title")]}
              actions={
                canManage && (
                  <button
                    type="button"
                    onClick={() => setDialog({ type: "create" })}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-bold text-white transition hover:bg-accent-strong"
                  >
                    <Plus size={14} />
                    {t("procurement.supplier.new")}
                  </button>
                )
              }
              search={{ value: searchInput, onChange: setSearchInput, placeholder: t("procurement.supplier.search") }}
              facets={facets}
              filters={STATUS_OPTIONS.map((value) => ({
                id: value,
                label: statusLabel(value),
                active: status === value,
                onToggle: () => {
                  setStatus((current) => (current === value ? "" : value));
                  setPageNumber(1);
                },
              }))}
              groupBy={[
                {
                  id: "status",
                  label: t("procurement.list.groupBy.status"),
                  active: groupBy === "status",
                  onSelect: () => setGroupBy((current) => (current ? "" : "status")),
                },
              ]}
              views={{
                current: view,
                onChange: setView,
                options: [
                  { id: "list", label: t("odoo.view.list"), icon: List },
                  { id: "kanban", label: t("odoo.view.kanban"), icon: LayoutGrid },
                ],
              }}
              pager={{
                start,
                end,
                total,
                onPrev: pageNumber > 1 ? () => setPageNumber((current) => current - 1) : undefined,
                onNext: page && pageNumber < page.totalPages ? () => setPageNumber((current) => current + 1) : undefined,
              }}
            />

            <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
              <div className="min-w-0 flex-1">
                {suppliersQuery.isLoading && <LoadingState label={t("procurement.loading")} />}
                {suppliersQuery.isError && (
                  <ErrorState
                    title={t("procurement.error.title")}
                    message={suppliersQuery.error?.message || t("procurement.error.message")}
                  />
                )}

                {!suppliersQuery.isLoading && !suppliersQuery.isError && view === "list" && (
                  <ListView
                    columns={columns}
                    rows={groups ? undefined : suppliers}
                    groups={groups ?? undefined}
                    getRowKey={(supplier) => supplier.supplierId}
                    onRowClick={(supplier) => setSelectedSupplierId(supplier.supplierId)}
                    emptyLabel={t("procurement.supplier.empty.message")}
                  />
                )}

                {!suppliersQuery.isLoading && !suppliersQuery.isError && view === "kanban" && (
                  suppliers.length === 0 ? (
                    <EmptyState title={t("procurement.supplier.empty.title")} message={t("procurement.supplier.empty.message")} />
                  ) : (
                    <div className="space-y-4">
                      {(groups ?? [{ key: "all", label: null, rows: suppliers }]).map((group) => (
                        <div key={group.key}>
                          {group.label && (
                            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                              {group.label} <span className="pos-num font-normal text-subtle">({group.rows.length})</span>
                            </div>
                          )}
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2">
                            {group.rows.map((supplier) => (
                              <button
                                key={supplier.supplierId}
                                type="button"
                                onClick={() => setSelectedSupplierId(supplier.supplierId)}
                                className={`flex items-start gap-3 rounded-xl border bg-surface p-3 text-start shadow-[var(--shadow-surface)] transition hover:border-accent-line hover:bg-hover ${
                                  selectedSupplierId === supplier.supplierId ? "border-accent-line" : "border-line"
                                }`}
                              >
                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-inset text-base font-bold text-muted">
                                  {(supplier.name || "?").trim().charAt(0).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-start justify-between gap-2">
                                    <span className="truncate font-bold text-ink">{supplier.name}</span>
                                    <SupplierStatusBadge status={supplier.status} />
                                  </span>
                                  <span className="block truncate text-xs text-muted">{supplier.code}</span>
                                  {supplier.contactPerson && (
                                    <span className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                                      <UserRound size={12} className="shrink-0" /> {supplier.contactPerson}
                                    </span>
                                  )}
                                  {supplier.phone && (
                                    <span className="flex items-center gap-1 truncate text-xs text-muted">
                                      <Phone size={12} className="shrink-0" /> <span className="pos-num">{supplier.phone}</span>
                                    </span>
                                  )}
                                  {supplier.email && (
                                    <span className="flex items-center gap-1 truncate text-xs text-muted">
                                      <Mail size={12} className="shrink-0" /> {supplier.email}
                                    </span>
                                  )}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {selectedSupplier && (
                <aside className="w-full shrink-0 space-y-3 rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-surface)] xl:w-[380px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-muted">{selectedSupplier.code}</div>
                      <h2 className="truncate text-xl font-bold text-ink">{selectedSupplier.name}</h2>
                      <div className="mt-1">
                        <SupplierStatusBadge status={selectedSupplier.status} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSupplierId(null)}
                      aria-label={t("procurement.actions.back")}
                      className="rounded-md p-1 text-muted hover:bg-hover hover:text-ink"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <dl>
                    <FieldRow label={t("procurement.supplier.contactPerson")}>{selectedSupplier.contactPerson}</FieldRow>
                    <FieldRow label={t("procurement.supplier.phone")}>
                      {selectedSupplier.phone && <span className="pos-num">{selectedSupplier.phone}</span>}
                    </FieldRow>
                    <FieldRow label={t("procurement.supplier.email")}>{selectedSupplier.email}</FieldRow>
                    <FieldRow label={t("procurement.supplier.taxNumber")}>{selectedSupplier.taxNumber}</FieldRow>
                    <FieldRow label={t("procurement.supplier.address")}>{selectedSupplier.address}</FieldRow>
                    <FieldRow label={t("procurement.supplier.note")}>{selectedSupplier.note}</FieldRow>
                  </dl>

                  <a
                    href={`${ROUTES.PURCHASES}?supplierId=${selectedSupplier.supplierId}`}
                    className="odoo-link block rounded-lg border border-line px-3 py-2 text-center text-sm font-bold hover:bg-hover"
                  >
                    {t("procurement.supplier.viewPurchaseOrders")}
                  </a>

                  {canManage && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDialog({ type: "edit", supplier: selectedSupplier })}
                        className="flex h-10 flex-1 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white hover:bg-accent-strong"
                      >
                        {t("procurement.actions.editSupplier")}
                      </button>
                      {selectedSupplier.status === "Active" ? (
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: "suspend", supplier: selectedSupplier })}
                          className="flex h-10 flex-1 items-center justify-center rounded-lg border border-danger bg-danger-soft text-sm font-bold text-danger hover:brightness-110"
                        >
                          {t("procurement.actions.suspend")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: "activate", supplier: selectedSupplier })}
                          className="flex h-10 flex-1 items-center justify-center rounded-lg border border-success bg-success-soft text-sm font-bold text-success hover:brightness-110"
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

        {/* Dialogs live inside <main> so they take the page's Odoo theme (`.odoo-root`); they're
            fixed overlays, so their position in the tree doesn't affect layout. */}
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
            title={confirmAction.type === "activate" ? t("procurement.actions.activate") : t("procurement.actions.suspend")}
            message={
              confirmAction.type === "activate"
                ? t("procurement.confirm.activateSupplier", { name: confirmAction.supplier.name })
                : t("procurement.confirm.suspendSupplier", { name: confirmAction.supplier.name })
            }
            confirmLabel={confirmAction.type === "activate" ? t("procurement.actions.activate") : t("procurement.actions.suspend")}
            tone={confirmAction.type === "suspend" ? "danger" : "default"}
            isPending={activateMutation.isPending || suspendMutation.isPending}
            onConfirm={runConfirm}
            onClose={() => setConfirmAction(null)}
          />
        )}
      </main>
    </AppLayout>
  );
}
