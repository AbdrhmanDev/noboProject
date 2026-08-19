import { Barcode, Gift, Package, X } from "lucide-react";
import { ROUTES } from "../../../../utils/routes";
import { EmptyState, ErrorState, LoadingState } from "../../../../shared/components/ui";
import { formatMoney } from "../../../../shared/utils/formatters";
import { PriceListOnboarding } from "../../../pricing/components/PriceListOnboarding";
import { FirstProductOnboarding } from "../../../catalog/components/FirstProductOnboarding";
import { TaxSettingsOnboarding } from "../../../tax/components/TaxSettingsOnboarding";
import { IconButton } from "../PosPrimitives";
import { CategoryRail } from "./CategoryRail";
import { ROVING_ITEM_SELECTOR, useGridArrowNav } from "../../../shortcuts/rovingFocus";
import { ShortcutHint } from "../../../shortcuts/components/ShortcutHint";

export const ALL_CATEGORY_ID = "__all__";
export const UNCATEGORIZED_CATEGORY_ID = "__uncategorized__";

export function CatalogPanel({
  navigate,
  notify,
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
  isDraftMutationPending,
  addItem,
  onOpenPromotions,
  query,
  productGridRef,
}) {
  const handleProductGridKeyDown = useGridArrowNav(productGridRef, ROVING_ITEM_SELECTOR);

  return (
    <section className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
      <CategoryRail categories={catalogCategories} activeCategoryId={category} onSelect={setCategory} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-base font-black text-white">
            المنتجات القابلة للبيع{" "}
            <span className="text-slate-500">({filteredProducts.length})</span>
            <ShortcutHint action="pos.browseProducts" />
          </h1>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {sellableCatalogQuery.data
              ? `${sellableCatalogQuery.data.priceListName} · ${catalogCurrencyCode}`
              : "تحميل الكتالوج التشغيلي للفرع"}
          </p>
        </div>
        <div className="flex gap-2">
          <IconButton
            icon={Barcode}
            label="مسح باركود"
            onClick={() => notify("وضع المسح جاهز لاستقبال الباركود.")}
          />
          <IconButton icon={Gift} label="العروض النشطة" onClick={onOpenPromotions} tone="pink" />
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
                    disabled={!canEditDraft || isDraftMutationPending}
                    className="group overflow-hidden rounded-xl border border-white/10 bg-[#0d1728] p-2.5 text-right transition hover:-translate-y-0.5 hover:border-blue-400/60 hover:bg-[#111f36] hover:shadow-lg hover:shadow-blue-950/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="relative mb-2 grid aspect-[1.3] place-items-center overflow-hidden rounded-lg border border-white/8 bg-white/[0.025]">
                      <Package size={28} className="text-blue-300/80" />
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <span className="absolute bottom-1.5 right-2 rounded bg-black/25 px-1.5 py-0.5 text-[9px] text-slate-300">
                        {product.categoryName}
                      </span>
                    </div>
                    <div className="line-clamp-2 min-h-8 text-[11px] font-bold leading-4 text-slate-100">
                      {product.productName}
                    </div>
                    <div className="mt-1 min-h-4 truncate text-[10px] text-slate-500">
                      {product.variants.length > 1
                        ? `${product.variants.length} variants`
                        : product.variants[0]?.variantName}
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <span className="text-xs font-black text-white">
                        {formatMoney(product.startingPrice, catalogCurrencyCode, 2)}
                      </span>
                      {hasModifiers && (
                        <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">
                          Modifiers
                        </span>
                      )}
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
