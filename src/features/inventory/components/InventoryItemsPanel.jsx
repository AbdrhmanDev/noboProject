import { useMemo, useState } from "react";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CirclePause,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useI18n } from "../../../i18n/I18nContext";
import { useActiveUnitsOfMeasure } from "../../catalog/hooks/useCatalog";
import {
  useChangeInventoryItemStatus,
  useCreateInventoryItem,
  useInventoryItemDetails,
  useInventoryItems,
  useUpdateInventoryItem,
} from "../hooks/useInventory";

const EMPTY_ITEM_FORM = { code: "", name: "", baseUnitOfMeasureId: "" };

function getErrorMessage(error, t) {
  return error?.message || t("inventory.common.requestFailed");
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function statusLabel(status, t) {
  return status === "Active" ? t("inventory.common.active") : t("inventory.common.suspended");
}

function ItemCard({ item, selected, onSelect }) {
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
            <Boxes size={16} className="shrink-0 text-accent" />
            <div className="truncate text-sm font-black text-ink">{item.name}</div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-semibold text-muted">{item.code}</span>
            <span>
              {item.baseUnitOfMeasure.name} ({item.baseUnitOfMeasure.symbol})
            </span>
          </div>
        </div>
        <StatusBadge tone={statusTone(item.status)}>{statusLabel(item.status, t)}</StatusBadge>
      </div>
    </button>
  );
}

