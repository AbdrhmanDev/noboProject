import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Opportunity, OpportunityDraft, OpportunityStage } from "../types/opportunity.types";
import { sampleOpportunities } from "../data/sampleOpportunities";

// The ONE place to change when the opportunities API exists: swap the queryFn for the GET call and
// each action below for its mutation (then invalidate this key). Until then the list is sample data
// held in the React Query cache, so changes survive tab switches but not a page reload.
export const OPPORTUNITIES_ARE_SAMPLE = true;

const opportunitiesKey = (companyId: string | null | undefined) => ["sales", "opportunities", companyId] as const;

export function useOpportunities(companyId: string | null | undefined, currencyCode: string | undefined) {
  return useQuery({
    queryKey: opportunitiesKey(companyId),
    queryFn: async () => sampleOpportunities(currencyCode || "SAR"),
    enabled: Boolean(companyId),
    staleTime: Infinity,
  });
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useOpportunityActions(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  const update = (change: (current: Opportunity[]) => Opportunity[]) =>
    queryClient.setQueryData<Opportunity[]>(opportunitiesKey(companyId), (current = []) => change(current));

  return {
    create: (draft: OpportunityDraft) =>
      update((current) => [{ ...draft, opportunityId: newId(), createdAtUtc: new Date().toISOString() }, ...current]),
    save: (opportunity: Opportunity) =>
      update((current) =>
        current.map((entry) => (entry.opportunityId === opportunity.opportunityId ? opportunity : entry)),
      ),
    moveToStage: (opportunityId: string, stage: OpportunityStage) =>
      update((current) => current.map((entry) => (entry.opportunityId === opportunityId ? { ...entry, stage } : entry))),
  };
}
