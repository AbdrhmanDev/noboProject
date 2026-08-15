function getDecimalScale(value: string) {
  const normalized = value.trim();
  if (!normalized.includes(".")) return 0;
  return normalized.split(".")[1]?.length || 0;
}

export function parsePositiveQuantity(value: string, allowsFractionalQuantity: boolean) {
  const normalized = String(value || "").trim();

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { amount: null, error: "Enter a valid positive quantity." };
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { amount: null, error: "Quantity must be greater than zero." };
  }

  if (!allowsFractionalQuantity && getDecimalScale(normalized) > 0) {
    return { amount: null, error: "This unit of measure does not allow fractional quantities." };
  }

  return { amount, error: "" };
}

export function parseNonZeroQuantity(value: string, allowsFractionalQuantity: boolean) {
  const normalized = String(value || "").trim();

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return { amount: null, error: "Enter a valid quantity (positive or negative)." };
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount === 0) {
    return { amount: null, error: "Quantity delta cannot be zero." };
  }

  if (!allowsFractionalQuantity && getDecimalScale(normalized.replace("-", "")) > 0) {
    return { amount: null, error: "This unit of measure does not allow fractional quantities." };
  }

  return { amount, error: "" };
}
