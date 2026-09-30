import type {
  InvoiceTemplateSchema,
  InvoiceTemplateSchemaProperty,
  ItemsTableColumn,
  TemplateBlock,
  TemplateDocument,
} from "../types/invoiceTemplate.types";

// A brand-new template has ZERO versions (the backend never seeds one -- CreateInvoiceTemplate only
// creates the name/description shell). This is a literal, unmodified copy of
// Nobo.Domain.Invoicing.Templates.SystemDefaultTemplate.Document -- the SAME object the backend
// itself falls back to when neither a branch nor a company has a published template. It is used here
// only as the editor's STARTING POINT for a first version, never submitted as-is without the user
// being able to see and change every field; nothing in it is invented -- every value is copied
// verbatim from that backend source file.
export function buildSystemDefaultDocument(): TemplateDocument {
  return {
    schemaVersion: 1,
    settings: { paperWidth: "mm80", locale: "ar-SA" },
    blocks: [
      { type: "businessInfo", alignment: "center", showTradeName: true, showCommercialRegistration: true, showAddress: true },
      { type: "branchInfo", alignment: "center", showPhone: true },
      { type: "divider", style: "solid", thickness: 1 },
      { type: "invoiceInfo", alignment: "start" },
      { type: "customerInfo", alignment: "start" },
      { type: "divider", style: "solid", thickness: 1 },
      { type: "itemsTable", alignment: "start", columns: ["name", "quantity", "unitPrice", "lineTotal"] },
      { type: "divider", style: "solid", thickness: 1 },
      { type: "subtotal", alignment: "start" },
      { type: "discount", alignment: "start" },
      { type: "taxSummary", alignment: "start" },
      { type: "grandTotal", alignment: "start" },
      { type: "paymentInfo", alignment: "start" },
      { type: "qrCode", alignment: "center", sizePercent: 40 },
    ],
  };
}

// Turns one schema property into a starting value. A non-required property already publishes its own
// server-side default (InvoiceTemplateSchemaBuilder.DefaultOf) -- that value is used as-is, never
// replaced with something else. A REQUIRED property (no server default exists for those) starts at the
// most neutral value its own kind allows; for text/guid that is "" (visibly incomplete, exactly what
// it is), which the backend's own /validate call then reports (Template.TextRequired /
// Template.ImageReferenceInvalid) -- never a fabricated "looks valid" placeholder.
function defaultPropertyValue(property: InvoiceTemplateSchemaProperty): unknown {
  if (property.default !== null && property.default !== undefined) {
    if (property.kind === "boolean") return property.default === "true";
    if (property.kind === "integer") return Number(property.default);
    return property.default;
  }

  switch (property.kind) {
    case "boolean":
      return false;
    case "integer":
      return property.min ?? 0;
    case "enum":
      return property.enumValues?.[0] ?? "";
    case "enumList":
      return [];
    case "guid":
    case "string":
    default:
      return "";
  }
}

// Builds a new block instance of the given schema type with every one of its declared properties
// present (so the document is always exactly the shape the strict server-side deserializer expects --
// UnmappedMemberHandling.Disallow rejects anything else). itemsTable's `columns` starts from the
// schema's OWN requiredItemsTableColumns (the mandatory set the backend itself publishes), not an
// empty list, so a freshly added items table is not immediately invalid for no reason.
export function buildDefaultBlockInstance(
  schema: InvoiceTemplateSchema,
  blockType: InvoiceTemplateSchema["blockTypes"][number],
): TemplateBlock {
  const block: Record<string, unknown> = { type: blockType.type };
  for (const property of blockType.properties) {
    if (blockType.type === "itemsTable" && property.name === "columns") {
      block[property.name] = [...schema.requiredItemsTableColumns] as ItemsTableColumn[];
      continue;
    }
    block[property.name] = defaultPropertyValue(property);
  }
  return block as TemplateBlock;
}
