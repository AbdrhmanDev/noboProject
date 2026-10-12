import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, CheckCircle2, ChevronDown, LayoutGrid, List, MoreVertical, Package, Pencil, Tags, X } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { ControlPanel } from "../../../shared/components/odoo/ControlPanel";
import { StatusPill } from "../../../shared/components/odoo/StatusBar";
import { EmptyState, ErrorState } from "../../../shared/components/ui";
import { useResolvedImageSrc } from "../../../shared/hooks/useResolvedImageSrc";
import { useBulkProductActions } from "../hooks/useCatalog";

const PAGE_SIZES = [25, 50, 100];
const STATUS_TONE = { Active: "success", Suspended: "neutral" };

function ProductThumb({ imageUrl, size = "h-9 w-9" }) {
  const [failed, setFailed] = useState(false);
  // SelfHosted images sit behind an authenticated route; this turns them into a blob URL first.
  const { src, failed: resolveFailed } = useResolvedImageSrc(imageUrl);
  const show = Boolean(src) && !failed && !resolveFailed;
  return (
    <span className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-inset text-subtle`}>
      {show ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <Package size={16} />
      )}
    </span>
  );
}

// Small "more" menu on a row: edit + activate/suspend. Closes on outside click or Escape.
function RowMenu({ product, canManage, onEdit, onToggleStatus }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("catalogAdmin.list.actions")}
        className="grid h-8 w-8 place-items-center rounded-md text-subtle transition hover:bg-hover hover:text-ink"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-30 mt-1 w-44 rounded-lg border border-line bg-surface p-1 shadow-[var(--shadow-float)]">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-start text-sm text-ink transition hover:bg-hover"
          >
            <Pencil size={14} className="text-subtle" />
            {t("catalogAdmin.list.edit")}
          </button>
          {canManage && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onToggleStatus();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-start text-sm text-ink transition hover:bg-hover"
            >
              {product.status === "Active" ? <Archive size={14} className="text-subtle" /> : <CheckCircle2 size={14} className="text-subtle" />}
              {product.status === "Active" ? t("catalogAdmin.list.archive") : t("catalogAdmin.list.activate")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Products, Odoo list style: control panel (search / status + category filters / group by /
// list-kanban / pager), a table with row checkboxes, and a bar of bulk actions for the selection.
// Filters and paging stay server-side (the page owns that state); Group By regroups the loaded page.
// Price and stock aren't shown: the products list API doesn't carry them (they live in pricing and
// inventory).
export function ProductsListView({
  companyId,
  branchId,
  categories,
  productsQuery,
  search,
  onSearchChange,
  status,
  onStatusChange,
  categoryId,
  onCategoryChange,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  canManage,
  onOpenProduct,
  showNotice,
}) {
  const { t } = useI18n();
  const bulk = useBulkProductActions(companyId, branchId);
  const [view, setView] = useState("list");
  const [groupBy, setGroupBy] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkCategory, setBulkCategory] = useState("");

  const data = productsQuery.data;
  const products = useMemo(() => data?.items ?? [], [data]);
  const total = data?.totalCount ?? 0;
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);

  const selectedProducts = products.filter((product) => selectedIds.has(product.productId));
  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const toggleOne = (productId) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(products.map((product) => product.productId)));

  const report = (result) => {
    showNotice(
      result.failed
        ? t("catalogAdmin.list.bulkPartial", { succeeded: result.succeeded, failed: result.failed })
        : t("catalogAdmin.list.bulkDone", { count: result.succeeded }),
    );
  };
  const runStatus = async (items, nextStatus) => {
    const result = await bulk.changeStatus.mutateAsync({ productIds: items.map((item) => item.productId), status: nextStatus });
    report(result);
    setSelectedIds(new Set());
  };
  const runCategory = async (value) => {
    if (!value) return;
    const result = await bulk.changeCategory.mutateAsync({
      products: selectedProducts,
      categoryId: value === "__none__" ? null : value,
    });
    report(result);
    setBulkCategory("");
    setSelectedIds(new Set());
  };
  const busy = bulk.changeStatus.isPending || bulk.changeCategory.isPending;

  const categoryName = (id) => categories.find((category) => category.categoryId === id)?.name;
  const facets = [
    status && { id: "status", label: t(`catalogAdmin.common.${status === "Active" ? "active" : "suspended"}`), onRemove: () => onStatusChange("") },
    categoryId && { id: "category", label: categoryName(categoryId) ?? t("catalogAdmin.field.category"), onRemove: () => onCategoryChange("") },
    groupBy && { id: "group", label: `${t("odoo.groupBy")}: ${t(groupBy === "category" ? "catalogAdmin.field.category" : "catalogAdmin.list.status")}`, onRemove: () => setGroupBy("") },
  ].filter(Boolean);

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: "all", label: null, rows: products }];
    const map = new Map();
    for (const product of products) {
      const key = groupBy === "category" ? product.categoryId || "none" : product.status;
      const label =
        groupBy === "category"
          ? product.categoryName || t("catalogAdmin.field.noCategory")
          : t(`catalogAdmin.common.${product.status === "Active" ? "active" : "suspended"}`);
      if (!map.has(key)) map.set(key, { key, label, rows: [] });
      map.get(key).rows.push(product);
    }
    return [...map.values()];
  }, [groupBy, products, t]);

  const statusPill = (product) => (
    <StatusPill tone={STATUS_TONE[product.status]}>
      {t(`catalogAdmin.common.${product.status === "Active" ? "active" : "suspended"}`)}
    </StatusPill>
  );

  return (
    <div className="space-y-3">
      <ControlPanel
        breadcrumbs={[t("catalogAdmin.pageTitle"), t("catalogAdmin.tab.products")]}
        search={{ value: search, onChange: onSearchChange, placeholder: t("catalogAdmin.products.searchPlaceholder") }}
        facets={facets}
        filters={[
          ["Active", "Suspended"].map((value) => ({
            id: `status-${value}`,
            label: t(`catalogAdmin.common.${value === "Active" ? "active" : "suspended"}`),
            active: status === value,
            onToggle: () => onStatusChange(status === value ? "" : value),
          })),
          categories.map((category) => ({
            id: `category-${category.categoryId}`,
            label: category.name,
            active: categoryId === category.categoryId,
            onToggle: () => onCategoryChange(categoryId === category.categoryId ? "" : category.categoryId),
          })),
        ].filter((section) => section.length)}
        groupBy={[
          { id: "category", label: t("catalogAdmin.field.category") },
          { id: "status", label: t("catalogAdmin.list.status") },
        ].map((option) => ({ ...option, active: groupBy === option.id, onSelect: () => setGroupBy((current) => (current === option.id ? "" : option.id)) }))}
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
          onPrev: page > 1 ? () => onPageChange(page - 1) : undefined,
          onNext: data && page < data.totalPages ? () => onPageChange(page + 1) : undefined,
        }}
      />

      {productsQuery.isLoading && (
        <div className="space-y-2 rounded-xl border border-line bg-surface p-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="animate-pulse bg-inset h-9 w-9 rounded-md" />
              <div className="animate-pulse bg-inset h-3 flex-1" />
              <div className="animate-pulse bg-inset h-3 w-24" />
              <div className="animate-pulse bg-inset h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      )}
      {productsQuery.isError && (
        <ErrorState title={t("catalogAdmin.products.loadError")} message={productsQuery.error?.message} />
      )}
      {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
        <EmptyState title={t("catalogAdmin.products.empty.title")} message={t("catalogAdmin.products.empty.message")} />
      )}

      {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 && view === "list" && (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-[var(--shadow-surface)]">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line-strong bg-raised text-xs font-bold text-muted">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(element) => {
                      if (element) element.indeterminate = selectedProducts.length > 0 && !allSelected;
                    }}
                    onChange={toggleAll}
                    aria-label={t("catalogAdmin.list.selectAll")}
                    className="h-4 w-4 accent-current"
                  />
                </th>
                <th className="w-10 px-2 py-2.5 text-start">#</th>
                <th className="w-14 px-2 py-2.5 text-start">{t("catalogAdmin.field.image")}</th>
                <th className="px-3 py-2.5 text-start">{t("catalogAdmin.field.name")}</th>
                <th className="px-3 py-2.5 text-start">{t("catalogAdmin.field.category")}</th>
                <th className="px-3 py-2.5 text-end">{t("catalogAdmin.common.variants")}</th>
                <th className="px-3 py-2.5 text-start">{t("catalogAdmin.common.tax")}</th>
                <th className="px-3 py-2.5 text-start">{t("catalogAdmin.list.status")}</th>
                <th className="w-12 px-2 py-2.5" aria-label={t("catalogAdmin.list.actions")} />
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group.key}>
                {group.label && (
                  <tr className="border-b border-line bg-inset">
                    <td colSpan={9} className="px-3 py-2 text-sm font-bold text-ink">
                      {group.label} <span className="pos-num font-normal text-subtle">({group.rows.length})</span>
                    </td>
                  </tr>
                )}
                {group.rows.map((product) => {
                  const index = products.indexOf(product);
                  const selected = selectedIds.has(product.productId);
                  return (
                    <tr
                      key={product.productId}
                      onClick={() => onOpenProduct(product)}
                      className={`cursor-pointer border-b border-line transition last:border-0 hover:bg-hover ${
                        selected ? "bg-accent-soft" : index % 2 ? "bg-inset" : ""
                      }`}
                    >
                      <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleOne(product.productId)}
                          aria-label={t("catalogAdmin.list.selectRow", { name: product.name })}
                          className="h-4 w-4 accent-current"
                        />
                      </td>
                      <td className="pos-num px-2 py-2 text-subtle">{start + index}</td>
                      <td className="px-2 py-1.5">
                        <ProductThumb imageUrl={product.imageUrl} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-bold text-ink">{product.name}</div>
                        {product.description && <div className="line-clamp-1 text-xs text-subtle">{product.description}</div>}
                      </td>
                      <td className="px-3 py-2 text-muted">{product.categoryName || t("catalogAdmin.field.noCategory")}</td>
                      <td className="pos-num px-3 py-2 text-end font-bold text-ink">{product.variantCount}</td>
                      <td className="px-3 py-2 text-muted">{product.salesTaxCategoryName || product.salesTaxCategoryCode || "—"}</td>
                      <td className="px-3 py-2">{statusPill(product)}</td>
                      <td className="px-2 py-1.5">
                        <RowMenu
                          product={product}
                          canManage={canManage}
                          onEdit={() => onOpenProduct(product)}
                          onToggleStatus={() => runStatus([product], product.status === "Active" ? "Suspended" : "Active")}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}

      {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 && view === "kanban" && (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key}>
              {group.label && (
                <div className="mb-2 text-sm font-bold text-ink">
                  {group.label} <span className="pos-num font-normal text-subtle">({group.rows.length})</span>
                </div>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
                {group.rows.map((product) => (
                  <button
                    key={product.productId}
                    type="button"
                    onClick={() => onOpenProduct(product)}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-start shadow-[var(--shadow-surface)] transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg"
                  >
                    <ProductThumb imageUrl={product.imageUrl} size="h-14 w-14" />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block truncate font-bold text-ink">{product.name}</span>
                      <span className="block truncate text-xs text-muted">{product.categoryName || t("catalogAdmin.field.noCategory")}</span>
                      <span className="flex items-center gap-2">
                        {statusPill(product)}
                        <span className="pos-num text-[11px] text-subtle">
                          {product.variantCount} {t("catalogAdmin.common.variants")}
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer: bulk actions for the selection, and the page size. */}
      {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 && (
        <div className="sticky bottom-2 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 shadow-[var(--shadow-float)]">
          {selectedProducts.length > 0 && canManage ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="pos-num rounded-md bg-accent-soft px-2 py-1 text-xs font-bold text-accent">
                {t("catalogAdmin.list.selected", { count: selectedProducts.length })}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => runStatus(selectedProducts.filter((product) => product.status === "Active"), "Suspended")}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-bold text-ink transition hover:bg-hover disabled:opacity-50"
              >
                <Archive size={14} />
                {t("catalogAdmin.list.archive")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => runStatus(selectedProducts.filter((product) => product.status !== "Active"), "Active")}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-bold text-ink transition hover:bg-hover disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {t("catalogAdmin.list.activate")}
              </button>
              <label className="relative flex h-8 items-center gap-1.5 rounded-lg border border-line ps-2.5 text-xs font-bold text-ink focus-within:border-accent-line">
                <Tags size={14} />
                <select
                  value={bulkCategory}
                  disabled={busy}
                  onChange={(event) => {
                    setBulkCategory(event.target.value);
                    runCategory(event.target.value);
                  }}
                  aria-label={t("catalogAdmin.list.changeCategory")}
                  className="h-full appearance-none bg-transparent pe-7 outline-none"
                >
                  <option value="">{t("catalogAdmin.list.changeCategory")}</option>
                  <option value="__none__">{t("catalogAdmin.field.noCategory")}</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute end-2 text-subtle" />
              </label>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                aria-label={t("catalogAdmin.list.clearSelection")}
                title={t("catalogAdmin.list.clearSelection")}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-hover hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <span className="pos-num text-xs text-muted">
              {start}-{end} / {total}
            </span>
          )}
          <label className="flex items-center gap-2 text-xs text-muted">
            {t("catalogAdmin.list.perPage")}
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-8 rounded-lg border border-line bg-canvas px-2 text-ink outline-none"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
