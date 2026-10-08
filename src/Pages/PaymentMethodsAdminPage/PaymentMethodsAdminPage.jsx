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
import { useI18n } from "../../i18n/I18nContext";
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

function getErrorMessage(error, t) {
  return error?.message || t("paymentMethodsAdmin.common.requestFailed");
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function statusLabel(status, t) {
  return status === "Active" ? t("paymentMethodsAdmin.common.active") : t("paymentMethodsAdmin.common.suspended");
}

const KIND_LABEL_KEYS = {
  Cash: "paymentMethodsAdmin.kind.cash",
  Card: "paymentMethodsAdmin.kind.card",
  BankTransfer: "paymentMethodsAdmin.kind.bankTransfer",
  Other: "paymentMethodsAdmin.kind.other",
};

function kindLabel(kind, t) {
  const key = KIND_LABEL_KEYS[kind];
  return key ? t(key) : kind;
}

function parseSortOrder(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function PaymentKindIcon({ kind }) {
  if (kind === "Cash") {
    return <Banknote size={16} className="shrink-0 text-accent" />;
  }

  if (kind === "Card") {
    return <CreditCard size={16} className="shrink-0 text-accent" />;
  }

  return <WalletCards size={16} className="shrink-0 text-accent" />;
}

function PaymentMethodCard({ method, selected, onSelect }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-start transition hover:border-accent-line hover:bg-accent-soft ${
        selected ? "border-accent-line bg-accent-soft" : "border-line bg-raised"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PaymentKindIcon kind={method.kind} />
            <div className="truncate text-sm font-black text-ink">{method.name}</div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-semibold text-muted">{method.code}</span>
            <span>{kindLabel(method.kind, t)}</span>
          </div>
        </div>
        <StatusBadge tone={statusTone(method.status)}>{statusLabel(method.status, t)}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-raised p-2">
          <div className="text-subtle">{t("paymentMethodsAdmin.card.sort")}</div>
          <div className="mt-1 font-semibold text-ink">{method.sortOrder}</div>
        </div>
        <div className="rounded-lg bg-raised p-2">
          <div className="text-subtle">{t("paymentMethodsAdmin.card.created")}</div>
          <div className="mt-1 font-semibold text-ink">
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
  const { t } = useI18n();
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
        <label className="text-sm font-semibold text-muted">
          {t("paymentMethodsAdmin.field.code")}
          <input
            value={form.code}
            onChange={(event) => setForm((draft) => ({ ...draft, code: event.target.value }))}
            maxLength={50}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("paymentMethodsAdmin.field.name")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("paymentMethodsAdmin.field.kind")}
          {mode === "create" ? (
            <select
              value={form.kind}
              onChange={(event) => setForm((draft) => ({ ...draft, kind: event.target.value }))}
              disabled={!canManage || isPending}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            >
              {PAYMENT_METHOD_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kindLabel(kind, t)}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 flex h-11 items-center rounded-xl border border-line bg-raised px-3 text-sm text-ink">
              {kindLabel(selectedMethod?.kind || form.kind, t)}
            </div>
          )}
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("paymentMethodsAdmin.field.sortOrder")}
          <input
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((draft) => ({ ...draft, sortOrder: event.target.value }))
            }
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
      </div>
      <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
        {t("paymentMethodsAdmin.kindReadOnlyNotice")}
      </div>
      {!canManage && (
        <div className="rounded-xl border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
          {t("paymentMethodsAdmin.notice.managePermissionRequired")}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending
            ? t("paymentMethodsAdmin.common.saving")
            : mode === "edit"
              ? t("paymentMethodsAdmin.action.saveMethod")
              : t("paymentMethodsAdmin.action.createMethod")}
        </button>
        {mode === "edit" && selectedMethod && (
          <button
            type="button"
            disabled={!canManage || isPending}
            onClick={() => onStatusChange(nextStatus)}
            className="flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-4 text-sm font-bold text-ink transition hover:border-accent-line hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? t("paymentMethodsAdmin.common.activate") : t("paymentMethodsAdmin.common.suspend")}
          </button>
        )}
      </div>
    </form>
  );
}

