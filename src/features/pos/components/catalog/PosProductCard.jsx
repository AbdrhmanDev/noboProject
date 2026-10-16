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
} from "../../utils/posFormatters";

// Three-band card: name on top, a flipping middle, price at the bottom. Only the middle turns over
// (.pos-flip in pos-theme.css):
//  - FRONT: the product photo, with the in-cart quantity in its corner -- a single number for one
//    variant, or a small stacked "size×qty" breakdown once more than one size is in the cart.
//  - BACK: the stock lights (StockLine) and the quantity controls -- one "name [-] qty [+]" row PER
//    size (`VariantQuantityRow`) for multi-variant products, so several sizes of the same product
//    can be ordered from the card ("2 Medium + 1 Small"); else the one shared QtyStepper (or the
//    "weigh" button for a ByWeight product).
// Turning the middle over ALSO adds one unit (`increment`: the size last put in the cart, else the
// default one; a ByWeight product opens the weight-entry dialog instead). Turning it back adds
// nothing. Tapping the name/price bands does the same as tapping the middle. Only one card is
// flipped at a time (CatalogPanel owns `isFlipped`).
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

  // Front -> back: flip AND add one. Back -> front: just flip back.
  const toggleFlip = () => {
    if (disabled) return;
    onFlip();
    if (!isFlipped) increment();
  };

  // A size row's +/- act on the latest cart line of that size, with that line's own modifiers (a
  // size with required modifier groups never has an empty modifier set once it's in the cart).
  const lineForVariant = (variantId) =>
    [...(cartInfo?.lines ?? [])].reverse().find((line) => line.productVariantId === variantId) ?? null;
  const modifierIdsOf = (line) => line.modifiers.map((modifier) => modifier.modifierOptionId);

  // Quantity shown on a size row: every cart line for that exact variant, regardless of modifiers.
  const quantityForVariant = (variantId) =>
    (cartInfo?.lines ?? [])
      .filter((line) => line.productVariantId === variantId)
      .reduce((sum, line) => sum + Number(line.quantity), 0);

  // Per-variant breakdown for the photo's badge, so "2 Medium + 1 Small" stays readable instead of
  // collapsing into a plain total once the card turns back to its photo.
  const variantQuantities = new Map();
  for (const line of cartInfo?.lines ?? []) {
    variantQuantities.set(line.productVariantId, (variantQuantities.get(line.productVariantId) ?? 0) + Number(line.quantity));
  }
  const variantBreakdown = [...variantQuantities.entries()]
    .map(([variantId, qty]) => {
      const variant = product.variants.find((entry) => entry.productVariantId === variantId);
      return variant && qty > 0 ? { variant, qty } : null;
    })
    .filter(Boolean);

  const bandClassName = `shrink-0 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`;

  return (
    <div
      style={accentStyle}
      className={`pos-product-card flex h-[var(--pos-card-h)] flex-col overflow-hidden rounded-pos-lg border bg-pos-card ${
        disabled ? "opacity-50" : ""
      } ${isActive && quantityInCart > 0 ? "border-2 border-pos-primary" : "border-pos-border"}`}
    >
      {/* TOP: name */}
      <div
        onClick={toggleFlip}
        className={`${bandClassName} flex h-14 items-center justify-center border-b border-pos-border px-2 py-1.5 text-center`}
      >
        <span className="pos-fs-card-name line-clamp-2 text-center text-pos-text">{product.productName}</span>
      </div>

      {/* MIDDLE: the only part that flips */}
      <div data-flipped={isFlipped ? "true" : "false"} className="pos-flip relative min-h-0 flex-1">
        <div className="pos-flip-inner">
          {/* FRONT: photo */}
          <button
            type="button"
            onClick={toggleFlip}
            disabled={disabled}
            data-roving-item=""
            aria-label={`${product.productName} · ${price}`}
            aria-expanded={isFlipped}
            tabIndex={isFlipped ? -1 : 0}
            className="pos-flip-face overflow-hidden text-start"
          >
            <ProductPhoto imageUrl={product.imageUrl} />
            {variantBreakdown.length === 1 && (
              <span className="pos-num absolute left-1.5 top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-pos-primary-strong px-1.5 text-[11px] font-bold text-white shadow-sm">
                {variantBreakdown[0].qty}
              </span>
            )}
            {variantBreakdown.length > 1 && (
              <span className="absolute  flex max-w-[80%] flex-col items-start gap-0.5">
                {variantBreakdown.map(({ variant, qty }) => (
                  <span
                    key={variant.productVariantId}
                    className="flex max-w-full items-center gap-1 rounded-pos bg-pos-primary-strong px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                  >
                    <span className="min-w-0 break-words">{variant.variantName}</span>
                    <span className="pos-num shrink-0">×{qty}</span>
                  </span>
                ))}
              </span>
            )}
          </button>

          {/* BACK: stock lights + quantity controls */}
          <div
            aria-hidden={!isFlipped}
            className="pos-flip-face pos-flip-back flex flex-col gap-1.5 overflow-y-auto bg-pos-card p-2"
          >
            <div className="flex items-center gap-1">
              <div className="min-w-0 flex-1">
                <StockLine variant={stockVariant} inventory={inventory} active={isFlipped} />
              </div>
              <button
                type="button"
                onClick={toggleFlip}
                tabIndex={isFlipped ? 0 : -1}
                aria-label={t("pos.catalog.flipBack")}
                title={t("pos.catalog.flipBack")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-pos-border bg-pos-card text-pos-muted transition"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {sizeVariants.length > 0 && (
              <div role="group" aria-label={t("pos.catalog.size")} className="my-auto flex flex-col gap-1">
                {sizeVariants.map((entry) => (
                  <VariantQuantityRow
                    key={entry.productVariantId}
                    variant={entry}
                    quantity={quantityForVariant(entry.productVariantId)}
                    disabled={disabled}
                    focusable={isFlipped}
                    onIncrement={() => {
                      const line = lineForVariant(entry.productVariantId);
                      // Not in the cart yet -> null, so POSPage fills in required modifier defaults.
                      onIncrement(entry, line ? modifierIdsOf(line) : null);
                    }}
                    onDecrement={() => {
                      const line = lineForVariant(entry.productVariantId);
                      if (line) onDecrement(entry, modifierIdsOf(line));
                    }}
                  />
                ))}
              </div>
            )}

            {quantityInCart > 0 && representativeLine?.modifiers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
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

            {sizeVariants.length === 0 && (
              <div className="mt-auto flex flex-col gap-1.5">
                {product.variants[0]?.sellingMode === "ByWeight" ? (
                  // Single-variant ByWeight product: no stepper at all -- tapping always opens the
                  // weight-entry dialog for a brand new line (addSellableVariant's interception).
                  <button
                    type="button"
                    onClick={increment}
                    disabled={disabled}
                    tabIndex={isFlipped ? 0 : -1}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-pos-primary-strong text-sm font-bold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={15} />
                    {t("pos.catalog.weigh")}
                  </button>
                ) : (
                  <QtyStepper
                    quantity={Number(representativeLine?.quantity ?? 0)}
                    disabled={disabled}
                    focusable={isFlipped}
                    canDecrement={Boolean(representativeVariant)}
                    onDecrement={decrement}
                    onIncrement={increment}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM: price */}
      <div
        onClick={toggleFlip}
        className={`${bandClassName} pos-num pos-fs-card-price border-t border-pos-border px-2 py-2 text-center font-bold text-pos-primary-text`}
      >
        {price}
      </div>
    </div>
  );
}


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
          // Always red -> yellow -> green from left to right, like a real signal, in RTL too.
          dir="ltr"
          className="flex items-center justify-center gap-1.5"
        >
          {/* LED lamps (.pos-led in pos-theme.css): only the current level is lit, with the stock
              number in its centre; the other two stay dark and empty. */}
          {STOCK_LEVELS.map((entry) => {
            const lit = entry === level;
            return (
              <span
                key={entry}
                aria-hidden="true"
                data-lit={lit ? "true" : "false"}
                className={`pos-led pos-led-${entry} pos-num`}
              >
                {lit ? (Number.isFinite(available) ? available : "∞") : ""}
              </span>
            );
          })}
        </div>
      );
    }
  }

  return <div className="pos-fs-label text-center">{content}</div>;
}

