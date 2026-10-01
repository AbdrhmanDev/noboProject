import { useEffect, useRef, useState } from "react";
import { Minus, Package, Plus, Ruler, SlidersHorizontal } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { abbreviateModifierLabel } from "../../utils/posFormatters";
import { useI18n } from "../../../../i18n/I18nContext";

// Touch-first POS redesign (11th pass). Exactly one product card is ever the ACTIVE (front-face) one
// at a time, driven by `isActive` (POSPage's `activeProductId`, set by every successful add via
// addSellableVariant). Every OTHER product with a quantity in the cart shows its back-face summary
// instead -- this applies to every product, simple or not; the flip is part of the interaction
// model, not special-cased to "ambiguous" ones.
//
// Front-face behavior depends on how unambiguous the product is (never invented, derived from the
// same real catalog data every time):
//  - one variant, no modifiers: tapping the card adds/increments it directly.
//  - one variant, exactly one modifier group ("quick modifier"): same tap-to-add front face, plus
//    short chip shortcuts (abbreviated from the real modifier option names) that add with one option
//    pre-selected in a single tap -- bypassing the picker only for this unambiguous single-group case.
//  - anything else (multiple variants, and/or more than one modifier group): tapping the card opens
//    the Variant/Modifiers picker (POSPage's `addItem`/`selectVariantForDraft`, rendered by
//    OrderDialogs) -- genuinely ambiguous enough that a guided picker is the honest UI, not a guess.
//
// Once a product is active AND has any quantity, an inline [-] qty [+] stepper appears regardless of
// which of those three cases it is -- it always adjusts the most recently added variant + modifier
// combination (`representativeVariant`/`representativeModifierOptionIds`), the exact same one the
// back face summarizes. This used to be simple-products-only, which meant a product with variants or
// modifiers had NO inline +/- at all while it was still the active card.
//
// The back face is reactivatable (`onActivate`): tapping it (or its "Edit" affordance) brings the
// card back to the front; its own stepper (the same representative-combination one) lets quantity be
// adjusted without reactivating at all.
export function PosProductCard({
  product,
  variant,
  quickModifierGroup,
  cartInfo,
  isActive,
  disabled,
  accentStyle,
  currencyCode,
  onAddDefault,
  onIncrement,
  onDecrement,
  onActivate,
}) {
  const hasModifiers = product.variants.some((entry) => entry.modifierGroups?.length);
  const quantityInCart = cartInfo?.quantity ?? 0;
  const isFlipped = quantityInCart > 0 && !isActive;
  const isActiveWithQuantity = isActive && quantityInCart > 0;

  // The most recently added variant + modifier-option combination -- shown (and, while this card is
  // the active one, directly adjustable) rather than merging several distinct combinations into one
  // misleading summary. Used by BOTH the active front-face stepper and the back-face summary, so a
  // product with variants/modifiers gets the SAME inline +/- a simple product always had -- not just
  // once it's flipped away, which was the real gap: right after adding it, while still active, there
  // was no stepper anywhere for it at all.
  const representativeLine = cartInfo?.lines?.[cartInfo.lines.length - 1] ?? null;
  const representativeVariant = representativeLine
    ? product.variants.find((entry) => entry.productVariantId === representativeLine.productVariantId)
    : null;
  const representativeModifierOptionIds =
    representativeLine?.modifiers.map((modifier) => modifier.modifierOptionId) ?? [];
  const hasMultipleCombinations = (cartInfo?.lines?.length ?? 0) > 1;
  const showActiveStepper = isActive && quantityInCart > 0 && Boolean(representativeVariant);

  return (
    <div
      style={accentStyle}
      className={`pos-product-card group relative h-[var(--pos-card-h)] overflow-hidden rounded-2xl border bg-pos-card text-start ${
        isActiveWithQuantity
          ? "border-2 border-pos-primary shadow-[var(--pos-shadow-hover)]"
          : "border border-pos-border shadow-sm"
      }`}
    >
      <FlipSwap
        isFlipped={isFlipped}
        front={
          <FrontFace
            product={product}
            variant={variant}
            quickModifierGroup={quickModifierGroup}
            hasModifiers={hasModifiers}
            disabled={disabled}
            currencyCode={currencyCode}
            onAddDefault={onAddDefault}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            representativeLine={representativeLine}
            representativeVariant={representativeVariant}
            representativeModifierOptionIds={representativeModifierOptionIds}
            showActiveStepper={showActiveStepper}
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
            onActivate={onActivate}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        }
      />
    </div>
  );
}

