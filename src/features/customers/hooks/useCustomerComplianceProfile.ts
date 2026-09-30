import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setCustomerComplianceProfile } from "../api/customerComplianceApi";
import type {
  CustomerComplianceProfileResult,
  SetCustomerComplianceProfileRequest,
} from "../types/customerCompliance.types";

export const customerComplianceQueryKeys = {
  profile: (companyId: string, customerId: string) =>
    ["customerComplianceProfile", companyId, customerId] as const,
};

// There is no GET endpoint that returns a customer's compliance profile today -- Classification /
// OtherIdentifier / OtherIdentifierScheme / StructuredAddress are write-only facts as far as the
// API surface goes (GetCustomerDetails / GetCustomers responses do not carry them, and this task
// may not add or change any backend endpoint). So "load existing data" here means: whatever THIS
// session itself already saved for that customer, read back from the query cache -- never a
// guess, never a value invented to look like a real answer. A customer nobody has edited yet in
// this session correctly starts blank; it is not "unknown" being disguised as "known empty".
export function useCustomerComplianceProfileCache(
  companyId: string | null | undefined,
  customerId: string | null | undefined,
) {
  const queryClient = useQueryClient();
  const queryKey = customerComplianceQueryKeys.profile(companyId || "", customerId || "");

  return useQuery<CustomerComplianceProfileResult | null>({
    queryKey,
    // Never fetches anything -- just reads back whatever a prior successful save in this session
    // (see useSetCustomerComplianceProfile's onSuccess below) already put at this exact key.
    queryFn: () => queryClient.getQueryData<CustomerComplianceProfileResult>(queryKey) ?? null,
    enabled: Boolean(companyId) && Boolean(customerId),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useSetCustomerComplianceProfile(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId: string;
      payload: SetCustomerComplianceProfileRequest;
    }) => setCustomerComplianceProfile(companyId as string, customerId, payload),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        customerComplianceQueryKeys.profile(companyId || "", variables.customerId),
        result,
      );
    },
  });
}
