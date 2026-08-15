import { z } from "zod";

export const firstCategorySchema = z.object({
  name: z.string().trim().min(1, "category.nameRequired").max(200, "category.nameTooLong"),
});
export type FirstCategoryFormValues = z.infer<typeof firstCategorySchema>;

export const firstProductSchema = z.object({
  name: z.string().trim().min(1, "product.nameRequired").max(200, "product.nameTooLong"),
});
export type FirstProductFormValues = z.infer<typeof firstProductSchema>;

export const firstVariantSchema = z.object({
  name: z.string().trim().min(1, "variant.nameRequired").max(200, "variant.nameTooLong"),
  sku: z.string().trim().max(100, "variant.skuTooLong").optional().or(z.literal("")),
  salesUnitOfMeasureId: z.string().min(1, "variant.uomRequired"),
});
export type FirstVariantFormValues = z.infer<typeof firstVariantSchema>;
