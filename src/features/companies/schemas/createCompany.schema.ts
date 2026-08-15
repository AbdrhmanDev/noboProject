import { z } from "zod";

export const createCompanySchema = z.object({
  legalName: z.string().trim().min(1, "company.legalNameRequired").max(200, "company.legalNameTooLong"),
  tradeName: z.string().trim().max(200, "company.tradeNameTooLong").optional().or(z.literal("")),
  businessSectorId: z.string().min(1, "company.businessSectorRequired"),
  taxNumber: z.string().trim().max(50, "company.taxNumberTooLong").optional().or(z.literal("")),
  commercialRegistrationNumber: z
    .string()
    .trim()
    .max(50, "company.commercialRegistrationTooLong")
    .optional()
    .or(z.literal("")),
  countryCode: z
    .string()
    .trim()
    .min(2, "company.countryCodeRequired")
    .max(2, "company.countryCodeInvalid"),
  city: z.string().trim().min(1, "company.cityRequired"),
  district: z.string().trim().optional().or(z.literal("")),
  street: z.string().trim().optional().or(z.literal("")),
  buildingNumber: z.string().trim().optional().or(z.literal("")),
  additionalNumber: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
});

export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;
