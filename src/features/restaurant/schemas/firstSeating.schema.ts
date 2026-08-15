import { z } from "zod";

export const firstFloorSchema = z.object({
  name: z.string().trim().min(1, "floor.nameRequired").max(200, "floor.nameTooLong"),
});
export type FirstFloorFormValues = z.infer<typeof firstFloorSchema>;

export const firstTableSchema = z.object({
  code: z.string().trim().min(1, "table.codeRequired").max(50, "table.codeTooLong"),
  name: z.string().trim().max(200, "table.nameTooLong").optional().or(z.literal("")),
});
export type FirstTableFormValues = z.infer<typeof firstTableSchema>;