// Front/back swap, 12th pass -- a genuine page-turn-style reveal instead of a plain fade: the face
// that's leaving squeezes down to a thin sliver and fades (pos-card-exit) while the face that's
// arriving springs open from the same thin sliver with a slight overshoot (pos-card-enter), both
// scaling along X only. This reads as a real flip motion without ever using a 3D rotateY/
// backface-visibility transform -- the thing that needed each face to counter-rotate itself to
// render right-way-round and was the actual cause of a face sometimes rendering mirrored. Both faces
// are plain, normally-oriented elements at all times; only their width is ever animated.
//
// The "previous" face is kept mounted for exactly one exit-animation's duration after a swap (via
// local state + a matching setTimeout) so there's something for pos-card-exit to actually play on --
// a bare conditional swap (10th/11th pass) can only animate the ENTERING face, since the leaving one
// is removed from the DOM in the same instant, with nothing left to animate away.
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

// Front face. Collapsed when not the active card (plain browse state), plus an inline qty stepper
// once active with a quantity (see `showActiveStepper` -- computed by the caller from the SAME
// representative variant/modifier combination the back face summarizes).
function FrontFace({
  product,
  variant,
  quickModifierGroup,
  hasModifiers,
  disabled,
  currencyCode,
  onAddDefault,
  onIncrement,
  onDecrement,
  representativeLine,
  representativeVariant,
  representativeModifierOptionIds,
  showActiveStepper,
}) {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={onAddDefault}
        disabled={disabled}
        data-roving-item=""
        className="flex min-h-0 w-full flex-1 flex-col text-start disabled:opacity-50"
      >
        <ProductImage imageUrl={product.imageUrl} className="h-20 shrink-0 rounded-t-2xl" iconSize={24}>
          {hasModifiers && (
            <span
              className="grid absolute bottom-1 start-1 h-4 w-4 place-items-center rounded-full bg-pos-warning-tint text-pos-warning-text shadow-sm"
              title={t("pos.catalog.hasModifiers")}
              aria-label={t("pos.catalog.hasModifiers")}
            >
              <SlidersHorizontal size={9} />
            </span>
          )}
        </ProductImage>
        <div className="min-h-0 flex-1 px-2 pb-1 pt-1">
          <div className="pos-fs-name line-clamp-1 text-xs font-bold text-pos-text">{product.productName}</div>
          <div className="pos-fs-label mt-0.5 truncate text-[11px] text-pos-muted">
            {product.variants.length > 1
              ? t("pos.catalog.variantCount", { count: product.variants.length })
              : product.variants[0]?.variantName}
          </div>
          <span className="pos-num pos-chip mt-1 flex items-center justify-center rounded-pos py-0.5 text-xs font-black">
            {formatMoney(product.startingPrice, currencyCode, 2)}
          </span>
        </div>
      </button>

      {/* Bottom slot: the active qty stepper (adjusting whichever combination was most recently
          added -- the SAME representative line the back face shows) takes priority once there's a
          quantity to adjust; quick-modifier chips (to add ANOTHER combination) only show otherwise.
          Always the same reserved area (mt-auto pins it to the card's fixed bottom edge), so its
          presence never changes the card's own height. */}
      {showActiveStepper ? (
        <div className="mt-auto shrink-0 px-2.5 pb-2" onClick={(event) => event.stopPropagation()}>
          <QtyStepper
            quantity={Number(representativeLine.quantity)}
            disabled={disabled}
            onDecrement={() => onDecrement(representativeVariant, representativeModifierOptionIds)}
            onIncrement={() => onIncrement(representativeVariant, representativeModifierOptionIds)}
          />
        </div>
      ) : (
        quickModifierGroup && (
          <div className="mt-auto flex shrink-0 flex-wrap gap-1 px-2.5 pb-2">
            {quickModifierGroup.options.map((option) => (
              <button
                key={option.modifierOptionId}
                type="button"
                disabled={disabled}
                title={option.name}
                onClick={() => onIncrement(variant, [option.modifierOptionId])}
                className="pos-chip-soft pos-num flex h-11 min-w-11 items-center justify-center rounded-pos px-2 text-sm font-black transition hover:brightness-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {abbreviateModifierLabel(option.name)}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// Back face: the settled order summary for every product that isn't the currently active one.
// Tapping the summary area (or its "Edit" affordance) reactivates the card -- a simple product's
// stepper, or a fresh pick in the Variant/Modifiers popup for a complex one. The stepper row below
// adjusts the ONE exact line this summary is already showing (the most recently added variant +
// modifier combination) directly, in place, without needing to reopen anything first -- the gap this
// closes is that a multi-variant/modifier line previously had no inline +/- at all once it existed.
// A plain, normally-oriented block (no transform -- see the note above its caller), sized to match
// the front face's own compact type scale 1:1 (text-xs/sm) rather than a separately-tuned, larger
// one, which was the real source of the two faces reading as visually inconsistent.
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
            {/* pos-chip (not a raw accent background + white text): one of the 4 cycling accents is
                the brand yellow (#ffc53d), and white text on yellow is nearly unreadable -- pos-chip
                always pairs its accent fill with a guaranteed-dark ink colour instead, which is
                readable against all 4. */}
            <span className="pos-chip pos-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm">
              {quantityInCart}×
            </span>
            <span className="pos-fs-name line-clamp-2 flex-1 pt-0.5 text-xs font-bold text-pos-text">
              {product.productName}
            </span>
          </div>
          {/* Variant badge: the real selected variant name (e.g. "Medium"/"Large"), styled distinctly
              from the modifier chips below it (filled with the product's own accent colour, via the
              same `pos-chip` treatment used everywhere else in the POS -- which always pairs the
              accent with a guaranteed-dark ink text colour, never the raw accent itself as text/icon
              colour: a light accent like the brand yellow as TEXT on a pale background is exactly
              what made the previous outlined version unreadable). "Standard"/single-variant products
              have nothing meaningfully distinct to show here, so it's skipped. */}
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
                  // text-pos-text is theme-reactive (light text in dark mode) while this chip's own
                  // bg-white/95 is deliberately NOT theme-reactive (a solid near-white chip is what
                  // makes it pop against the tinted backdrop in both themes) -- pairing them meant
                  // light-on-white in dark mode, unreadable. var(--brand-dark) is a fixed near-black
                  // defined once, not overridden per theme, so it's always dark against this chip.
                  className="pos-num rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-black shadow-sm"
                  style={{ color: "var(--brand-dark)" }}
                >
                  {abbreviateModifierLabel(modifier.modifierOptionName)}
                </span>
              ))}
              {hasMultipleCombinations && (
                <span className="text-[11px] font-bold text-pos-muted">
                  +{cartInfo.lines.length - 1}
                </span>
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

// Product image: the fallback icon and the real <img> are never both mounted at once, so a loaded
// photo never has the fallback's own tinted circle peeking through an aspect-ratio gap behind it.
// The <img> is absolutely positioned to `inset-0` with an explicit `h-full w-full` -- the most
// unambiguous way to say "fill this exact box," so there is no layout path left where the image's
// real box could end up taller than the (explicitly sized, overflow-hidden) parent and get silently
// clipped. `object-cover` on purpose (fills the tile completely, cropping overflow if the source
// image's own aspect ratio doesn't match) rather than `object-contain` (which leaves visible empty
// margin around a mismatched image) -- explicitly requested: the photo should fill the space it's
// given, not float inside it with gaps.
function ProductImage({ imageUrl, className = "", iconSize = 24, children }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className={`pos-product-image pos-product-tint relative w-full overflow-hidden ${className}`}>
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="pos-product-image-fallback pos-chip absolute inset-0 m-auto h-11 w-11">
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
    <div className="flex h-[52px] items-center justify-between rounded-full border border-pos-border bg-pos-bg p-1">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled}
        aria-label={t("pos.catalog.decrement")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full text-pos-muted transition hover:bg-pos-card hover:text-pos-text active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Minus size={20} />
      </button>
      <span className="pos-num flex-1 text-center text-xl font-black text-pos-text">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled}
        aria-label={t("pos.catalog.increment")}
        className="grid h-full aspect-square shrink-0 place-items-center rounded-full bg-pos-primary-strong text-white shadow-sm transition hover:bg-pos-primary-strong-hover active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
