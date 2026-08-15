import { z } from "zod";

export const createPaymentMethodSchema = z.object({
  code: z.string().trim().min(1, "paymentMethod.codeRequired").max(50, "paymentMethod.codeTooLong"),
  name: z.string().trim().min(1, "paymentMethod.nameRequired").max(200, "paymentMethod.nameTooLong"),
  kind: z.enum(["Cash", "Card", "BankTransfer", "Other"]),
});

export type CreatePaymentMethodFormValues = z.infer<typeof createPaymentMethodSchema>;
