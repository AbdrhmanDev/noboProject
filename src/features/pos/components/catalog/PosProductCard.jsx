import { useState } from "react";
import { Minus, Package, Plus } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { useI18n } from "../../../../i18n/I18nContext";
import { sortVariantsBySize, variantSizeLabel } from "../../utils/posFormatters";

// Compact Odoo-style product card (14th pass). One face only -- no flip, no picker: tapping the card
// always adds the product directly (POSPage's `addItem`, which no longer opens the Variant/Modifiers
// dialog). Layout, top to bottom:
//  - image tile (--pos-card-img-h), with the in-cart quantity in one corner; once the product has a
//    quantity, an inline [-] qty [+] stepper floats over the bottom of the image. It adjusts the
//    most recently added variant + modifier combination
//    (`representativeVariant`/`representativeModifierOptionIds`) through the same
//    onIncrement/onDecrement handlers as before.
//  - product name (fixed 2-line box), then its price (the selected size's price once in the cart).
//  - size circles, one per real catalog variant in S / M / L order (sortVariantsBySize), labelled
//    S / M / L when the variant is named for a size (variantSizeLabel) -- only for products with
//    more than one variant. ONE size at a time: the highlighted circle is the size of the product's
//    most recently added line; tapping it again removes that line, tapping another size switches
//    the line to it (POSPage's selectProductSize via `onSelectSize`). Quantity changes only
//    through the +/- stepper. Extras (modifiers) are picked inline on the cart line itself.

export function PosProductCard({
  product,
  cartInfo,
  isActive,
  disabled,
  accentStyle,
  currencyCode,
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
  const showStepper = quantityInCart > 0 && Boolean(representativeVariant);
  // Price badge follows the selected size once there is one; otherwise the product's lowest price.
  const displayPrice = representativeVariant?.price ?? product.startingPrice;

  return (
    <div
      style={accentStyle}
      className={`pos-product-card group relative flex h-[var(--pos-card-h)] flex-col overflow-hidden rounded-pos-lg border bg-pos-card text-start ${
        isActive && quantityInCart > 0
          ? "border-pos-primary ring-1 ring-pos-primary"
          : quantityInCart > 0
            ? "border-pos-primary/60"
            : "border-pos-border"
      }`}
    >
      <button
        type="button"
        onClick={onAddDefault}
        disabled={disabled}
        data-roving-item=""
        className="flex min-h-0 w-full flex-1 flex-col text-start disabled:opacity-50"
      >
        <ProductImage imageUrl={product.imageUrl} className="h-[var(--pos-card-img-h)] shrink-0" iconSize={18}>
          {quantityInCart > 0 && (
            <span className="pos-num absolute start-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-pos-primary-strong px-1 text-[11px] font-bold text-white shadow-sm">
              {quantityInCart}
            </span>
          )}
        </ProductImage>
        {/* Name (fixed 2-line box, so every card's price sits at the same height) + price. */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-between px-1.5 pt-1 text-center">
          <div className="pos-fs-card-name line-clamp-2 h-[2.6em] w-full text-pos-text">{product.productName}</div>
          <div className="pos-num pos-fs-card-price text-pos-primary-text">
            {formatMoney(displayPrice, currencyCode, 2)}
          </div>
        </div>
      </button>

      {/* Stepper floats over the bottom edge of the image tile, so it never changes the card's
          fixed height. Rendered outside the add <button> -- buttons can't nest. */}
      {showStepper && (
        <div className="absolute inset-x-1 top-[calc(var(--pos-card-img-h)-2.25rem)]">
          <QtyStepper
            quantity={Number(representativeLine.quantity)}
            disabled={disabled}
            onDecrement={() => onDecrement(representativeVariant, representativeModifierOptionIds)}
            onIncrement={() => onIncrement(representativeVariant, representativeModifierOptionIds)}
          />
        </div>
      )}

      {/* Same reserved height whether or not the product has variant circles, so every card in the
          grid stays identical. */}
      <div
        role="group"
        aria-label={t("pos.catalog.size")}
        className="flex h-9 shrink-0 items-center justify-center-safe gap-1 overflow-x-auto px-1.5 pb-1.5 pt-1 scrollbar-none"
      >
        {sizeVariants.map((entry) => {
            const selected = representativeLine?.productVariantId === entry.productVariantId;
            return (
              <button
                key={entry.productVariantId}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                title={`${entry.variantName} · ${formatMoney(entry.price, currencyCode, 2)}`}
                aria-label={entry.variantName}
                onClick={() => onSelectSize(entry)}
                className={`pos-num grid h-6 min-w-6 place-items-center rounded-full border px-1 text-[10px] font-bold transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${
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
    </div>
  );
}

// Product image: the fallback icon and the real <img> are never both mounted at once. object-contain
// on a white tile (Odoo style) so the whole product is always visible.
function ProductImage({ imageUrl, className = "", iconSize = 22, children }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className={`pos-product-image pos-product-tint relative w-full overflow-hidden ${className}`}>
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="pos-product-image-fallback pos-chip absolute inset-0 m-auto h-9 w-9">
          <Package size={iconSize} />
        </span>
      )}
      {children}
    </div>
  );
}

function QtyStepper({ quantity, disabled, onDecrement, onIncrement }) {
  const { t } = useI18n();

  return (
    <div className="flex h-8 items-center justify-between rounded-full border border-pos-border bg-pos-card/95 p-0.5 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled}
        aria-label={t("pos.catalog.decrement")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full text-pos-muted transition hover:bg-pos-bg hover:text-pos-text active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Minus size={14} />
      </button>
      <span className="pos-num flex-1 text-center text-sm font-bold text-pos-text">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled}
        aria-label={t("pos.catalog.increment")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full bg-pos-primary-strong text-white shadow-sm transition hover:bg-pos-primary-strong-hover active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
