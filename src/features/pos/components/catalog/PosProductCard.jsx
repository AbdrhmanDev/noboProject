import { useEffect, useRef, useState } from "react";
import { Minus, Package, Plus, Ruler } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { useResolvedImageSrc } from "../../../../shared/hooks/useResolvedImageSrc";
import { abbreviateModifierLabel } from "../../utils/posFormatters";
import { useI18n } from "../../../../i18n/I18nContext";
import { sortVariantsBySize, variantSizeLabel } from "../../utils/posFormatters";

// Compact Odoo-style product card (15th pass): the 14th pass's single-face layout, with the
// front/back flip reintroduced from the 11th/12th pass (FlipSwap below -- same page-turn-style
// scaleX squeeze/release, never a 3D rotateY/backface-visibility transform, which needed each face
// to counter-rotate itself and was the actual cause of a face sometimes rendering mirrored).
//
// Exactly one product card is ever the ACTIVE (front-face) one at a time, driven by `isActive`
// (POSPage's `activeProductId`). Every OTHER product with a quantity in the cart shows its back-face
// summary instead. Tapping the back face reactivates the card (POSPage's `tapProduct`: tapping a
// product already in the cart just makes it active again, it never re-adds) -- so `onAddDefault`
// doubles as the back face's "Edit" action with no separate prop needed.
//
// Layout, top to bottom:
//  - image tile (--pos-card-img-h), with the in-cart quantity badge in one corner.
//  - a dedicated stepper row BELOW the image (never floating over it) once the product has a
//    quantity -- always reserved at a fixed height so a card never jumps size.
//  - product name (fixed 2-line box), then its price (the selected size's price once in the cart).
//  - size circles, one per real catalog variant in S / M / L order -- only for products with more
//    than one variant.
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
  const quantityInCart = cartInfo?.quantity ?? 0;
  const isFlipped = quantityInCart > 0 && !isActive;

  const representativeLine = cartInfo?.lines?.[cartInfo.lines.length - 1] ?? null;
  const representativeVariant = representativeLine
    ? product.variants.find((entry) => entry.productVariantId === representativeLine.productVariantId)
    : null;
  const representativeModifierOptionIds =
    representativeLine?.modifiers.map((modifier) => modifier.modifierOptionId) ?? [];
  const hasMultipleCombinations = (cartInfo?.lines?.length ?? 0) > 1;

  return (
    <div
      style={accentStyle}
      className={`pos-product-card group relative h-[var(--pos-card-h)] overflow-hidden rounded-pos-lg border bg-pos-card text-start ${
        isActive && quantityInCart > 0
          ? "border-pos-primary ring-1 ring-pos-primary"
          : quantityInCart > 0
            ? "border-pos-primary/60"
            : "border-pos-border"
      }`}
    >
      <FlipSwap
        isFlipped={isFlipped}
        front={
          <FrontFace
            product={product}
            currencyCode={currencyCode}
            disabled={disabled}
            quantityInCart={quantityInCart}
            onAddDefault={onAddDefault}
            onSelectSize={onSelectSize}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            representativeLine={representativeLine}
            representativeVariant={representativeVariant}
            representativeModifierOptionIds={representativeModifierOptionIds}
          />
        }
        back={
          <BackFace
            product={product}
            cartInfo={cartInfo}
            quantityInCart={quantityInCart}
            representativeLine={representativeLine}
            representativeVariant={representativeVariant}
            representativeModifierOptionIds={representativeModifierOptionIds}
            hasMultipleCombinations={hasMultipleCombinations}
            disabled={disabled}
            currencyCode={currencyCode}
            onActivate={onAddDefault}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        }
      />
    </div>
  );
}

// Front/back swap (12th pass, restored 15th pass): the leaving face squeezes to a thin sliver and
// fades (pos-card-exit) while the arriving face springs open from that sliver with a slight
// overshoot (pos-card-enter), both scaling along X only -- see pos-theme.css for the keyframes and
// the reasoning against a 3D transform. The "previous" face is kept mounted for exactly one
// exit-animation's duration after a swap (local state + a matching setTimeout) so there is something
// for pos-card-exit to actually play on -- a bare conditional swap can only animate the entering
// face, since the leaving one would be removed from the DOM in the same instant.
function FlipSwap({ isFlipped, front, back }) {
  const [displayedKey, setDisplayedKey] = useState(isFlipped ? "back" : "front");
  const [exitingKey, setExitingKey] = useState(null);
  const lastIsFlippedRef = useRef(isFlipped);
  const exitTimeoutRef = useRef(null);

  useEffect(() => {
    if (lastIsFlippedRef.current === isFlipped) return;
    lastIsFlippedRef.current = isFlipped;

    setDisplayedKey((current) => {
      setExitingKey(current);
      return isFlipped ? "back" : "front";
    });

    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    exitTimeoutRef.current = setTimeout(() => setExitingKey(null), 170);
  }, [isFlipped]);

  useEffect(
    () => () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    },
    [],
  );

  const content = { front, back };

  return (
    <div className="relative h-full">
      {exitingKey && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-[pos-card-exit_170ms_ease-in_forwards] motion-reduce:hidden"
        >
          {content[exitingKey]}
        </div>
      )}
      <div
        key={displayedKey}
        className="absolute inset-0 animate-[pos-card-enter_240ms_ease-out] motion-reduce:animate-none"
      >
        {content[displayedKey]}
      </div>
    </div>
  );
}

