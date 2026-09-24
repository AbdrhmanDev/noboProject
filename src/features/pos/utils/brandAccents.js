// The four bars of the NOBO logo, in logo order. Cycled through lists (cart lines, payment methods)
// so each row carries one of the brand colours as a small accent. Raw brand constants on purpose:
// they are the mark's own colours and read the same in light and dark.
const BRAND_ACCENTS = ["var(--brand-pink)", "var(--brand-yellow)", "var(--brand-blue)", "var(--brand-green)"];

export const brandAccentVar = (index) => BRAND_ACCENTS[((index % 4) + 4) % 4];

export const brandAccentStyle = (index) => ({ "--pos-accent": brandAccentVar(index) });

// Translated label for a raw status/enum value, falling back to the raw value when there is no key.
export function labelFor(t, prefix, value) {
  if (!value) return value;
  const key = prefix + "." + value;
  const label = t(key);
  return label === key ? value : label;
}
