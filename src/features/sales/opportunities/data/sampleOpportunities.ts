import type { Opportunity } from "../types/opportunity.types";

// SAMPLE DATA ONLY -- shown (with a visible "sample data" notice) until an opportunities API exists.
// Not real customers. Delete this file once useOpportunities.ts reads from the server.
const created = "2026-10-01T09:00:00Z";

export function sampleOpportunities(currencyCode: string): Opportunity[] {
  const make = (
    opportunityId: string,
    customerName: string,
    expectedRevenue: number,
    stage: Opportunity["stage"],
    priority: Opportunity["priority"],
    salespersonName: string,
    tag: string,
  ): Opportunity => ({
    opportunityId,
    customerName,
    expectedRevenue,
    currencyCode,
    stage,
    priority,
    salespersonName,
    tag,
    phone: "+966500000000",
    email: "sales@example.com",
    createdAtUtc: created,
  });

  return [
    make("sample-1", "شركة الرياض التقنية", 120000, "New", 1, "أحمد علي", "إلكترونيات"),
    make("sample-2", "مؤسسة الأفق", 80000, "New", 2, "سارة خالد", "خدمات"),
    make("sample-3", "متجر النخبة", 90000, "New", 0, "ماجد عبدالله", "إكسسوارات"),
    make("sample-4", "شركة النور", 150000, "Negotiation", 2, "أحمد محمد", "برمجيات"),
    make("sample-5", "مؤسسة المستقبل", 100000, "Negotiation", 1, "وليد عمر", "إلكترونيات"),
    make("sample-6", "شركة المميز", 60000, "Negotiation", 3, "نورة سالم", "خدمات"),
    make("sample-7", "شركة التقنية الحديثة", 180000, "Proposal", 2, "خالد ناصر", "إلكترونيات"),
    make("sample-8", "مجموعة الأعمال", 100000, "Proposal", 1, "ريم أحمد", "إكسسوارات"),
    make("sample-9", "عميل حكومي", 300000, "Won", 3, "فهد أحمد", "مشاريع"),
    make("sample-10", "شركة الأعمال المتحدة", 220000, "Won", 2, "علي حسن", "خدمات"),
  ];
}