// Product photo filling the middle band's front face. The fallback icon and the real <img> are never
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
        <span className="pos-product-image-fallback pos-chip absolute inset-0 m-auto h-12 w-12">
          <Package size={24} />
        </span>
      )}
    </span>
  );
}

function QtyStepper({ quantity, disabled, focusable, canDecrement, onDecrement, onIncrement }) {
  const { t } = useI18n();

  return (
    <div className="flex h-11 items-center justify-between rounded-full border border-pos-border bg-pos-card p-0.5 shadow-sm">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || !canDecrement}
        tabIndex={focusable ? 0 : -1}
        aria-label={t("pos.catalog.decrement")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full text-pos-muted transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={17} />
      </button>
      <span className="pos-num flex-1 text-center text-base font-bold text-pos-text">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled}
        tabIndex={focusable ? 0 : -1}
        aria-label={t("pos.catalog.increment")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full bg-pos-primary-strong text-white shadow-sm transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={17} />
      </button>
    </div>
  );
}

// One size's row (multi-variant products): the size name with its own [-] qty [+] beside it, each
// targeting that exact size with no modifiers -- so "2 Medium + 1 Small" is just taps on two rows,
// every size its own cart line. "-" and the number stay mounted (only hidden) at 0 so the row never
// changes width. A ByWeight size gets a single "weigh" button instead (a weight isn't a count to
// step down); it opens the weight-entry dialog for a new line. No price: the bottom band shows it.
function VariantQuantityRow({ variant, quantity, disabled, focusable, onIncrement, onDecrement }) {
  const { t } = useI18n();
  const hasQuantity = quantity > 0;
  const isByWeight = variant.sellingMode === "ByWeight";
  const stepButton =
    "grid h-6 w-6 shrink-0 place-items-center rounded-full transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex min-h-8 items-center gap-1.5 rounded-pos border border-pos-border bg-pos-card px-1.5 py-1 transition">
      <span className="line-clamp-2 min-w-0 flex-1 text-[11px] font-bold leading-tight text-pos-text">{variant.variantName}</span>
      {isByWeight ? (
        <button
          type="button"
          onClick={onIncrement}
          disabled={disabled}
          tabIndex={focusable ? 0 : -1}
          aria-label={`${t("pos.catalog.weigh")} · ${variant.variantName}`}
          className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-pos-primary-strong px-2 text-[10px] font-bold text-white shadow-sm transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={11} />
          {t("pos.catalog.weigh")}
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onDecrement}
            disabled={disabled || !hasQuantity}
            tabIndex={focusable && hasQuantity ? 0 : -1}
            aria-hidden={!hasQuantity}
            aria-label={`${t("pos.catalog.decrement")} · ${variant.variantName}`}
            className={`${stepButton} border border-pos-border text-pos-muted ${hasQuantity ? "" : "invisible"}`}
          >
            <Minus size={12} />
          </button>
          <span className={`pos-num w-4 shrink-0 text-center text-[11px] font-black text-pos-text ${hasQuantity ? "" : "invisible"}`}>
            {quantity}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            disabled={disabled}
            tabIndex={focusable ? 0 : -1}
            aria-label={`${t("pos.catalog.increment")} · ${variant.variantName}`}
            className={`${stepButton} bg-pos-primary-strong text-white shadow-sm`}
          >
            <Plus size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