function ItemForm({ mode, form, setForm, unitsOfMeasureQuery, selectedItem, canManage, isPending, onSubmit, onStatusChange }) {
  const { t } = useI18n();
  const nextStatus = selectedItem?.status === "Active" ? "Suspended" : "Active";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
        <label className="text-sm font-semibold text-muted">
          {t("inventory.items.field.code")}
          <input
            value={form.code}
            onChange={(event) => setForm((draft) => ({ ...draft, code: event.target.value }))}
            maxLength={50}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("inventory.items.field.name")}
          <input
            value={form.name}
            onChange={(event) => setForm((draft) => ({ ...draft, name: event.target.value }))}
            maxLength={200}
            disabled={!canManage || isPending}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
          />
        </label>
        <label className="text-sm font-semibold text-muted">
          {t("inventory.items.field.baseUnitOfMeasure")}
          {mode === "create" ? (
            <select
              value={form.baseUnitOfMeasureId}
              onChange={(event) =>
                setForm((draft) => ({ ...draft, baseUnitOfMeasureId: event.target.value }))
              }
              disabled={!canManage || isPending || unitsOfMeasureQuery.isLoading}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line disabled:opacity-50"
            >
              <option value="">{t("inventory.items.field.selectUnitPlaceholder")}</option>
              {(unitsOfMeasureQuery.data || []).map((uom) => (
                <option key={uom.id} value={uom.id}>
                  {uom.name} ({uom.symbol})
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 flex h-11 items-center rounded-xl border border-line bg-raised px-3 text-sm text-ink">
              {selectedItem
                ? `${selectedItem.baseUnitOfMeasure.name} (${selectedItem.baseUnitOfMeasure.symbol})`
                : "-"}
            </div>
          )}
        </label>
      </div>
      <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
        {t("inventory.items.uomReadOnlyNotice")}
      </div>
      {!canManage && (
        <div className="rounded-xl border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
          {t("inventory.items.notice.configurePermissionRequired")}
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
            ? t("inventory.common.saving")
            : mode === "edit"
              ? t("inventory.items.action.saveItem")
              : t("inventory.items.action.createItem")}
        </button>
        {mode === "edit" && selectedItem && (
          <button
            type="button"
            disabled={!canManage || isPending}
            onClick={() => onStatusChange(nextStatus)}
            className="flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-4 text-sm font-bold text-ink transition hover:border-accent-line hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextStatus === "Active" ? <CircleCheck size={15} /> : <CirclePause size={15} />}
            {nextStatus === "Active" ? t("inventory.common.activate") : t("inventory.common.suspend")}
          </button>
        )}
      </div>
    </form>
  );
}

export function InventoryItemsPanel({ companyId, canView, canConfigure }) {
  const { t } = useI18n();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState(EMPTY_ITEM_FORM);
  const [notice, setNotice] = useState("");

  const filters = useMemo(
    () => ({ status, search: search.trim(), pageNumber, pageSize: 25 }),
    [status, search, pageNumber],
  );
  const unitsOfMeasureQuery = useActiveUnitsOfMeasure(canView);
  const itemsQuery = useInventoryItems(companyId, filters, canView);
  const detailsQuery = useInventoryItemDetails(
    companyId,
    selectedItemId,
    canView && Boolean(selectedItemId),
  );
  const createMutation = useCreateInventoryItem(companyId);
  const updateMutation = useUpdateInventoryItem(companyId, selectedItemId);
  const statusMutation = useChangeInventoryItemStatus(companyId, selectedItemId);
  const selectedItem = detailsQuery.data || null;
  const isPending =
    createMutation.isPending || updateMutation.isPending || statusMutation.isPending;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const startCreate = () => {
    setMode("create");
    setSelectedItemId(null);
    setForm(EMPTY_ITEM_FORM);
  };

  const selectItem = (item) => {
    setMode("edit");
    setSelectedItemId(item.inventoryItemId);
    setForm({ code: item.code, name: item.name, baseUnitOfMeasureId: item.baseUnitOfMeasure.id });
  };

  const submitItem = async () => {
    if (mode === "create" && !form.baseUnitOfMeasureId) {
      showNotice(t("inventory.items.validation.selectUnit"));
      return;
    }

    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync({
          code: form.code,
          name: form.name,
          baseUnitOfMeasureId: form.baseUnitOfMeasureId,
        });
        setMode("edit");
        setSelectedItemId(created.inventoryItemId);
        setForm({
          code: created.code,
          name: created.name,
          baseUnitOfMeasureId: created.baseUnitOfMeasure.id,
        });
        showNotice(t("inventory.items.notice.itemCreated"));
        return;
      }

      const updated = await updateMutation.mutateAsync({ code: form.code, name: form.name });
      setForm({
        code: updated.code,
        name: updated.name,
        baseUnitOfMeasureId: updated.baseUnitOfMeasure.id,
      });
      showNotice(t("inventory.items.notice.itemUpdated"));
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
        baseUnitOfMeasureId: updated.baseUnitOfMeasure.id,
      });
      showNotice(
        nextStatus === "Active"
          ? t("inventory.items.notice.itemActivated")
          : t("inventory.items.notice.itemSuspended"),
      );
    } catch (error) {
      showNotice(getErrorMessage(error, t));
    }
  };

  const page = itemsQuery.data;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-ink">{t("inventory.items.heading")}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => itemsQuery.refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink"
          >
            <RefreshCw size={14} />
            {t("inventory.common.refresh")}
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"
          >
            <Plus size={14} />
            {t("inventory.items.action.newItem")}
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">
          {notice}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="rounded-xl border border-line bg-surface p-3">
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_130px]">
            <label className="relative block">
              <Search
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle"
              />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPageNumber(1);
                }}
                maxLength={100}
                placeholder={t("inventory.items.field.searchCodeOrName")}
                className="h-10 w-full rounded-xl border border-line bg-canvas pr-9 pl-3 text-sm text-ink outline-none focus:border-accent-line"
              />
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPageNumber(1);
              }}
              className="h-10 rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
            >
              <option value="">{t("inventory.common.allStatus")}</option>
              <option value="Active">{t("inventory.common.active")}</option>
              <option value="Suspended">{t("inventory.common.suspended")}</option>
            </select>
          </div>

          {itemsQuery.isLoading && <LoadingState label={t("inventory.items.loading")} />}
          {itemsQuery.isError && (
            <ErrorState
              title={t("inventory.items.loadError")}
              message={getErrorMessage(itemsQuery.error, t)}
            />
          )}
          {!itemsQuery.isLoading && !itemsQuery.isError && page?.items.length === 0 && (
            <EmptyState
              title={t("inventory.items.emptyItems.title")}
              message={t("inventory.items.emptyItems.message")}
            />
          )}
          {!itemsQuery.isLoading && !itemsQuery.isError && Boolean(page?.items.length) && (
            <>
              <div className="max-h-[calc(100vh-420px)] min-h-[300px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {page.items.map((item) => (
                  <ItemCard
                    key={item.inventoryItemId}
                    item={item}
                    selected={selectedItemId === item.inventoryItemId}
                    onSelect={() => selectItem(item)}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-muted">
                <span>
                  {t("inventory.items.pageOfItems", {
                    page: page.pageNumber,
                    total: page.totalPages || 1,
                    count: page.totalCount,
                  })}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={page.pageNumber <= 1}
                    onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
                    className="rounded-lg border border-line p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={page.pageNumber >= page.totalPages}
                    onClick={() => setPageNumber((value) => value + 1)}
                    className="rounded-lg border border-line p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Boxes size={15} className="text-accent" />
                {mode === "create" ? t("inventory.items.details.createLabel") : t("inventory.items.details.detailsLabel")}
              </div>
              <h2 className="mt-1 text-xl font-black text-ink">
                {mode === "create"
                  ? t("inventory.items.details.newItemTitle")
                  : selectedItem?.name || t("inventory.items.details.loadingItemTitle")}
              </h2>
            </div>
            {selectedItem && (
              <StatusBadge tone={statusTone(selectedItem.status)}>{statusLabel(selectedItem.status, t)}</StatusBadge>
            )}
          </div>

          {mode === "edit" && detailsQuery.isLoading && (
            <LoadingState label={t("inventory.items.loadingDetails")} />
          )}
          {mode === "edit" && detailsQuery.isError && (
            <ErrorState
              title={t("inventory.items.loadDetailsError")}
              message={getErrorMessage(detailsQuery.error, t)}
            />
          )}
          {(mode === "create" || selectedItem) && (
            <div className="space-y-4">
              {selectedItem && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-line bg-raised p-3">
                    <div className="text-xs text-subtle">{t("inventory.items.field.unitOfMeasure")}</div>
                    <div className="mt-1 text-sm font-black text-ink">
                      {selectedItem.baseUnitOfMeasure.code}
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-raised p-3">
                    <div className="text-xs text-subtle">{t("inventory.items.field.symbol")}</div>
                    <div className="mt-1 text-sm font-black text-ink">
                      {selectedItem.baseUnitOfMeasure.symbol}
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-raised p-3">
                    <div className="text-xs text-subtle">{t("inventory.common.created")}</div>
                    <div className="mt-1 text-sm font-black text-ink">
                      {selectedItem.createdAtUtc ? formatDateTime(selectedItem.createdAtUtc) : "-"}
                    </div>
                  </div>
                </div>
              )}

              <ItemForm
                mode={mode}
                form={form}
                setForm={setForm}
                unitsOfMeasureQuery={unitsOfMeasureQuery}
                selectedItem={selectedItem}
                canManage={canConfigure}
                isPending={isPending}
                onSubmit={submitItem}
                onStatusChange={changeStatus}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
