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

// Three-band card: name on top, a flipping middle, price at the bottom. Only the middle turns over
// (.pos-flip in pos-theme.css):
//  - FRONT: the product photo, with the in-cart quantity in its corner -- a single number for one
//    variant, or a small stacked "size×qty" breakdown once more than one size is in the cart.
//  - BACK: the stock lights (StockLine) and the quantity controls. Multi-variant products get the
//    S / M / L size circles (`SizeCircles`): tapping one picks the size the [-] qty [+] stepper below
//    works on, and each circle carries its own in-cart count -- so several sizes of the same
//    product can still be ordered from the card ("2 S + 1 L", each its own cart line). Single-
//    variant products keep the one shared stepper (or the "weigh" button for a ByWeight product).
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
  // The size the circles' stepper works on: the one picked, else the size last put in the cart,
  // else the first (smallest) size.
  const [pickedSizeId, setPickedSizeId] = useState(null);

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
            <div className="flex items-center justify-end">
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
              <SizeCircles
                sizes={sizeVariants}
                activeSize={
                  sizeVariants.find((entry) => entry.productVariantId === pickedSizeId) ??
                  sizeVariants.find((entry) => entry.productVariantId === representativeVariant?.productVariantId) ??
                  sizeVariants[0]
                }
                quantityOf={(entry) => quantityForVariant(entry.productVariantId)}
                currencyCode={currencyCode}
                inventory={inventory}
                disabled={disabled}
                focusable={isFlipped}
                onPick={(entry) => setPickedSizeId(entry.productVariantId)}
                onIncrement={(entry) => {
                  const line = lineForVariant(entry.productVariantId);
                  // Not in the cart yet -> null, so POSPage fills in required modifier defaults.
                  onIncrement(entry, line ? modifierIdsOf(line) : null);
                }}
                onDecrement={(entry) => {
                  const line = lineForVariant(entry.productVariantId);
                  if (line) onDecrement(entry, modifierIdsOf(line));
                }}
              />
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
              <div className="mt-auto flex flex-col gap-2">
                <StockLine variant={stockVariant} inventory={inventory} active={isFlipped} />
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


// Stock level lights per level (getStockLevel): plain "(n)" parentheses, no box. The lit one shows
// the stock number in its colour with a soft glow (green = plenty, yellow = running low, red = 5 or
// fewer); the other two stay as faint empty "( )".
// text = the theme's readable ink for that colour (darker in light mode), glow = the colour itself.
const STOCK_LIGHT_COLOR = {
  low: { text: "var(--pos-danger-text)", glow: "var(--pos-danger)" },
  half: { text: "var(--pos-warning-text)", glow: "var(--pos-warning)" },
  full: { text: "var(--pos-action-text)", glow: "var(--pos-action)" },
};

