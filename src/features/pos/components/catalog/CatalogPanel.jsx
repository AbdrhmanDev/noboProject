import { useState } from "react";
import { X } from "lucide-react";
import { ROUTES } from "../../../../utils/routes";
import { EmptyState, ErrorState, LoadingState } from "../../../../shared/components/ui";
import { PriceListOnboarding } from "../../../pricing/components/PriceListOnboarding";
import { FirstProductOnboarding } from "../../../catalog/components/FirstProductOnboarding";
import { TaxSettingsOnboarding } from "../../../tax/components/TaxSettingsOnboarding";
import { CategorySidebar } from "./CategorySidebar";
import { CategoryRail } from "./CategoryRail";
import { PosProductCard } from "./PosProductCard";
import { ROVING_ITEM_SELECTOR, useGridArrowNav } from "../../../shortcuts/rovingFocus";
import { brandAccentStyle } from "../../utils/brandAccents";

const hashIndex = (id) => Array.from(String(id)).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

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
  onTapProduct,
  query,
  productGridRef,
  // Touch-first redesign: per-product cart state + the card-level add/adjust handlers. All keyed
  // by productId, sourced from the same draft-order lines OrderLines already renders.
  draftLinesByProductId,
  activeProductId,
  onIncrementProductLine,
  onDecrementProductLine,
  // Stock shown on a flipped card's back: { enabled, companyId, stockByItemId, isLoading, isError }.
  inventory,
}) {
  const handleProductGridKeyDown = useGridArrowNav(productGridRef, ROVING_ITEM_SELECTOR);
  // The one product card currently turned to its back face (sizes / stepper / stock). Tapping
  // another card turns that one over instead; tapping the same card (or its back button) turns it
  // back. Pure view state.
  const [flippedProductId, setFlippedProductId] = useState(null);

  return (
    // md:h-[...] (not xl:) -- CategorySidebar itself is `hidden md:flex`, so the internal scroller
    // below has to become height-bound at that same breakpoint, otherwise (xl and up only) the
    // page as a whole scrolls between md and xl and drags the "fixed" category sidebar along with
    // it, which is exactly the bug this was meant to prevent.
    <section className="flex min-w-0 gap-2 rounded-pos-lg border border-pos-border bg-pos-bg p-2 md:h-[calc(100dvh-var(--pos-chrome))]">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
      {/* Responsive: below md the side category column would eat a third of a phone's width, so
          the same categories become a horizontal scrolling bar above the products instead. */}
      <div className="md:hidden">
        <CategoryRail categories={catalogCategories} activeCategoryId={category} onSelect={setCategory} />
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

      {/* The fixed bottom strip (PosStatusBar) sits BEHIND this box on screen whenever this section's own
          xl:h-[calc(100dvh-var(--pos-chrome))] places its bottom edge at the viewport's bottom edge
          -- so the clearance has to live on THIS internal scroller's own content, not as padding on
          some ancestor outside it (that would only add blank space at the very end of the page,
          never change where this box's OWN last row lands once scrolled all the way down). */}
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 scrollbar-none"
        style={{
          paddingBottom:
            "calc(var(--pos-bottom-chrome-h) + var(--pos-fab-clearance) + env(safe-area-inset-bottom))",
        }}
      >
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
                const accentStyle = brandAccentStyle(hashIndex(product.productId));
                const cartInfo = draftLinesByProductId?.get(product.productId);
                const isActive = activeProductId === product.productId;

                return (
                  <PosProductCard
                    key={product.productId}
                    product={product}
                    cartInfo={cartInfo}
                    isActive={isActive}
                    isFlipped={flippedProductId === product.productId}
                    disabled={!canEditDraft}
                    accentStyle={accentStyle}
                    currencyCode={catalogCurrencyCode}
                    inventory={inventory}
                    onFlip={() =>
                      setFlippedProductId((current) => (current === product.productId ? null : product.productId))
                    }
                    onAddDefault={() => onTapProduct(product)}
                    onIncrement={onIncrementProductLine}
                    onDecrement={onDecrementProductLine}
                  />
                );
              })}
            </div>
          )}
      </div>
      </div>

      {/* Touch-first redesign (11th pass): moved to the opposite side from the 10th pass -- rendered
          AFTER the product-grid column here (not before), so in this RTL app it lands on the
          physical left instead of the right. */}
      <div className="hidden md:flex">
        <CategorySidebar categories={catalogCategories} activeCategoryId={category} onSelect={setCategory} />
      </div>
    </section>
  );
}