// Front face: image, a dedicated (always-reserved) stepper row below it, name, price, and the size
// row -- the 14th pass's content, just no longer floating the stepper over the image.
function FrontFace({
  product,
  currencyCode,
  disabled,
  quantityInCart,
  onAddDefault,
  onSelectSize,
  onIncrement,
  onDecrement,
  representativeLine,
  representativeVariant,
  representativeModifierOptionIds,
}) {
  const { t } = useI18n();
  const sizeVariants = product.variants.length > 1 ? sortVariantsBySize(product.variants) : [];
  const showStepper = quantityInCart > 0 && Boolean(representativeVariant);
  const displayPrice = representativeVariant?.price ?? product.startingPrice;

  return (
    <div className="flex h-full flex-col">
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

        {/* Reserved row, fixed height whether or not it holds a stepper, so no card ever changes
            height depending on cart state. Placed below the image (never over it). */}
        <div
          className="flex h-10 shrink-0 items-center justify-center px-1.5 pt-1"
          onClick={(event) => showStepper && event.stopPropagation()}
        >
          {showStepper && (
            <QtyStepper
              quantity={Number(representativeLine.quantity)}
              disabled={disabled}
              onDecrement={() => onDecrement(representativeVariant, representativeModifierOptionIds)}
              onIncrement={() => onIncrement(representativeVariant, representativeModifierOptionIds)}
            />
          )}
        </div>

        {/* Name (fixed 2-line box, so every card's price sits at the same height) + price. */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-between px-1.5 text-center">
          <div className="pos-fs-card-name line-clamp-2 h-[2.6em] w-full text-pos-text">{product.productName}</div>
          <div className="pos-num pos-fs-card-price text-pos-primary-text">
            {formatMoney(displayPrice, currencyCode, 2)}
          </div>
        </div>
      </button>

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

// Back face: the settled order summary for every product that isn't the currently active one.
// Tapping the summary area reactivates the card. The stepper row at the bottom adjusts the ONE
// exact line this summary shows (the most recently added variant + modifier combination) directly,
// without needing to reactivate first.
function BackFace({
  product,
  cartInfo,
  quantityInCart,
  representativeLine,
  representativeVariant,
  representativeModifierOptionIds,
  hasMultipleCombinations,
  disabled,
  currencyCode,
  onActivate,
  onIncrement,
  onDecrement,
}) {
  const { t } = useI18n();

  return (
    <div className="pos-chip-soft relative flex h-full w-full flex-col overflow-hidden text-start">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        data-roving-item=""
        onClick={() => !disabled && onActivate()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onActivate();
          }
        }}
        className={`relative flex min-h-0 flex-1 cursor-pointer flex-col justify-between p-2.5 ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="min-h-0">
          <div className="flex items-start gap-2">
            <span className="pos-chip pos-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm">
              {quantityInCart}×
            </span>
            <span className="pos-fs-name line-clamp-2 flex-1 pt-0.5 text-xs font-bold text-pos-text">
              {product.productName}
            </span>
          </div>
          {representativeLine?.variantName && representativeLine.variantName !== "Standard" && (
            <div className="pos-chip pos-num mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black">
              <Ruler size={11} />
              {representativeLine.variantName}
            </div>
          )}
          {representativeLine?.modifiers?.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {representativeLine.modifiers.map((modifier) => (
                <span
                  key={modifier.modifierOptionId}
                  className="pos-num rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-black shadow-sm"
                  style={{ color: "var(--brand-dark)" }}
                >
                  {abbreviateModifierLabel(modifier.modifierOptionName)}
                </span>
              ))}
              {hasMultipleCombinations && (
                <span className="text-[11px] font-bold text-pos-muted">+{cartInfo.lines.length - 1}</span>
              )}
            </div>
          )}
        </div>
        <div className="mt-2 flex shrink-0 items-center justify-between border-t border-white/40 pt-2">
          <span className="pos-num text-sm font-black text-pos-text">
            {formatMoney(cartInfo?.subtotal ?? 0, currencyCode, 2)}
          </span>
          <span className="pos-fs-label font-bold text-pos-muted">{t("pos.catalog.edit")}</span>
        </div>
      </div>

      {representativeVariant && (
        <div className="shrink-0 px-2.5 pb-2.5" onClick={(event) => event.stopPropagation()}>
          <QtyStepper
            quantity={Number(representativeLine.quantity)}
            disabled={disabled}
            onDecrement={() => onDecrement(representativeVariant, representativeModifierOptionIds)}
            onIncrement={() => onIncrement(representativeVariant, representativeModifierOptionIds)}
          />
        </div>
      )}
    </div>
  );
}

// Product image: the fallback icon and the real <img> are never both mounted at once. object-contain
// on a white tile (Odoo style) so the whole product is always visible.
function ProductImage({ imageUrl, className = "", iconSize = 22, children }) {
  const [failed, setFailed] = useState(false);
  // A SelfHosted-uploaded image is served by an authenticated API route, which a plain <img src>
  // cannot reach (no custom headers on image requests); this resolves it to a local blob URL first.
  // A Cloud (pasted-URL) image passes through unchanged.
  const { src: resolvedSrc, failed: resolveFailed } = useResolvedImageSrc(imageUrl);
  const showImage = Boolean(resolvedSrc) && !failed && !resolveFailed;

  return (
    <div className={`pos-product-image pos-product-tint relative w-full overflow-hidden ${className}`}>
      {showImage ? (
        <img
          src={resolvedSrc}
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
    <div className="flex h-10 items-center justify-between rounded-full border border-pos-border bg-pos-card/95 p-0.5 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled}
        aria-label={t("pos.catalog.decrement")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full text-pos-muted transition hover:bg-pos-bg hover:text-pos-text active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Minus size={18} />
      </button>
      <span className="pos-num flex-1 text-center text-base font-bold text-pos-text">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled}
        aria-label={t("pos.catalog.increment")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full bg-pos-primary-strong text-white shadow-sm transition hover:bg-pos-primary-strong-hover active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
