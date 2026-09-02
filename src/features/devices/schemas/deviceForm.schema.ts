import { z } from "zod";

const DEVICE_TYPES = [
  "ReceiptPrinter",
  "KitchenPrinter",
  "BarcodeScanner",
  "CashDrawer",
  "CustomerDisplay",
  "KdsDevice",
  "PaymentTerminal",
  "Scale",
] as const;

const CONNECTION_TYPES = ["Usb", "NetworkEthernet", "Wifi", "Bluetooth", "SerialCom"] as const;

const CERTIFICATION_STATUSES = [
  "Unknown",
  "Certified",
  "Compatible",
  "AdapterRequired",
  "Unsupported",
] as const;

export const deviceFormSchema = z.object({
  code: z.string().trim().min(1, "devices.form.codeRequired").max(50, "devices.form.codeTooLong"),
  name: z.string().trim().min(1, "devices.form.nameRequired").max(200, "devices.form.nameTooLong"),
  deviceType: z.enum(DEVICE_TYPES, { message: "devices.form.deviceTypeRequired" }),
  manufacturer: z.string().trim().max(200, "devices.form.manufacturerTooLong").optional().or(z.literal("")),
  model: z.string().trim().max(200, "devices.form.modelTooLong").optional().or(z.literal("")),
  serialNumber: z.string().trim().max(200, "devices.form.serialNumberTooLong").optional().or(z.literal("")),
  firmwareVersion: z
    .string()
    .trim()
    .max(100, "devices.form.firmwareVersionTooLong")
    .optional()
    .or(z.literal("")),
  connectionType: z.enum(CONNECTION_TYPES, { message: "devices.form.connectionTypeRequired" }),
  connectionConfigurationJson: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => {
        if (!value) return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: "devices.form.connectionConfigurationInvalid" },
    ),
  posTerminalId: z.string().optional().or(z.literal("")),
  kitchenStationId: z.string().optional().or(z.literal("")),
  edgeAgentId: z.string().optional().or(z.literal("")),
  certification: z.enum(CERTIFICATION_STATUSES).optional(),
});

export type DeviceFormValues = z.infer<typeof deviceFormSchema>;

export { DEVICE_TYPES, CONNECTION_TYPES, CERTIFICATION_STATUSES };
