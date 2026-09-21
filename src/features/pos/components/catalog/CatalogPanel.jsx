import { Package, X } from "lucide-react";
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
    <section className="flex min-w-0 flex-col gap-3 rounded-pos-lg border border-pos-border bg-pos-bg p-3 xl:sticky xl:top-4 xl:h-[calc(100vh-12rem)] xl:min-h-[680px]">
      <CategoryRail categories={catalogCategories} activeCategoryId={category} onSelect={setCategory} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pos-fs-line flex flex-wrap items-center gap-2 font-bold text-pos-text">
            المنتجات القابلة للبيع{" "}
            <span className="text-pos-muted">({filteredProducts.length})</span>
            <ShortcutHint action="pos.browseProducts" />
          </h1>
          <p className="pos-fs-secondary mt-0.5">
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
              className="grid grid-cols-[repeat(auto-fill,minmax(var(--pos-card-min-w),1fr))] gap-[var(--pos-gap)]"
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
                    className="group flex flex-col overflow-hidden rounded-pos border border-pos-border bg-pos-card text-start transition hover:-translate-y-0.5 hover:border-pos-primary hover:shadow-[var(--pos-shadow-hover)] active:translate-y-0 active:bg-pos-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-pos-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-white">
                      <Package size={30} className="text-pos-muted" />
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full bg-white object-contain p-2"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <span className="pos-fs-price absolute end-1.5 top-1.5 rounded-pos bg-pos-primary px-2 py-0.5 leading-snug text-white shadow-sm">
                        {formatMoney(product.startingPrice, catalogCurrencyCode, 2)}
                      </span>
                      {hasModifiers && (
                        <span className="pos-fs-label absolute bottom-1.5 start-1.5 rounded-pos bg-pos-tint px-1.5 py-0.5 font-medium text-pos-primary-text">
                          Modifiers
                        </span>
                      )}
                    </div>
                    <div className="px-2.5 pb-2.5 pt-2">
                      <div className="pos-fs-name line-clamp-2 min-h-[2.7em] text-pos-text">
                        {product.productName}
                      </div>
                      <div className="pos-fs-label mt-0.5 min-h-[1.5em] truncate text-pos-muted">
                        {product.variants.length > 1
                          ? `${product.variants.length} variants`
                          : product.variants[0]?.variantName}
                      </div>
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
