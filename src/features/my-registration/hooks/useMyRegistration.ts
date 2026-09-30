import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelRegistration,
  createRegistrationDraft,
  getMyLatestRegistration,
  listMyRegistrationDocuments,
  reopenRegistration,
  respondToInformationRequest,
  submitRegistration,
  updateRegistrationDraft,
  uploadMyRegistrationDocument,
} from "../api/myRegistrationApi";
import type { CancelRegistrationRequest, RespondToInformationRequestRequest, SaveDraftRequest } from "../types/registration.types";

export const myRegistrationQueryKeys = {
  mine: ["myRegistration", "mine"] as const,
  documents: (registrationId: string) => ["myRegistration", registrationId, "documents"] as const,
};

// GET /api/registrations/mine -- the applicant's most recent request. A "no registration yet" answer
// comes back as a FAILED query with error.code === "Registration.NotFound" (verified in
// RegistrationContracts.NotFound()); the page treats that ONE specific code as "offer to create a
// new one", not a generic error box (see NewRegistrationPage.jsx).
export function useMyLatestRegistration(enabled = true) {
  return useQuery({
    queryKey: myRegistrationQueryKeys.mine,
    queryFn: getMyLatestRegistration,
    enabled,
    retry: false,
  });
}

function invalidateMine(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: myRegistrationQueryKeys.mine });
}

export function useCreateRegistrationDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveDraftRequest = {}) => createRegistrationDraft(payload),
    onSuccess: (data) => {
      invalidateMine(queryClient);
      queryClient.setQueryData(myRegistrationQueryKeys.mine, data);
    },
  });
}

export function useUpdateRegistrationDraft(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveDraftRequest) => updateRegistrationDraft(registrationId as string, payload),
    onSuccess: () => invalidateMine(queryClient),
  });
}

export function useSubmitRegistration(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => submitRegistration(registrationId as string),
    onSuccess: () => invalidateMine(queryClient),
  });
}

export function useCancelRegistration(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CancelRegistrationRequest = {}) => cancelRegistration(registrationId as string, payload),
    onSuccess: () => invalidateMine(queryClient),
  });
}

// Cancelled -> Draft, same registration id (POST .../reopen). On success the "mine" query is
// invalidated/refetched, same as every other transition here -- the caller does not need to
// setQueryData manually, the refetched view already has status "Draft".
export function useReopenRegistration(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reopenRegistration(registrationId as string),
    onSuccess: () => invalidateMine(queryClient),
  });
}

export function useRespondToInformationRequest(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ informationRequestId, payload }: { informationRequestId: string; payload: RespondToInformationRequestRequest }) =>
      respondToInformationRequest(registrationId as string, informationRequestId, payload),
    onSuccess: () => invalidateMine(queryClient),
  });
}

export function useMyRegistrationDocuments(registrationId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: myRegistrationQueryKeys.documents(registrationId || ""),
    queryFn: () => listMyRegistrationDocuments(registrationId as string),
    enabled: Boolean(registrationId) && enabled,
  });
}

export function useUploadMyRegistrationDocument(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentType, file }: { documentType: string; file: File }) =>
      uploadMyRegistrationDocument(registrationId as string, documentType, file),
    onSuccess: () => {
      if (registrationId) queryClient.invalidateQueries({ queryKey: myRegistrationQueryKeys.documents(registrationId) });
      invalidateMine(queryClient); // a document's presence can matter to the review summary
    },
  });
}
