import { Banknote, CreditCard, WalletCards } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

export function getPaymentMethodIcon(kind) {
  if (kind === "Cash") return Banknote;
  if (kind === "Card") return CreditCard;
  return WalletCards;
}

export function getPaymentMethodColor(kind) {
  if (kind === "Cash") return "text-pos-action-text";
  if (kind === "Card") return "text-pos-primary-text";
  if (kind === "BankTransfer") return "text-pos-primary-text";
  return "text-pos-warning-text";
}

function getDecimalScale(value) {
  const normalized = String(value || "").trim();
  if (!normalized.includes(".")) return 0;
  return normalized.split(".")[1]?.length || 0;
}

function isPositiveDecimalInput(value) {
  return /^\d+(\.\d+)?$/.test(String(value || "").trim());
}

export function parseMoneyInput(value, minorUnitDigits) {
  const normalized = String(value || "").trim();

  if (!isPositiveDecimalInput(normalized)) {
    return { amount: null, error: "Enter a valid positive amount." };
  }

  if (getDecimalScale(normalized) > minorUnitDigits) {
    return {
      amount: null,
      error: `Amount supports up to ${minorUnitDigits} decimal places.`,
    };
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { amount: null, error: "Amount must be greater than zero." };
  }

  return { amount, error: "" };
}

export function parseNonNegativeMoneyInput(value, minorUnitDigits) {
  const normalized = String(value || "").trim();

  if (!isPositiveDecimalInput(normalized) && normalized !== "0") {
    return { amount: null, error: "Enter a valid counted cash amount." };
  }

  if (getDecimalScale(normalized) > minorUnitDigits) {
    return {
      amount: null,
      error: `Amount supports up to ${minorUnitDigits} decimal places.`,
    };
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    return { amount: null, error: "Counted cash must be zero or greater." };
  }

  return { amount, error: "" };
}

export function formatPaymentDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}

export function shortOrderReference(salesOrderId) {
  if (!salesOrderId || typeof salesOrderId !== "string") return "";
  return `…${salesOrderId.slice(-6)}`;
}

export function getCashMovementLabel(type) {
  if (type === "CashIn") return "Cash In";
  if (type === "CashOut") return "Cash Out";
  if (type === "CashPayment") return "Cash Payment";
  if (type === "CashRefund") return "Cash Refund";
  return type;
}

export function getCashMovementTone(type) {
  if (type === "CashIn" || type === "CashPayment") return "text-emerald-300";
  if (type === "CashOut" || type === "CashRefund") return "text-rose-300";
  return "text-slate-300";
}

export function isManualCashMovement(type) {
  return type === "CashIn" || type === "CashOut";
}

// Short keyboard-shortcut-style label for a modifier option chip (POS touch redesign): single
// word -> its first letter ("Large" -> "L", "Double" -> "D"), multi-word -> initials ("Extra
// Cheese" -> "EC"). Purely a display abbreviation of the real modifier option name already
// returned by the catalog API -- never a separate/invented value.
export function abbreviateModifierLabel(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return words.map((word) => word.charAt(0).toUpperCase()).join("").slice(0, 3);
}

// Size-circle label for a product variant on the POS card: size names (English or Arabic) map to
// S / M / L; any other variant name falls back to abbreviateModifierLabel. Display only -- the
// circle always adds the real variant it labels.
const VARIANT_SIZE_ALIASES = {
  S: ["s", "small", "صغير", "صغيرة", "سمول"],
  M: ["m", "medium", "وسط", "متوسط", "متوسطة", "ميديم", "ميديام"],
  L: ["l", "large", "كبير", "كبيرة", "لارج"],
};

export function variantSizeLabel(variantName) {
  const value = String(variantName || "").trim().toLowerCase();
  const size = Object.keys(VARIANT_SIZE_ALIASES).find((key) => VARIANT_SIZE_ALIASES[key].includes(value));
  return size ?? abbreviateModifierLabel(variantName);
}

// Variants in size order for the POS card circles: S, M, L first (by variantSizeLabel), then any
// other variant by price. The catalog's own order is arbitrary (it can list Large first).
const SIZE_RANK = { S: 0, M: 1, L: 2 };

export function sortVariantsBySize(variants = []) {
  const rank = (variant) => SIZE_RANK[variantSizeLabel(variant.variantName)] ?? 3;
  return variants
    .slice()
    .sort((a, b) => rank(a) - rank(b) || Number(a.price ?? a.unitPrice) - Number(b.price ?? b.unitPrice));
}

// The variant a plain tap on a product card adds: the highest-priced variant. Separate from
// sortVariantsBySize (which stays smallest-to-largest for the card's own size-circle display) so
// changing this default never reorders those circles.
export function getDefaultVariant(product) {
  const variants = product?.variants ?? [];
  if (variants.length === 0) return null;

  return variants.reduce((highest, variant) =>
    Number(variant.price ?? variant.unitPrice) > Number(highest.price ?? highest.unitPrice) ? variant : highest,
  );
}

// Stock level lights on the POS product card (red / yellow / green). Fixed thresholds for every
// product -- the catalog has no per-product "full" quantity -- in AVAILABLE UNITS of the product
// (what its stock items can still make). Change the numbers here to retune all cards.
export const STOCK_LEVEL_THRESHOLDS = {
  full: 20, // >= full -> green
  half: 10, // >= half -> yellow; below -> red (about to run out)
};

export const STOCK_LEVELS = ["low", "half", "full"];

export function getStockLevel(availableUnits) {
  if (availableUnits >= STOCK_LEVEL_THRESHOLDS.full) return "full";
  if (availableUnits >= STOCK_LEVEL_THRESHOLDS.half) return "half";
  return "low";
}
