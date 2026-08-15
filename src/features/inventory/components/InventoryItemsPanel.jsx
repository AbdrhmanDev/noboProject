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
import { useActiveUnitsOfMeasure } from "../../catalog/hooks/useCatalog";
import {
  useChangeInventoryItemStatus,
  useCreateInventoryItem,
  useInventoryItemDetails,
  useInventoryItems,
  useUpdateInventoryItem,
} from "../hooks/useInventory";

const EMPTY_ITEM_FORM = { code: "", name: "", baseUnitOfMeasureId: "" };

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function statusTone(status) {
  return status === "Active" ? "success" : "warning";
}

function ItemCard({ item, selected, onSelect }) {
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
            <Boxes size={16} className="shrink-0 text-blue-300" />
            <div className="truncate text-sm font-black text-white">{item.name}</div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{item.code}</span>
            <span>
              {item.baseUnitOfMeasure.name} ({item.baseUnitOfMeasure.symbol})
            </span>
          </div>
        </div>
        <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
      </div>
    </button>
  );
}

function ItemForm({ mode, form, setForm, unitsOfMeasureQuery, selectedItem, canManage, isPending, onSubmit, onStatusChange }) {
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
          Base unit of measure
          {mode === "create" ? (
            <select
              value={form.baseUnitOfMeasureId}
              onChange={(event) =>
                setForm((draft) => ({ ...draft, baseUnitOfMeasureId: event.target.value }))
              }
              disabled={!canManage || isPending || unitsOfMeasureQuery.isLoading}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            >
              <option value="">Select unit...</option>
              {(unitsOfMeasureQuery.data || []).map((uom) => (
                <option key={uom.id} value={uom.id}>
                  {uom.name} ({uom.symbol})
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.025] px-3 text-sm text-slate-200">
              {selectedItem
                ? `${selectedItem.baseUnitOfMeasure.name} (${selectedItem.baseUnitOfMeasure.symbol})`
                : "-"}
            </div>
          )}
        </label>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
        Base unit of measure is selected on create and is read-only after creation.
      </div>
      {!canManage && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Inventory.Configure permission is required for inventory item changes.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canManage || isPending}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "edit" ? <Pencil size={15} /> : <Plus size={15} />}
          {isPending ? "Saving..." : mode === "edit" ? "Save item" : "Create item"}
        </button>
        {mode === "edit" && selectedItem && (
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

export function InventoryItemsPanel({ companyId, canView, canConfigure }) {
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
      showNotice("Select a base unit of measure.");
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
        showNotice("Inventory item created.");
        return;
      }

      const updated = await updateMutation.mutateAsync({ code: form.code, name: form.name });
      setForm({
        code: updated.code,
        name: updated.name,
        baseUnitOfMeasureId: updated.baseUnitOfMeasure.id,
      });
      showNotice("Inventory item updated.");
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
        baseUnitOfMeasureId: updated.baseUnitOfMeasure.id,
      });
      showNotice(`Inventory item ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      showNotice(getErrorMessage(error));
    }
  };

  const page = itemsQuery.data;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">Inventory Items</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => itemsQuery.refetch()}
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
            New item
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
          {notice}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_130px]">
            <label className="relative block">
              <Search
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPageNumber(1);
                }}
                maxLength={100}
                placeholder="Search code or name"
                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs text-white outline-none focus:border-blue-400/60"
              />
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPageNumber(1);
              }}
              className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-blue-400/60"
            >
              <option value="">All status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {itemsQuery.isLoading && <LoadingState label="Loading inventory items..." />}
          {itemsQuery.isError && (
            <ErrorState
              title="Unable to load inventory items"
              message={getErrorMessage(itemsQuery.error)}
            />
          )}
          {!itemsQuery.isLoading && !itemsQuery.isError && page?.items.length === 0 && (
            <EmptyState
              title="No inventory items found"
              message="No items match the current filters."
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
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Page {page.pageNumber} of {page.totalPages || 1} · {page.totalCount} items
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={page.pageNumber <= 1}
                    onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
                    className="rounded-lg border border-white/10 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={page.pageNumber >= page.totalPages}
                    onClick={() => setPageNumber((value) => value + 1)}
                    className="rounded-lg border border-white/10 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Boxes size={15} className="text-blue-300" />
                {mode === "create" ? "Create item" : "Item details"}
              </div>
              <h2 className="mt-1 text-xl font-black text-white">
                {mode === "create" ? "New inventory item" : selectedItem?.name || "Loading item"}
              </h2>
            </div>
            {selectedItem && (
              <StatusBadge tone={statusTone(selectedItem.status)}>{selectedItem.status}</StatusBadge>
            )}
          </div>

          {mode === "edit" && detailsQuery.isLoading && (
            <LoadingState label="Loading inventory item details..." />
          )}
          {mode === "edit" && detailsQuery.isError && (
            <ErrorState
              title="Unable to load item details"
              message={getErrorMessage(detailsQuery.error)}
            />
          )}
          {(mode === "create" || selectedItem) && (
            <div className="space-y-4">
              {selectedItem && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <div className="text-[11px] text-slate-500">Unit of measure</div>
                    <div className="mt-1 text-sm font-black text-white">
                      {selectedItem.baseUnitOfMeasure.code}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <div className="text-[11px] text-slate-500">Symbol</div>
                    <div className="mt-1 text-sm font-black text-white">
                      {selectedItem.baseUnitOfMeasure.symbol}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <div className="text-[11px] text-slate-500">Created</div>
                    <div className="mt-1 text-sm font-black text-white">
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