export default function PaymentMethodsAdminPage() {
  const { t } = useI18n();
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
      showNotice(t("paymentMethodsAdmin.notice.invalidSortOrder"));
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
        showNotice(t("paymentMethodsAdmin.notice.methodCreated"));
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
      showNotice(t("paymentMethodsAdmin.notice.methodUpdated"));
    } catch (error) {
      showNotice(getErrorMessage(error, t));
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
      showNotice(
        nextStatus === "Active"
          ? t("paymentMethodsAdmin.notice.methodActivated")
          : t("paymentMethodsAdmin.notice.methodSuspended"),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  return (
    <AppLayout>
      <main className="odoo-root space-y-3" dir="rtl">
        <PageHeader
          title={t("paymentMethodsAdmin.pageTitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => methodsQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
              >
                <RefreshCw size={14} />
                {t("paymentMethodsAdmin.refresh")}
              </button>
              <button
                type="button"
                onClick={startCreate}
                className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"
              >
                <Plus size={14} />
                {t("paymentMethodsAdmin.action.newMethod")}
              </button>
            </div>
          }
        />

        {notice && (
          <div className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">
            {notice}
          </div>
        )}

        {!currentCompanyId ? (
          <EmptyState
            title={t("paymentMethodsAdmin.gate.companyRequired.title")}
            message={t("paymentMethodsAdmin.gate.companyRequired.message")}
          />
        ) : configurePermissionQuery.isLoading ? (
          <LoadingState label={t("paymentMethodsAdmin.gate.checkingPermissions")} />
        ) : !configurePermissionQuery.hasPermission ? (
          <ErrorState
            title={t("paymentMethodsAdmin.gate.permissionRequired.title")}
            message={t("paymentMethodsAdmin.gate.permissionRequired.message")}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <section className="rounded-xl border border-line bg-surface p-3">
              <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_130px_150px]">
                <label className="relative block">
                  <Search
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    maxLength={100}
                    placeholder={t("paymentMethodsAdmin.field.searchCodeOrName")}
                    className="h-10 w-full rounded-xl border border-line bg-canvas pr-9 pl-3 text-sm text-ink outline-none focus:border-accent-line"
                  />
                </label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
                >
                  <option value="">{t("paymentMethodsAdmin.common.allStatus")}</option>
                  <option value="Active">{t("paymentMethodsAdmin.common.active")}</option>
                  <option value="Suspended">{t("paymentMethodsAdmin.common.suspended")}</option>
                </select>
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
                >
                  <option value="">{t("paymentMethodsAdmin.common.allKinds")}</option>
                  {PAYMENT_METHOD_KINDS.map((methodKind) => (
                    <option key={methodKind} value={methodKind}>
                      {kindLabel(methodKind, t)}
                    </option>
                  ))}
                </select>
              </div>

              {methodsQuery.isLoading && <LoadingState label={t("paymentMethodsAdmin.loadingMethods")} />}
              {methodsQuery.isError && (
                <ErrorState
                  title={t("paymentMethodsAdmin.loadMethodsError")}
                  message={getErrorMessage(methodsQuery.error, t)}
                />
              )}
              {!methodsQuery.isLoading &&
                !methodsQuery.isError &&
                methodsQuery.data?.length === 0 && (
                  <EmptyState
                    title={t("paymentMethodsAdmin.emptyMethods.title")}
                    message={t("paymentMethodsAdmin.emptyMethods.message")}
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

            <section className="rounded-xl border border-line bg-surface p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Power size={15} className="text-accent" />
                    {mode === "create"
                      ? t("paymentMethodsAdmin.methodDetails.createLabel")
                      : t("paymentMethodsAdmin.methodDetails.detailsLabel")}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-ink">
                    {mode === "create"
                      ? t("paymentMethodsAdmin.methodDetails.newMethodTitle")
                      : selectedMethod?.name || t("paymentMethodsAdmin.methodDetails.loadingMethodTitle")}
                  </h2>
                </div>
                {selectedMethod && (
                  <StatusBadge tone={statusTone(selectedMethod.status)}>
                    {statusLabel(selectedMethod.status, t)}
                  </StatusBadge>
                )}
              </div>

              {mode === "edit" && detailsQuery.isLoading && (
                <LoadingState label={t("paymentMethodsAdmin.loadingMethodDetails")} />
              )}
              {mode === "edit" && detailsQuery.isError && (
                <ErrorState
                  title={t("paymentMethodsAdmin.loadMethodDetailsError")}
                  message={getErrorMessage(detailsQuery.error, t)}
                />
              )}
              {(mode === "create" || selectedMethod) && (
                <div className="space-y-4">
                  {selectedMethod && (
                    <div className="grid gap-2 sm:grid-cols-4">
                      <div className="rounded-xl border border-line bg-raised p-3">
                        <div className="text-xs text-subtle">{t("paymentMethodsAdmin.field.kind")}</div>
                        <div className="mt-1 text-sm font-black text-ink">{kindLabel(selectedMethod.kind, t)}</div>
                      </div>
                      <div className="rounded-xl border border-line bg-raised p-3">
                        <div className="text-xs text-subtle">{t("paymentMethodsAdmin.field.sortOrder")}</div>
                        <div className="mt-1 text-sm font-black text-ink">
                          {selectedMethod.sortOrder}
                        </div>
                      </div>
                      <div className="rounded-xl border border-line bg-raised p-3">
                        <div className="text-xs text-subtle">{t("paymentMethodsAdmin.detail.operational")}</div>
                        <div className="mt-1 text-sm font-black text-ink">
                          {selectedMethod.isActive
                            ? t("paymentMethodsAdmin.detail.available")
                            : t("paymentMethodsAdmin.common.suspended")}
                        </div>
                      </div>
                      <div className="rounded-xl border border-line bg-raised p-3">
                        <div className="text-xs text-subtle">{t("paymentMethodsAdmin.card.created")}</div>
                        <div className="mt-1 text-sm font-black text-ink">
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
