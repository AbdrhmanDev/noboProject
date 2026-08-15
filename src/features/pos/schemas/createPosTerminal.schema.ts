import { z } from "zod";

export const createPosTerminalSchema = z.object({
  code: z.string().trim().min(1, "posTerminal.codeRequired").max(50, "posTerminal.codeTooLong"),
  name: z.string().trim().min(1, "posTerminal.nameRequired").max(200, "posTerminal.nameTooLong"),
});

export type CreatePosTerminalFormValues = z.infer<typeof createPosTerminalSchema>;
