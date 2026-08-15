import { z } from "zod";

export const firstTaxCategorySchema = z
  .object({
    code: z.string().trim().min(1, "taxCategory.codeRequired").max(50, "taxCategory.codeTooLong"),
    name: z.string().trim().min(1, "taxCategory.nameRequired").max(200, "taxCategory.nameTooLong"),
    treatment: z.enum(["StandardRated", "ZeroRated", "Exempt"]),
    ratePercent: z.string().min(1, "taxCategory.rateRequired"),
  })
  .superRefine((data, ctx) => {
    const rate = Number(data.ratePercent);

    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      ctx.addIssue({ code: "custom", path: ["ratePercent"], message: "taxCategory.rateInvalid" });
      return;
    }

    if (data.treatment === "StandardRated" && rate <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["ratePercent"],
        message: "taxCategory.rateMustBePositive",
      });
    }

    if (data.treatment !== "StandardRated" && rate !== 0) {
      ctx.addIssue({ code: "custom", path: ["ratePercent"], message: "taxCategory.rateMustBeZero" });
    }
  });

export type FirstTaxCategoryFormValues = z.infer<typeof firstTaxCategorySchema>;
