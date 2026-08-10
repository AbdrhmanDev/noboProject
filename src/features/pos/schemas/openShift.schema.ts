import { z } from "zod";

export function getCurrencyMinorUnitDigits(currencyCode: string | null | undefined) {
  const knownMinorUnits: Record<string, number> = {
    SAR: 2,
  };

  return knownMinorUnits[currencyCode || ""] ?? 2;
}

function hasValidPrecision(value: string, minorUnitDigits: number) {
  const [, fraction = ""] = value.split(".");
  return fraction.length <= minorUnitDigits;
}

export function createOpenShiftSchema(currencyCode: string | null | undefined) {
  const minorUnitDigits = getCurrencyMinorUnitDigits(currencyCode);

  return z.object({
    openingFloatAmount: z
      .string()
      .min(1, "openingFloatRequired")
      .refine((value) => Number.isFinite(Number(value)), "openingFloatNumber")
      .refine((value) => Number(value) >= 0, "openingFloatMin")
      .refine(
        (value) => hasValidPrecision(value, minorUnitDigits),
        "openingFloatPrecision",
      ),
  });
}

export type OpenShiftFormValues = {
  openingFloatAmount: string;
};
