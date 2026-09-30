// Thin re-export so this feature's routing lives in the same place every other route does
// (src/Pages/*), while the real implementation stays modular under
// src/features/invoice-templates/ (types/api/hooks/components/pages), as asked.
export { InvoiceTemplatesListPage as default } from "../../features/invoice-templates/pages/InvoiceTemplatesListPage";
