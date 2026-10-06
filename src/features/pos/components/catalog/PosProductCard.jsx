import { useState } from "react";
import { Minus, Package, Plus, RotateCcw } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { useResolvedImageSrc } from "../../../../shared/hooks/useResolvedImageSrc";
import { useI18n } from "../../../../i18n/I18nContext";
import { useProductVariantInventoryConsumption } from "../../../inventory/hooks/useInventory";
import {
  STOCK_LEVELS,
  abbreviateModifierLabel,
  getStockLevel,
  sortVariantsBySize,
  variantSizeLabel,
} from "../../utils/posFormatters";

// Flip card (15th pass). Two faces in a real 3D flip (.pos-flip in pos-theme.css):
//  - FRONT: the product photo filling the whole card, its price in the top-right corner, the name
//    on a scrim along the bottom, and the in-cart quantity in the top-left. Tapping it ONLY flips
//    the card (`onFlip`) -- nothing is added to the order.
//  - BACK: name + price, the S / M / L size circles (one size at a time, POSPage's
//    selectProductSize via `onSelectSize`), the [-] qty [+] stepper, and the product's stock.
//    "+" adds the default size when the product isn't in the cart yet (`onAddDefault`), otherwise
//    adjusts the most recently added variant + modifier combination (`onIncrement`/`onDecrement`).
// Only one card is flipped at a time (CatalogPanel owns `isFlipped`).
export function PosProductCard({
  product,
  cartInfo,
  isActive,
  isFlipped,
  disabled,
  accentStyle,
  currencyCode,
  inventory,
  onFlip,
  onAddDefault,
  onSelectSize,
  onIncrement,
  onDecrement,
}) {
  const { t } = useI18n();
  const quantityInCart = cartInfo?.quantity ?? 0;
  const sizeVariants = product.variants.length > 1 ? sortVariantsBySize(product.variants) : [];

  const representativeLine = cartInfo?.lines?.[cartInfo.lines.length - 1] ?? null;
  const representativeVariant = representativeLine
    ? product.variants.find((entry) => entry.productVariantId === representativeLine.productVariantId)
    : null;
  const representativeModifierOptionIds =
    representativeLine?.modifiers.map((modifier) => modifier.modifierOptionId) ?? [];
  const displayPrice = representativeVariant?.price ?? product.startingPrice;
  const price = formatMoney(displayPrice, currencyCode, 2);
  // The variant whose stock is shown: the selected size once in the cart, else the default one.
  const stockVariant = representativeVariant ?? sortVariantsBySize(product.variants)[0] ?? null;

  const increment = () => {
    if (representativeVariant) onIncrement(representativeVariant, representativeModifierOptionIds);
    else onAddDefault();
  };
  const decrement = () => {
    if (representativeVariant) onDecrement(representativeVariant, representativeModifierOptionIds);
  };

  return (
    <div
      style={accentStyle}
      data-flipped={isFlipped ? "true" : "false"}
      className="pos-flip pos-product-card relative h-[var(--pos-card-h)] rounded-pos-lg"
    >
      <div className="pos-flip-inner">
        {/* FRONT */}
        <button
          type="button"
          onClick={onFlip}
          disabled={disabled}
          data-roving-item=""
          aria-label={`${product.productName} · ${price}`}
          aria-expanded={isFlipped}
          tabIndex={isFlipped ? -1 : 0}
          className={`pos-flip-face overflow-hidden rounded-pos-lg border bg-pos-card text-start disabled:opacity-50 ${
            isActive && quantityInCart > 0 ? "border-2 border-pos-primary" : "border-pos-border"
          }`}
        >
          <ProductPhoto imageUrl={product.imageUrl} />
          <span className="pos-num pos-fs-label absolute right-1.5 top-1.5 rounded-pos bg-pos-card/95 px-1.5 py-0.5 font-bold text-pos-text shadow-sm">
            {price}
          </span>
          {quantityInCart > 0 && (
            <span className="pos-num absolute left-1.5 top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-pos-primary-strong px-1.5 text-[11px] font-bold text-white shadow-sm">
              {quantityInCart}
            </span>
          )}
          <span className="pos-photo-scrim absolute inset-x-0 bottom-0 px-2 pb-1.5 pt-6">
            <span className="pos-fs-card-name line-clamp-2 text-white">{product.productName}</span>
          </span>
        </button>

        {/* BACK */}
        <div
          aria-hidden={!isFlipped}
          className="pos-flip-face pos-flip-back pos-chip-soft flex flex-col gap-1.5 overflow-hidden rounded-pos-lg border border-pos-primary bg-pos-card p-2"
        >
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <div className="pos-fs-card-name line-clamp-1 text-pos-text">{product.productName}</div>
              <div className="pos-num pos-fs-card-price text-pos-primary-text">{price}</div>
            </div>
            <button
              type="button"
              onClick={onFlip}
              tabIndex={isFlipped ? 0 : -1}
              aria-label={t("pos.catalog.flipBack")}
              title={t("pos.catalog.flipBack")}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-pos-border bg-pos-card text-pos-muted transition hover:text-pos-text"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {sizeVariants.length > 0 && (
            <div role="group" aria-label={t("pos.catalog.size")} className="flex flex-wrap items-center justify-center gap-1">
              {sizeVariants.map((entry) => {
                const selected = representativeLine?.productVariantId === entry.productVariantId;
                return (
                  <button
                    key={entry.productVariantId}
                    type="button"
                    disabled={disabled}
                    tabIndex={isFlipped ? 0 : -1}
                    aria-pressed={selected}
                    title={`${entry.variantName} · ${formatMoney(entry.price, currencyCode, 2)}`}
                    aria-label={entry.variantName}
                    onClick={() => onSelectSize(entry)}
                    className={`pos-num grid h-7 min-w-7 place-items-center rounded-full border px-1 text-[11px] font-bold transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? "border-pos-primary-strong bg-pos-primary-strong text-white"
                        : "border-pos-border bg-pos-card text-pos-muted hover:border-pos-primary hover:text-pos-primary-text"
                    }`}
                  >
                    {variantSizeLabel(entry.variantName)}
                  </button>
                );
              })}
            </div>
          )}

          {quantityInCart > 0 && representativeLine && (
            <div className="pos-chip-soft rounded-pos px-1.5 py-1">
              {representativeLine.modifiers.length > 0 && (
                <div className="mb-1 flex flex-wrap items-center gap-1">
                  {representativeLine.modifiers.map((modifier) => (
                    <span
                      key={modifier.modifierOptionId}
                      className="pos-chip pos-num rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    >
                      {abbreviateModifierLabel(modifier.modifierOptionName)}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-pos-muted">{t("pos.catalog.subtotal")}</span>
                <span className="pos-num font-bold text-pos-text">
                  {formatMoney(cartInfo.subtotal, currencyCode, 2)}
                </span>
              </div>
            </div>
          )}

          <StockLine variant={stockVariant} inventory={inventory} active={isFlipped} />

          <div className="mt-auto flex flex-col gap-1.5">
            <QtyStepper
              quantity={Number(representativeLine?.quantity ?? 0)}
              disabled={disabled}
              focusable={isFlipped}
              canDecrement={Boolean(representativeVariant)}
              onDecrement={decrement}
              onIncrement={increment}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stock level lights per level (getStockLevel): the lit one is filled in its colour and carries the
// stock number; the other two stay empty and dimmed.
const STOCK_LIGHT_CLASSES = {
  low: "border-pos-danger bg-pos-danger-tint text-pos-danger-text",
  half: "border-pos-warning bg-pos-warning-tint text-pos-warning-text",
  full: "border-pos-action bg-pos-action-tint text-pos-action-text",
};
const STOCK_LIGHT_DIM_CLASSES = {
  low: "border-pos-danger/30 text-pos-danger-text/40",
  half: "border-pos-warning/40 text-pos-warning-text/40",
  full: "border-pos-action/30 text-pos-action-text/40",
};

// Available units of one variant = the fewest units its linked stock items allow
// (floor(on hand / quantity per sales unit), at the branch's default inventory location), shown as
// three (red) (yellow) (green) lights -- only the light for the current level is on, with the
// number inside it. The variant's recipe is only fetched once its card is flipped. Hidden without
// Inventory.View.
function StockLine({ variant, inventory, active }) {
  const { t } = useI18n();
  const enabled = Boolean(inventory?.enabled && variant && active);
  const consumptionQuery = useProductVariantInventoryConsumption(
    inventory?.companyId,
    variant?.productVariantId,
    enabled,
  );

  if (!inventory?.enabled) return null;

  let content;
  if (consumptionQuery.isLoading || inventory.isLoading) {
    content = <span className="text-pos-muted">{t("pos.catalog.stockLoading")}</span>;
  } else if (consumptionQuery.isError || inventory.isError) {
    content = <span className="text-pos-muted">{t("pos.catalog.stockUnavailable")}</span>;
  } else {
    const components = consumptionQuery.data?.components ?? [];
    if (!components.length) {
      content = <span className="text-pos-muted">{t("pos.catalog.stockNotTracked")}</span>;
    } else {
      const available = Math.max(
        0,
        Math.min(
          ...components.map((component) => {
            const onHand = Number(inventory.stockByItemId.get(component.inventoryItemId) ?? 0);
            const perUnit = Number(component.quantityPerSalesUnit) || 0;
            return perUnit > 0 ? Math.floor(onHand / perUnit) : Infinity;
          }),
        ),
      );
      const level = getStockLevel(available);
      const levelLabel = t(`pos.catalog.stockLevel.${level}`);
      content = (
        <div
          role="img"
          aria-label={`${t("pos.catalog.stock")}: ${Number.isFinite(available) ? available : "∞"} · ${levelLabel}`}
          title={levelLabel}
          className="flex items-center justify-center gap-1"
        >
          {STOCK_LEVELS.map((entry) => {
            const lit = entry === level;
            return (
              <span
                key={entry}
                aria-hidden="true"
                className={`pos-num grid h-6 min-w-8 place-items-center rounded-full border-2 px-1 text-[10px] font-black transition-colors ${
                  lit ? STOCK_LIGHT_CLASSES[entry] : STOCK_LIGHT_DIM_CLASSES[entry]
                }`}
              >
                ({lit ? (Number.isFinite(available) ? available : "∞") : "  "})
              </span>
            );
          })}
        </div>
      );
    }
  }

  return <div className="pos-fs-label text-center">{content}</div>;
}

// Full-bleed product photo for the front face. The fallback icon and the real <img> are never
// both mounted at once.
function ProductPhoto({ imageUrl }) {
  const [failed, setFailed] = useState(false);
  // A SelfHosted-uploaded image is served by an authenticated API route, which a plain <img src>
  // cannot reach (no custom headers on image requests); this resolves it to a local blob URL first.
  // A Cloud (pasted-URL) image passes through unchanged.
  const { src: resolvedSrc, failed: resolveFailed } = useResolvedImageSrc(imageUrl);
  const showImage = Boolean(resolvedSrc) && !failed && !resolveFailed;

  return (
    <span className="pos-product-image pos-product-tint absolute inset-0 block">
      {showImage ? (
        <img
          src={resolvedSrc}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="pos-product-image-fallback pos-chip absolute inset-0 m-auto -translate-y-3 h-12 w-12">
          <Package size={24} />
        </span>
      )}
    </span>
  );
}

function QtyStepper({ quantity, disabled, focusable, canDecrement, onDecrement, onIncrement }) {
  const { t } = useI18n();

  return (
    <div className="flex h-9 items-center justify-between rounded-full border border-pos-border bg-pos-card p-0.5 shadow-sm">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || !canDecrement}
        tabIndex={focusable ? 0 : -1}
        aria-label={t("pos.catalog.decrement")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full text-pos-muted transition hover:bg-pos-bg hover:text-pos-text active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={15} />
      </button>
      <span className="pos-num flex-1 text-center text-base font-bold text-pos-text">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled}
        tabIndex={focusable ? 0 : -1}
        aria-label={t("pos.catalog.increment")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full bg-pos-primary-strong text-white shadow-sm transition hover:bg-pos-primary-strong-hover active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
