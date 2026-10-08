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

// Flip card (16th pass). Two faces in a real 3D flip (.pos-flip in pos-theme.css):
//  - FRONT: the product photo filling the whole card, its price in the top-right corner, the name
//    on a scrim along the bottom, and the in-cart quantity in the top-left -- a single number for
//    one variant, or a small stacked "size×qty" breakdown once more than one size is in the cart
//    (`variantBreakdown`), so flipping back to this face (e.g. because another card was opened)
//    still shows exactly what was ordered. Tapping it ONLY flips the card (`onFlip`) -- nothing is
//    added to the order.
//  - BACK (multi-variant products): one compact [-] qty [+] row PER size (`VariantQuantityRow`),
//    so "2 Medium + 1 Small" of the same product is two taps on two rows, not a flip-select-flip-
//    select dance through a single shared stepper. Each row's +/- targets that exact variant with
//    no modifiers (`onIncrement`/`onDecrement`), same simplification the old single-size-at-a-time
//    circle picker already made. (Single-variant products keep the one shared QtyStepper below --
//    there's only one size, nothing to pick.)
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

  // Quantity shown on a size row: every cart line for that exact variant, regardless of modifiers
  // (mirrors the old circle picker, which also never distinguished by modifiers).
  const quantityForVariant = (variantId) =>
    (cartInfo?.lines ?? [])
      .filter((line) => line.productVariantId === variantId)
      .reduce((sum, line) => sum + Number(line.quantity), 0);

  // Per-variant breakdown for the FRONT face's badge: when another card is flipped open, this one
  // flips back to its front automatically (CatalogPanel only keeps one flipped at a time) -- without
  // this, the only thing left visible would be the plain total count, with no way to tell "2
  // Medium + 1 Small" apart from "3 of whatever size I last touched".
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
          {variantBreakdown.length === 1 && (
            <span className="pos-num absolute left-1.5 top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-pos-primary-strong px-1.5 text-[11px] font-bold text-white shadow-sm">
              {variantBreakdown[0].qty}
            </span>
          )}
          {variantBreakdown.length > 1 && (
            <div className="absolute left-1.5 top-1.5 flex max-w-[80%] flex-col items-start gap-0.5">
              {variantBreakdown.map(({ variant, qty }) => (
                <span
                  key={variant.productVariantId}
                  className="flex max-w-full items-center gap-1 rounded-pos bg-pos-primary-strong px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                >
                  <span className="min-w-0 break-words">{variant.variantName}</span>
                  <span className="pos-num shrink-0">×{qty}</span>
                </span>
              ))}
            </div>
          )}
          <span className="pos-photo-scrim absolute inset-x-0 bottom-0 px-2 pb-1.5 pt-6">
            <span className="pos-fs-card-name line-clamp-2 text-pos-text">{product.productName}</span>
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
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-pos-border bg-pos-card text-pos-muted transition hover:text-pos-text"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {sizeVariants.length > 0 && (
            <div role="group" aria-label={t("pos.catalog.size")} className="flex flex-col gap-1">
              {sizeVariants.map((entry) => (
                <VariantQuantityRow
                  key={entry.productVariantId}
                  variant={entry}
                  quantity={quantityForVariant(entry.productVariantId)}
                  currencyCode={currencyCode}
                  disabled={disabled}
                  focusable={isFlipped}
                  onIncrement={() => onIncrement(entry, [])}
                  onDecrement={() => onDecrement(entry, [])}
                />
              ))}
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

          {sizeVariants.length === 0 && (
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
          )}
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
    <div className="flex h-11 items-center justify-between rounded-full border border-pos-border bg-pos-card p-0.5 shadow-sm">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || !canDecrement}
        tabIndex={focusable ? 0 : -1}
        aria-label={t("pos.catalog.decrement")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full text-pos-muted transition hover:bg-pos-bg hover:text-pos-text active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
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
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full bg-pos-primary-strong text-white shadow-sm transition hover:bg-pos-primary-strong-hover active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={17} />
      </button>
    </div>
  );
}

// One size's own [-] qty [+] row (multi-variant products): the full variant name on its own line
// (wraps up to 2 lines instead of truncating -- a one-line layout left so little horizontal room
// for the name next to the price/stepper that most real names got cut off), price + a compact
// stepper on the line below. "2 Medium + 1 Small" is one tap on the Medium row's "+" twice and the
// Small row's "+" once, no flip-select-flip-select round trip through a single shared stepper.
function VariantQuantityRow({ variant, quantity, currencyCode, disabled, focusable, onIncrement, onDecrement }) {
  const { t } = useI18n();
  const hasQuantity = quantity > 0;

  return (
    <div
      className={`flex flex-col gap-0.5 rounded-pos border px-1.5 py-1 transition ${
        hasQuantity ? "border-pos-primary-strong bg-pos-primary-strong/10" : "border-pos-border bg-pos-card"
      }`}
    >
      <span className="line-clamp-2 text-xs font-bold leading-tight text-pos-text">{variant.variantName}</span>
      <div className="flex items-center justify-between gap-1">
        <span className="pos-num shrink-0 text-[10px] text-pos-muted">{formatMoney(variant.price, currencyCode, 2)}</span>
        <div className="flex shrink-0 items-center gap-1">
          {/* "-" and the qty number stay mounted (just hidden) even at 0: toggling them in/out of
              the DOM changed this row's width every time and shoved the rest of the line around. */}
          <button
            type="button"
            onClick={onDecrement}
            disabled={disabled || !hasQuantity}
            tabIndex={focusable && hasQuantity ? 0 : -1}
            aria-hidden={!hasQuantity}
            aria-label={t("pos.catalog.decrement")}
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-pos-muted transition hover:bg-pos-bg hover:text-pos-text active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
              hasQuantity ? "" : "invisible"
            }`}
          >
            <Minus size={13} />
          </button>
          <span
            className={`pos-num w-4 shrink-0 text-center text-xs font-black text-pos-text ${hasQuantity ? "" : "invisible"}`}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            disabled={disabled}
            tabIndex={focusable ? 0 : -1}
            aria-label={t("pos.catalog.increment")}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-pos-primary-strong text-white shadow-sm transition hover:bg-pos-primary-strong-hover active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
