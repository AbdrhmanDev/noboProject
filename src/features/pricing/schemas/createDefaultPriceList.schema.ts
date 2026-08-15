import { z } from "zod";

export const createDefaultPriceListSchema = z.object({
  name: z.string().trim().min(1, "priceList.nameRequired").max(200, "priceList.nameTooLong"),
  taxMode: z.string().min(1, "priceList.taxModeRequired"),
});

export type CreateDefaultPriceListFormValues = z.infer<typeof createDefaultPriceListSchema>;
