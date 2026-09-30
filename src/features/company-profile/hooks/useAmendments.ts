import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelRegistration,
  createAmendment,
  getAmendment,
  listAmendments,
  respondToInformationRequest,
  submitRegistration,
  updateRegistrationDraft,
} from "../api/amendmentsApi";
import type {
  CancelRegistrationRequest,
  RespondToInformationRequestRequest,
  SaveDraftRequest,
} from "../types/amendment.types";

export const amendmentQueryKeys = {
  list: (companyId: string) => ["amendments", companyId, "list"] as const,
  details: (companyId: string, registrationId: string) => ["amendments", companyId, registrationId] as const,
};

export function useAmendments(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: amendmentQueryKeys.list(companyId || ""),
    queryFn: () => listAmendments(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useAmendmentDetail(
  companyId: string | null | undefined,
  registrationId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: amendmentQueryKeys.details(companyId || "", registrationId || ""),
    queryFn: () => getAmendment(companyId as string, registrationId as string),
    enabled: Boolean(companyId) && Boolean(registrationId) && enabled,
  });
}

export function useCreateAmendment(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createAmendment(companyId as string),
    onSuccess: () => {
      if (companyId) queryClient.invalidateQueries({ queryKey: amendmentQueryKeys.list(companyId) });
    },
  });
}

function invalidateAmendment(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  registrationId: string | null | undefined,
) {
  if (!companyId) return;
  if (registrationId) queryClient.invalidateQueries({ queryKey: amendmentQueryKeys.details(companyId, registrationId) });
  queryClient.invalidateQueries({ queryKey: amendmentQueryKeys.list(companyId) });
}

export function useUpdateAmendmentDraft(companyId: string | null | undefined, registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveDraftRequest) => updateRegistrationDraft(registrationId as string, payload),
    onSuccess: () => invalidateAmendment(queryClient, companyId, registrationId),
  });
}

export function useSubmitAmendment(companyId: string | null | undefined, registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => submitRegistration(registrationId as string),
    onSuccess: () => invalidateAmendment(queryClient, companyId, registrationId),
  });
}

export function useCancelAmendment(companyId: string | null | undefined, registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CancelRegistrationRequest = {}) => cancelRegistration(registrationId as string, payload),
    onSuccess: () => {
      if (!companyId || !registrationId) return;
      queryClient.invalidateQueries({ queryKey: amendmentQueryKeys.details(companyId, registrationId) });
      queryClient.invalidateQueries({ queryKey: amendmentQueryKeys.list(companyId) });
    },
  });
}

export function useRespondToInformationRequest(
  companyId: string | null | undefined,
  registrationId: string | null | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ informationRequestId, payload }: { informationRequestId: string; payload: RespondToInformationRequestRequest }) =>
      respondToInformationRequest(registrationId as string, informationRequestId, payload),
    onSuccess: () => {
      if (!companyId || !registrationId) return;
      queryClient.invalidateQueries({ queryKey: amendmentQueryKeys.details(companyId, registrationId) });
    },
  });
}
