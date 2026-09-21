import { Package, Plus, X } from "lucide-react";
import { ROUTES } from "../../../../utils/routes";
import { EmptyState, ErrorState, LoadingState } from "../../../../shared/components/ui";
import { formatMoney } from "../../../../shared/utils/formatters";
import { PriceListOnboarding } from "../../../pricing/components/PriceListOnboarding";
import { FirstProductOnboarding } from "../../../catalog/components/FirstProductOnboarding";
import { TaxSettingsOnboarding } from "../../../tax/components/TaxSettingsOnboarding";
import { CategoryRail } from "./CategoryRail";
import { ROVING_ITEM_SELECTOR, useGridArrowNav } from "../../../shortcuts/rovingFocus";
import { ShortcutHint } from "../../../shortcuts/components/ShortcutHint";

export const ALL_CATEGORY_ID = "__all__";
export const UNCATEGORIZED_CATEGORY_ID = "__uncategorized__";

export function CatalogPanel({
  navigate,
  catalogCategories,
  category,
  setCategory,
  filteredProducts,
  sellableCatalogQuery,
  catalogCurrencyCode,
  taxCategoryBanner,
  setTaxCategoryBanner,
  catalogPermissionQuery,
  catalogManagePermissionQuery,
  pricingManagePermissionQuery,
  taxSettingsQuery,
  taxSetupRequired,
  canEditDraft,
  addItem,
  query,
  productGridRef,
}) {
  const handleProductGridKeyDown = useGridArrowNav(productGridRef, ROVING_ITEM_SELECTOR);

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-surface)] xl:sticky xl:top-4 xl:h-[calc(100vh-12rem)] xl:min-h-[680px]">
      <CategoryRail categories={catalogCategories} activeCategoryId={category} onSelect={setCategory} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-base font-black text-ink">
            المنتجات القابلة للبيع{" "}
            <span className="text-subtle">({filteredProducts.length})</span>
            <ShortcutHint action="pos.browseProducts" />
          </h1>
          <p className="mt-0.5 text-[11px] text-subtle">
            {sellableCatalogQuery.data
              ? `${sellableCatalogQuery.data.priceListName} · ${catalogCurrencyCode}`
              : "تحميل الكتالوج التشغيلي للفرع"}
          </p>
        </div>
      </div>

      {taxCategoryBanner && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <span>
            Tax category required — tax is enabled for this company, but{" "}
            {taxCategoryBanner.join(", ")}{" "}
            {taxCategoryBanner.length > 1 ? "have" : "has"} no tax category.
          </span>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.TAX_ADMIN)}
              className="font-semibold text-amber-200 hover:text-white"
            >
              Configure
            </button>
            <button
              type="button"
              onClick={() => setTaxCategoryBanner(null)}
              className="text-amber-300/70 hover:text-white"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-none">
        {catalogPermissionQuery.isLoading && (
          <LoadingState label="Checking catalog access..." />
        )}
        {catalogPermissionQuery.isError && (
          <ErrorState
            title="Catalog permissions unavailable"
            message="Unable to confirm sellable catalog access."
          />
        )}
        {!catalogPermissionQuery.isLoading &&
          !catalogPermissionQuery.isError &&
          !catalogPermissionQuery.hasPermission && (
            <EmptyState
              title="No access to sellable catalog"
              message="Your current role cannot create sales orders for this company."
            />
          )}
        {sellableCatalogQuery.isLoading && (
          <LoadingState label="Loading sellable catalog..." />
        )}
        {sellableCatalogQuery.isError &&
          (sellableCatalogQuery.error?.code === "PriceList.ActiveDefaultNotConfigured" ? (
            <PriceListOnboarding onCreated={() => sellableCatalogQuery.refetch()} />
          ) : (
            <ErrorState
              title="Sellable catalog unavailable"
              message="Unable to load sellable products for this branch."
            />
          ))}
        {sellableCatalogQuery.data &&
          !sellableCatalogQuery.isLoading &&
          !filteredProducts.length &&
          (query || category !== ALL_CATEGORY_ID ? (
            <EmptyState
              title="No sellable products are available for this branch"
              message="Try another category or search term."
            />
          ) : catalogManagePermissionQuery.hasPermission &&
            pricingManagePermissionQuery.hasPermission ? (
            <FirstProductOnboarding onCompleted={() => sellableCatalogQuery.refetch()} />
          ) : (
            <EmptyState
              title="No sellable products are available for this branch"
              message="Try another category or search term."
            />
          ))}
        {sellableCatalogQuery.data && filteredProducts.length > 0 && taxSettingsQuery.isLoading && (
          <LoadingState label="Checking tax settings..." />
        )}
        {sellableCatalogQuery.data &&
          filteredProducts.length > 0 &&
          !taxSettingsQuery.isLoading &&
          taxSetupRequired && (
            <TaxSettingsOnboarding onCompleted={() => taxSettingsQuery.refetch()} />
          )}
        {sellableCatalogQuery.data &&
          filteredProducts.length > 0 &&
          !taxSettingsQuery.isLoading &&
          !taxSetupRequired && (
            <div
              ref={productGridRef}
              onKeyDown={handleProductGridKeyDown}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
            >
              {filteredProducts.map((product) => {
                const hasModifiers = product.variants.some(
                  (variant) => variant.modifierGroups?.length,
                );

                return (
                  <button
                    type="button"
                    key={product.productId}
                    data-roving-item=""
                    onClick={() => addItem(product)}
                    disabled={!canEditDraft}
                    className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface p-2.5 text-start transition hover:-translate-y-0.5 hover:border-accent-line hover:shadow-[var(--shadow-float)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="relative mb-2.5 grid aspect-[16/11] place-items-center overflow-hidden rounded-lg bg-inset">
                      <Package size={30} className="text-subtle" />
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition duration-200 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <span className="absolute bottom-1.5 start-1.5 rounded-md bg-surface/85 px-1.5 py-0.5 text-[9px] font-semibold text-muted backdrop-blur-sm">
                        {product.categoryName}
                      </span>
                    </div>
                    <div className="line-clamp-2 min-h-9 text-[13px] font-bold leading-[1.35] text-ink">
                      {product.productName}
                    </div>
                    <div className="mt-0.5 min-h-4 truncate text-[10px] text-subtle">
                      {product.variants.length > 1
                        ? `${product.variants.length} variants`
                        : product.variants[0]?.variantName}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-danger">
                        {formatMoney(product.startingPrice, catalogCurrencyCode, 2)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {hasModifiers && (
                          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-accent">
                            Modifiers
                          </span>
                        )}
                        <span
                          aria-hidden="true"
                          className="grid h-7 w-7 place-items-center rounded-full bg-accent text-white shadow-[var(--shadow-surface)] transition group-hover:bg-accent-strong"
                        >
                          <Plus size={15} strokeWidth={2.5} />
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
      </div>
    </section>
  );
}
