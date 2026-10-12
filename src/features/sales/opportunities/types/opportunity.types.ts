// Sales opportunities (CRM pipeline). There is NO backend for this yet: the shape below is the
// contract the UI is built against, i.e. what a future
//   GET    /api/companies/{companyId}/opportunities
//   POST   /api/companies/{companyId}/opportunities
//   PUT    /api/companies/{companyId}/opportunities/{opportunityId}
//   PUT    /api/companies/{companyId}/opportunities/{opportunityId}/stage   { stage }
// would need to return / accept. Until then hooks/useOpportunities.ts serves sample data.

export const OPPORTUNITY_STAGES = ["New", "Negotiation", "Proposal", "Won"] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

// 0 = none, 1..3 = stars.
export type OpportunityPriority = 0 | 1 | 2 | 3;

export type Opportunity = {
  opportunityId: string;
  // Who the deal is with (company or person) -- the card's title.
  customerName: string;
  expectedRevenue: number;
  currencyCode: string;
  stage: OpportunityStage;
  priority: OpportunityPriority;
  salespersonName: string | null;
  tag: string | null;
  phone: string | null;
  email: string | null;
  createdAtUtc: string;
};

export type OpportunityDraft = Omit<Opportunity, "opportunityId" | "createdAtUtc">;
