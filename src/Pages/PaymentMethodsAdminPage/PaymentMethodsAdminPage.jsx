import { useMemo, useState } from "react";
import {
  Banknote,
  CircleCheck,
  CirclePause,
  CreditCard,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/formatters";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  useChangePaymentMethodStatus,
  useCreatePaymentMethod,
  usePaymentMethodDetails,
  usePaymentMethods,
  useUpdatePaymentMethod,
} from "../../features/payments/hooks/usePayments";

const PAYMENTS_CONFIGURE_PERMISSION = "Payments.Configure";
const PAYMENT_METHOD_KINDS = ["Cash", "Card", "BankTransfer", "Other"];
const EMPTY_METHOD_FORM = {
  code: "",
  name: "",
  kind: "Cash",
  sortOrder: "0",
};

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function parseSortOrder(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function PaymentKindIcon({ kind }) {
  if (kind === "Cash") {
    return <Banknote size={16} className="shrink-0 text-blue-300" />;
  }

  if (kind === "Card") {
    return <CreditCard size={16} className="shrink-0 text-blue-300" />;
  }

  return <WalletCards size={16} className="shrink-0 text-blue-300" />;
}

function PaymentMethodCard({ method, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10 ${
        selected ? "border-blue-400/60 bg-blue-500/15" : "border-white/10 bg-[#0d1728]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PaymentKindIcon kind={method.kind} />
            <div className="truncate text-sm font-black text-white">{method.name}</div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{method.code}</span>
            <span>{method.kind}</span>
          </div>
        </div>
        <StatusBadge tone={statusTone(method.status)}>{method.status}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Sort</div>
          <div className="mt-1 font-semibold text-slate-200">{method.sortOrder}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Created</div>
          <div className="mt-1 font-semibold text-slate-200">
            {formatDateTime(method.createdAtUtc)}
          </div>
        </div>
      </div>
    </button>
  );
}

function MethodForm({
  mode,
  form,
  setForm,
  selectedMethod,
  canManage,
  isPending,
  onSubmit,
  onStatusChange,
}) {
  const nextStatus = selectedMethod?.status === "Active" ? "Suspended" : "Active";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_170px_140px]">
        <label className="text-xs font-semibold text-slate-400">
          Code
          <input
            value={form.code}
            onChange={(event) => setForm((draft) => ({ ...draft, code: event.target.value }))}
            maxLength={50}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Kind
          {mode === "create" ? (
            <select
              value={form.kind}
              onChange={(event) => setForm((draft) => ({ ...draft, kind: event.target.value }))}
              disabled={!canManage || isPending}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            >
              {PAYMENT_METHOD_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-slate-200">
              {selectedMethod?.kind || form.kind}
            </div>
          )}
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Sort Order
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, sortOrder: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
          />
        </label>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
        Kind is selected on create and is read-only after creation.
      </div>
      {!canManage && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Payments.Configure permission is required for payment method changes.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending ? "Saving..." : mode === "edit" ? "Save method" : "Create method"}
        </button>
        {mode === "edit" && selectedMethod && (
          <button
            type="button"
            disabled={!canManage || isPending}
            onClick={() => onStatusChange(nextStatus)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 transition hover:border-blue-400/40 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? "Activate" : "Suspend"}
          </button>
        )}
      </div>
    </form>
  );
}

export default function PaymentMethodsAdminPage() {
  const { currentCompanyId } = useCompany();
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState(EMPTY_METHOD_FORM);
  const [notice, setNotice] = useState("");

  const configurePermissionQuery = useHasPermission(
    currentCompanyId,
    PAYMENTS_CONFIGURE_PERMISSION,
  );
  const canConfigure =
    Boolean(currentCompanyId) &&
    !configurePermissionQuery.isLoading &&
    configurePermissionQuery.hasPermission;
  const filters = useMemo(
    () => ({ status, kind, search: search.trim() }),
    [kind, search, status],
  );
  const methodsQuery = usePaymentMethods(currentCompanyId, filters, canConfigure);
  const detailsQuery = usePaymentMethodDetails(
    currentCompanyId,
    selectedMethodId,
    canConfigure && Boolean(selectedMethodId),
  );
  const createMutation = useCreatePaymentMethod(currentCompanyId);
  const updateMutation = useUpdatePaymentMethod(currentCompanyId, selectedMethodId);
  const statusMutation = useChangePaymentMethodStatus(currentCompanyId, selectedMethodId);
  const selectedMethod = detailsQuery.data || null;
  const isPending =
    createMutation.isPending || updateMutation.isPending || statusMutation.isPending;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const startCreate = () => {
    setMode("create");
    setSelectedMethodId(null);
    setForm(EMPTY_METHOD_FORM);
  };

  const selectMethod = (method) => {
    setMode("edit");
    setSelectedMethodId(method.paymentMethodId);
    setForm({
      code: method.code,
      name: method.name,
      kind: method.kind,
      sortOrder: String(method.sortOrder),
    });
  };

  const submitMethod = async () => {
    const sortOrder = parseSortOrder(form.sortOrder);
    if (sortOrder === null) {
      showNotice("Sort order must be zero or greater.");
      return;
    }

    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync({
          code: form.code,
          name: form.name,
          kind: form.kind,
          sortOrder,
        });
        setMode("edit");
        setSelectedMethodId(created.paymentMethodId);
        setForm({
          code: created.code,
          name: created.name,
          kind: created.kind,
          sortOrder: String(created.sortOrder),
        });
        showNotice("Payment method created.");
        return;
      }

      const updated = await updateMutation.mutateAsync({
        code: form.code,
        name: form.name,
        sortOrder,
      });
      setForm({
        code: updated.code,
        name: updated.name,
        kind: updated.kind,
        sortOrder: String(updated.sortOrder),
      });
      showNotice("Payment method updated.");
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const changeStatus = async (nextStatus) => {
    try {
      const updated = await statusMutation.mutateAsync({ status: nextStatus });
      setForm({
        code: updated.code,
        name: updated.name,
        kind: updated.kind,
        sortOrder: String(updated.sortOrder),
      });
      showNotice(`Payment method ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <PageHeader
          title="Payment Methods"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => methodsQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                type="button"
                onClick={startCreate}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} />
                New method
              </button>
            </div>
          }
        />

        {notice && (
          <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
            {notice}
          </div>
        )}

        {!currentCompanyId ? (
          <EmptyState
            title="Company required"
            message="Select a company to configure payment methods."
          />
        ) : configurePermissionQuery.isLoading ? (
          <LoadingState label="Checking Payments permissions..." />
        ) : !configurePermissionQuery.hasPermission ? (
          <ErrorState
            title="Permission required"
            message="Payments.Configure permission is required to manage payment methods."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_130px_150px]">
                <label className="relative block">
                  <Search
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    maxLength={100}
                    placeholder="Search code or name"
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none focus:border-blue-400/60"
                  />
                </label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
                >
                  <option value="">All status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
                >
                  <option value="">All kinds</option>
                  {PAYMENT_METHOD_KINDS.map((methodKind) => (
                    <option key={methodKind} value={methodKind}>
                      {methodKind}
                    </option>
                  ))}
                </select>
              </div>

              {methodsQuery.isLoading && <LoadingState label="Loading payment methods..." />}
              {methodsQuery.isError && (
                <ErrorState
                  title="Unable to load payment methods"
                  message={getErrorMessage(methodsQuery.error)}
                />
              )}
              {!methodsQuery.isLoading &&
                !methodsQuery.isError &&
                methodsQuery.data?.length === 0 && (
                  <EmptyState
                    title="No payment methods found"
                    message="No methods match the current filters."
                  />
                )}
              {!methodsQuery.isLoading &&
                !methodsQuery.isError &&
                Boolean(methodsQuery.data?.length) && (
                  <div className="max-h-[calc(100vh-350px)] min-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                    {methodsQuery.data.map((method) => (
                      <PaymentMethodCard
                        key={method.paymentMethodId}
                        method={method}
                        selected={selectedMethodId === method.paymentMethodId}
                        onSelect={() => selectMethod(method)}
                      />
                    ))}
                  </div>
                )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Power size={15} className="text-blue-300" />
                    {mode === "create" ? "Create method" : "Method details"}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {mode === "create" ? "New payment method" : selectedMethod?.name || "Loading method"}
                  </h2>
                </div>
                {selectedMethod && (
                  <StatusBadge tone={statusTone(selectedMethod.status)}>
                    {selectedMethod.status}
                  </StatusBadge>
                )}
              </div>

              {mode === "edit" && detailsQuery.isLoading && (
                <LoadingState label="Loading payment method details..." />
              )}
              {mode === "edit" && detailsQuery.isError && (
                <ErrorState
                  title="Unable to load method details"
                  message={getErrorMessage(detailsQuery.error)}
                />
              )}
              {(mode === "create" || selectedMethod) && (
                <div className="space-y-4">
                  {selectedMethod && (
                    <div className="grid gap-2 sm:grid-cols-4">
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Kind</div>
                        <div className="mt-1 text-sm font-black text-white">{selectedMethod.kind}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Sort Order</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {selectedMethod.sortOrder}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Operational</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {selectedMethod.isActive ? "Available" : "Suspended"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                        <div className="text-[11px] text-slate-500">Created</div>
                        <div className="mt-1 text-sm font-black text-white">
                          {formatDateTime(selectedMethod.createdAtUtc)}
                        </div>
                      </div>
                    </div>
                  )}

                  <MethodForm
                    mode={mode}
                    form={form}
                    setForm={setForm}
                    selectedMethod={selectedMethod}
                    canManage={canConfigure}
                    isPending={isPending}
                    onSubmit={submitMethod}
                    onStatusChange={changeStatus}
                  />
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