// Available units of one variant = the fewest units its linked stock items allow
// (floor(on hand / quantity per sales unit), at the branch's default inventory location), shown as
// three "( )" lights in red / yellow / green -- only the one for the current level is lit, with the
// number inside it. The variant's recipe is only fetched once its card is flipped. The three
// parentheses are always drawn: a variant with no linked stock item counts as 0 (red "(0)"), and
// while loading / on a load error / without inventory access all three stay dim. The reason is in
// the tooltip, never as text on the card.
function StockLine({ variant, inventory, active }) {
  const { t } = useI18n();
  const enabled = Boolean(inventory?.enabled && variant && active);
  const consumptionQuery = useProductVariantInventoryConsumption(
    inventory?.companyId,
    variant?.productVariantId,
    enabled,
  );

  let available = null; // null = nothing lit
  let hint;
  if (!inventory?.enabled) {
    hint = t("pos.catalog.stockUnavailable");
  } else if (consumptionQuery.isLoading || inventory.isLoading) {
    hint = t("pos.catalog.stockLoading");
  } else if (consumptionQuery.isError || inventory.isError) {
    hint = t("pos.catalog.stockUnavailable");
  } else {
    const components = consumptionQuery.data?.components ?? [];
    if (!components.length) {
      available = 0;
      hint = t("pos.catalog.stockNotTracked");
    } else {
      available = Math.max(
        0,
        Math.min(
          ...components.map((component) => {
            const onHand = Number(inventory.stockByItemId.get(component.inventoryItemId) ?? 0);
            const perUnit = Number(component.quantityPerSalesUnit) || 0;
            return perUnit > 0 ? Math.floor(onHand / perUnit) : Infinity;
          }),
        ),
      );
    }
  }

  const level = available === null ? null : getStockLevel(available);
  const levelLabel = level ? t(`pos.catalog.stockLevel.${level}`) : null;
  const shown = available === null ? "" : Number.isFinite(available) ? available : "∞";

  return (
    <div
      role="img"
      aria-label={`${t("pos.catalog.stock")}: ${shown === "" ? hint : `${shown} · ${levelLabel}`}`}
      title={[hint, levelLabel].filter(Boolean).join(" · ")}
      className="pos-fs-label flex items-center justify-center gap-3"
    >
      {STOCK_LEVELS.map((entry) => {
        const lit = entry === level;
        const { text, glow } = STOCK_LIGHT_COLOR[entry];
        return (
          <span
            key={entry}
            aria-hidden="true"
            className={`pos-num whitespace-pre text-lg leading-none font-black transition-colors ${lit ? "" : "opacity-35"}`}
            style={{
              color: text,
              textShadow: lit ? `0 0 8px ${glow}, 0 0 16px color-mix(in srgb, ${glow} 55%, transparent)` : "none",
            }}
          >
            ({lit ? shown : "  "})
          </span>
        );
      })}
    </div>
  );
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

// Size circles (multi-variant products), S / M / L order (sortVariantsBySize), labelled by
// variantSizeLabel, under the picked size's stock (StockLine). Tapping a circle picks it (filled);
// the stock above and the [-] qty [+] below act on the picked size only, and every circle shows its own in-cart count as a small badge. A picked ByWeight size gets
// a single "weigh" button instead of the stepper (a weight isn't a count); it opens the
// weight-entry dialog for a new line.
function SizeCircles({ sizes, activeSize, quantityOf, currencyCode, inventory, disabled, focusable, onPick, onIncrement, onDecrement }) {
  const { t } = useI18n();
  const activeQuantity = quantityOf(activeSize);

  return (
    <div role="group" aria-label={t("pos.catalog.size")} className="my-auto flex flex-col items-center gap-3">
      {/* Stock first, above the size circles and the stepper. */}
      <StockLine variant={activeSize} inventory={inventory} active={focusable} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {sizes.map((entry) => {
          const picked = entry.productVariantId === activeSize.productVariantId;
          const count = quantityOf(entry);
          return (
            <button
              key={entry.productVariantId}
              type="button"
              onClick={() => onPick(entry)}
              disabled={disabled}
              tabIndex={focusable ? 0 : -1}
              aria-pressed={picked}
              aria-label={`${entry.variantName}${count ? ` ×${count}` : ""}`}
              title={`${entry.variantName} · ${formatMoney(entry.price, currencyCode, 2)}`}
              className={`pos-num relative grid h-10 min-w-10 place-items-center rounded-full px-1.5 text-sm font-black transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                picked ? "bg-pos-primary-strong text-white shadow-sm" : "bg-pos-bg text-pos-text"
              }`}
            >
              {variantSizeLabel(entry.variantName)}
              {count > 0 && (
                <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-pos-action px-1 text-[10px] font-black text-pos-on-action shadow-sm">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="w-full">
        {activeSize.sellingMode === "ByWeight" ? (
          <button
            type="button"
            onClick={() => onIncrement(activeSize)}
            disabled={disabled}
            tabIndex={focusable ? 0 : -1}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-pos-primary-strong text-sm font-bold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={15} />
            {t("pos.catalog.weigh")}
          </button>
        ) : (
          <QtyStepper
            quantity={activeQuantity}
            disabled={disabled}
            focusable={focusable}
            canDecrement={activeQuantity > 0}
            onDecrement={() => onDecrement(activeSize)}
            onIncrement={() => onIncrement(activeSize)}
          />
        )}
      </div>
    </div>
  );
}
