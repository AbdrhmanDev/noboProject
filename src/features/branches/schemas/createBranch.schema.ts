import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().trim().min(1, "branch.nameRequired").max(200, "branch.nameTooLong"),
  code: z.string().trim().min(1, "branch.codeRequired").max(100, "branch.codeTooLong"),
  phone: z.string().trim().max(50, "branch.phoneTooLong").optional().or(z.literal("")),
  countryCode: z
    .string()
    .trim()
    .min(2, "branch.countryCodeRequired")
    .max(2, "branch.countryCodeInvalid"),
  city: z.string().trim().min(1, "branch.cityRequired"),
  district: z.string().trim().optional().or(z.literal("")),
  street: z.string().trim().optional().or(z.literal("")),
  buildingNumber: z.string().trim().optional().or(z.literal("")),
  additionalNumber: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
});

export type CreateBranchFormValues = z.infer<typeof createBranchSchema>;
