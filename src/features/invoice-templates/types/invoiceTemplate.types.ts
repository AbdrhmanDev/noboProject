// Mirrors the REAL backend contracts EXACTLY -- verified against source, read-only:
//   Nobo.Api.InvoiceTemplates.{InvoiceTemplateEndpoints,InvoiceTemplateEndpointContracts}
//   Nobo.Application.Invoicing.Templates.{InvoiceTemplateDtos,InvoiceTemplateHandlers,InvoiceTemplateQueryHandlers,InvoiceTemplateSchemaBuilder}
//   Nobo.Domain.Invoicing.Templates.{TemplateDocument,TemplateBlockCatalog}
//   Nobo.Application.Rendering.RenderedDocument
// Every property name/casing/enum string below was read from that source, never guessed. Wire
// format is camelCase (InvoiceTemplateJson.Options / RenderedDocumentJson.Options both use
// JsonSerializerDefaults.Web + JsonStringEnumConverter(JsonNamingPolicy.CamelCase)).

export type InvoiceTemplateScope = "Company" | "Branch";
export type PaperWidth = "mm58" | "mm80" | "a4";

// ---------------------------------------------------------------------------------------- list / details

export type InvoiceTemplateListItem = {
  id: string;
  branchId: string | null;
  scope: InvoiceTemplateScope;
  name: string;
  description: string | null;
  activeVersionId: string | null;
  activeVersionNumber: number | null;
  versionCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type InvoiceTemplateVersionSummary = {
  id: string;
  versionNumber: number;
  schemaVersion: number;
  contentHash: string;
  isActive: boolean;
  isPublished: boolean;
  createdAtUtc: string;
  publishedAtUtc: string | null;
};

export type InvoiceTemplateDetails = {
  id: string;
  branchId: string | null;
  scope: InvoiceTemplateScope;
  name: string;
  description: string | null;
  activeVersionId: string | null;
  activeVersionNumber: number | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  versions: InvoiceTemplateVersionSummary[];
};

export type InvoiceTemplateVersion = {
  id: string;
  templateId: string;
  versionNumber: number;
  schemaVersion: number;
  contentHash: string;
  isActive: boolean;
  isPublished: boolean;
  createdAtUtc: string;
  publishedAtUtc: string | null;
  document: TemplateDocument;
};

// Source: "BranchTemplate" | "CompanyTemplate" | "SystemDefault" (Nobo's InvoiceTemplateResolver enum,
// serialized with plain .ToString() -- NOT camelCase like everything else in this file; verified as-is).
export type EffectiveTemplateSource = "BranchTemplate" | "CompanyTemplate" | "SystemDefault";

export type EffectiveInvoiceTemplate = {
  source: EffectiveTemplateSource;
  templateId: string | null;
  versionId: string | null;
  versionNumber: number | null;
  contentHash: string;
  language: string;
  locale: string;
  paperWidth: PaperWidth;
  document: TemplateDocument;
};

// ---------------------------------------------------------------------------------------- template document (the schema-driven JSON)

export type TemplateAlignment = "start" | "center" | "end";
export type TemplateFontSize = "small" | "normal" | "large";
export type TemplateFontWeight = "normal" | "bold";
export type TemplateDividerStyle = "solid" | "dashed" | "dotted";
export type TemplateBarcodeSymbology = "code128";
export type ItemsTableColumn =
  | "name"
  | "sku"
  | "quantity"
  | "unit"
  | "unitPrice"
  | "lineDiscount"
  | "lineTax"
  | "lineTotal";

export type TemplateSettings = { paperWidth: PaperWidth; locale: string };

// Discriminated union mirroring TemplateBlock's [JsonPolymorphic] shape exactly (discriminator "type").
// Merchant-controlled: logo, customText, footer, divider, spacer.
// System-controlled (content is always canonical invoice data; merchant picks position/options only):
// businessInfo, branchInfo, invoiceInfo, customerInfo, itemsTable, subtotal, discount, taxSummary,
// grandTotal, paymentInfo, qrCode, barcode.
export type TemplateBlock =
  | { type: "logo"; imageAssetId: string; alignment: TemplateAlignment; widthPercent: number }
  | {
      type: "customText";
      text: string;
      alignment: TemplateAlignment;
      fontSize: TemplateFontSize;
      weight: TemplateFontWeight;
    }
  | { type: "footer"; text: string; alignment: TemplateAlignment }
  | { type: "divider"; style: TemplateDividerStyle; thickness: number }
  | { type: "spacer"; height: number }
  | {
      type: "businessInfo";
      alignment: TemplateAlignment;
      showTradeName: boolean;
      showCommercialRegistration: boolean;
      showAddress: boolean;
    }
  | { type: "branchInfo"; alignment: TemplateAlignment; showPhone: boolean }
  | { type: "invoiceInfo"; alignment: TemplateAlignment }
  | { type: "customerInfo"; alignment: TemplateAlignment }
  | { type: "itemsTable"; alignment: TemplateAlignment; columns: ItemsTableColumn[] }
  | { type: "subtotal"; alignment: TemplateAlignment }
  | { type: "discount"; alignment: TemplateAlignment }
  | { type: "taxSummary"; alignment: TemplateAlignment }
  | { type: "grandTotal"; alignment: TemplateAlignment }
  | { type: "paymentInfo"; alignment: TemplateAlignment }
  | { type: "qrCode"; alignment: TemplateAlignment; sizePercent: number }
  | { type: "barcode"; alignment: TemplateAlignment; symbology: TemplateBarcodeSymbology };

export type TemplateBlockType = TemplateBlock["type"];

export type TemplateDocument = {
  schemaVersion: number;
  settings: TemplateSettings;
  blocks: TemplateBlock[];
};

// ---------------------------------------------------------------------------------------- schema catalog (GET .../schema)

export type SchemaPropertyKind = "boolean" | "integer" | "string" | "guid" | "enum" | "enumList";

export type InvoiceTemplateSchemaProperty = {
  name: string;
  kind: SchemaPropertyKind;
  required: boolean;
  enumValues: string[] | null;
  min: number | null;
  max: number | null;
  maxLength: number | null;
  default: string | null;
};

export type InvoiceTemplateSchemaBlockType = {
  type: TemplateBlockType;
  control: "System" | "Merchant";
  required: boolean; // must appear in every template (MandatorySystemBlocks)
  maxOccurrences: number | null; // 1 for system blocks; null = unlimited (bounded by maxBlocks)
  properties: InvoiceTemplateSchemaProperty[];
};

export type InvoiceTemplateSchema = {
  currentSchemaVersion: number;
  supportedSchemaVersions: number[];
  maxBlocks: number;
  maxDocumentJsonLength: number;
  localePattern: string;
  paperWidths: PaperWidth[];
  requiredBlockTypes: TemplateBlockType[];
  requiredItemsTableColumns: ItemsTableColumn[];
  blockTypes: InvoiceTemplateSchemaBlockType[];
};

// ---------------------------------------------------------------------------------------- validate (dry run, POST .../validate)

export type InvoiceTemplateValidationIssue = { code: string; path: string; message: string };

export type ValidateInvoiceTemplateDocumentResult = {
  isValid: boolean;
  contentHash: string | null;
  issues: InvoiceTemplateValidationIssue[];
};

// ---------------------------------------------------------------------------------------- write results

export type CreateInvoiceTemplateRequest = { branchId: string | null; name: string; description: string | null };
export type CreateInvoiceTemplateResult = { templateId: string; companyId: string; branchId: string | null; name: string };
export type CreateInvoiceTemplateVersionResult = {
  versionId: string;
  templateId: string;
  versionNumber: number;
  contentHash: string;
};
export type PublishInvoiceTemplateVersionResult = { templateId: string; activeVersionId: string; versionNumber: number };

// ---------------------------------------------------------------------------------------- renderer-neutral preview (POST .../render-preview)
//
// Deliberately NOT InvoiceRenderModel (the OTHER preview shape, POST .../preview): that one hands back
// raw per-block DATA + a string-keyed OPTIONS bag for a renderer to still interpret/lay out itself --
// building a UI on top of it would mean writing a second layout engine in the frontend. RenderedDocument
// is the renderer-NEUTRAL, ALREADY-LAID-OUT tree Nobo's own doc comment says format renderers (ESC/POS,
// PDF, ...) consume directly -- pre-wrapped lines, resolved alignment/direction, table columns. A preview
// UI is exactly one more "format renderer" consuming this, per its own design; nothing is decided here
// that the backend did not already decide.
export type RenderedCell = { lines: string[]; alignment: string; direction: string; widthColumns: number };
export type TableColumn = { key: string; label: string; alignment: string; direction: string; widthColumns: number };
export type TableRow = { heading: RenderedCell | null; cells: RenderedCell[] };

export type RenderedNode =
  | {
      kind: "text";
      role: string;
      alignment: string;
      size: string;
      weight: string;
      direction: string;
      lines: string[];
    }
  | {
      kind: "labeledValue";
      role: string;
      alignment: string;
      label: string;
      valueDirection: string;
      valueLines: string[];
    }
  | { kind: "row"; role: string; size: string; weight: string; label: RenderedCell; value: RenderedCell }
  | {
      kind: "table";
      role: string;
      layout: "columns" | "stacked";
      columns: TableColumn[];
      header: TableRow;
      rows: TableRow[];
    }
  | { kind: "image"; alignment: string; widthPercent: number; source: string; assetId: string }
  | { kind: "qr"; alignment: string; sizePercent: number; state: "available" | "unavailable"; payload: string | null }
  | {
      kind: "barcode";
      alignment: string;
      symbology: string;
      state: "available" | "unavailable";
      value: string | null;
      source: string;
    }
  | { kind: "divider"; style: string; thickness: number }
  | { kind: "spacer"; height: number };

export type RenderedPage = { paperWidth: PaperWidth; kind: "thermal" | "page"; columns: number };

export type RenderedDocument = {
  schemaVersion: number;
  invoiceId: string;
  invoiceNumber: string;
  language: string;
  locale: string;
  direction: "rtl" | "ltr";
  page: RenderedPage;
  currencyCode: string;
  currencyMinorUnitDigits: number;
  templateVersionId: string | null;
  templateVersionHash: string;
  nodes: RenderedNode[];
};
