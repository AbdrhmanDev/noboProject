import { z } from "zod";
import { getCurrencyMinorUnitDigits } from "../../pos/schemas/openShift.schema";

function hasValidPrecision(value: string, minorUnitDigits: number) {
  const [, fraction = ""] = value.split(".");
  return fraction.length <= minorUnitDigits;
}

export function createVariantPriceSchema(currencyCode: string | null | undefined) {
  const minorUnitDigits = getCurrencyMinorUnitDigits(currencyCode);

  return z.object({
    amount: z
      .string()
      .min(1, "variantPriceRequired")
      .refine((value) => Number.isFinite(Number(value)), "variantPriceNumber")
      .refine((value) => Number(value) >= 0, "variantPriceMin")
      .refine((value) => hasValidPrecision(value, minorUnitDigits), "variantPricePrecision"),
  });
}

export type VariantPriceFormValues = {
  amount: string;
};
