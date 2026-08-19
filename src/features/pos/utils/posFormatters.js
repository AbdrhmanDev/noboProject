import { Banknote, CreditCard, WalletCards } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

export function getPaymentMethodIcon(kind) {
  if (kind === "Cash") return Banknote;
  if (kind === "Card") return CreditCard;
  return WalletCards;
}

export function getPaymentMethodColor(kind) {
  if (kind === "Cash") return "text-emerald-300";
  if (kind === "Card") return "text-blue-300";
  if (kind === "BankTransfer") return "text-violet-300";
  return "text-amber-300";
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
