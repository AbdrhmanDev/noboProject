import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveRegistration,
  claimRegistration,
  confirmExtractedValue,
  confirmRegistrationField,
  correctExtractedValue,
  editRegistrationField,
  getExtractedValues,
  getExtractionRun,
  getRegistration,
  getRegistrationDocument,
  getRegistrationHistory,
  listExtractionRuns,
  listRegistrationDocuments,
  listRegistrations,
  rejectExtractedValue,
  rejectRegistration,
  rejectRegistrationDocument,
  replaceRegistrationDocument,
  requestRegistrationInformation,
  reviewRegistrationDocument,
  triggerExtraction,
  uploadRegistrationDocument,
} from "../api/registrationsApi";
import type {
  ApproveRegistrationRequest,
  CorrectExtractedValueRequest,
  EditFieldRequest,
  ExtractionRun,
  RegistrationListFilters,
  RejectDocumentRequest,
  RejectExtractedValueRequest,
  RejectRegistrationRequest,
  RequestInformationRequest,
  ReviewDocumentRequest,
  TriggerExtractionRequest,
} from "../types/registration.types";

export const registrationQueryKeys = {
  list: (filters: RegistrationListFilters) => ["registrations", "list", filters] as const,
  details: (registrationId: string) => ["registrations", registrationId] as const,
  history: (registrationId: string) => ["registrations", registrationId, "history"] as const,
  documents: (registrationId: string) => ["registrations", registrationId, "documents"] as const,
  document: (registrationId: string, documentId: string) => ["registrations", registrationId, "documents", documentId] as const,
  extractionRuns: (registrationId: string, documentId: string) =>
    ["registrations", registrationId, "documents", documentId, "extractions"] as const,
  extractionRun: (registrationId: string, documentId: string, runId: string) =>
    ["registrations", registrationId, "documents", documentId, "extractions", runId] as const,
  extractedValues: (registrationId: string, documentId: string, runId: string) =>
    ["registrations", registrationId, "documents", documentId, "extractions", runId, "values"] as const,
};

const NON_TERMINAL_RUN_STATUSES = new Set(["Pending", "Running"]);

export function useRegistrations(filters: RegistrationListFilters, enabled = true) {
  return useQuery({
    queryKey: registrationQueryKeys.list(filters),
    queryFn: () => listRegistrations(filters),
    enabled,
  });
}

export function useRegistrationDetails(registrationId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: registrationQueryKeys.details(registrationId || ""),
    queryFn: () => getRegistration(registrationId as string),
    enabled: Boolean(registrationId) && enabled,
  });
}

export function useRegistrationHistory(registrationId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: registrationQueryKeys.history(registrationId || ""),
    queryFn: () => getRegistrationHistory(registrationId as string),
    enabled: Boolean(registrationId) && enabled,
  });
}

function invalidateRegistration(queryClient: ReturnType<typeof useQueryClient>, registrationId: string | null | undefined) {
  if (!registrationId) return;
  queryClient.invalidateQueries({ queryKey: registrationQueryKeys.details(registrationId) });
  queryClient.invalidateQueries({ queryKey: ["registrations", "list"] });
}

export function useClaimRegistration(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => claimRegistration(registrationId as string),
    onSuccess: () => invalidateRegistration(queryClient, registrationId),
  });
}

export function useEditRegistrationField(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldKey, payload }: { fieldKey: string; payload: EditFieldRequest }) =>
      editRegistrationField(registrationId as string, fieldKey, payload),
    onSuccess: () => invalidateRegistration(queryClient, registrationId),
  });
}

export function useConfirmRegistrationField(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldKey: string) => confirmRegistrationField(registrationId as string, fieldKey),
    onSuccess: () => invalidateRegistration(queryClient, registrationId),
  });
}

export function useRequestRegistrationInformation(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequestInformationRequest) => requestRegistrationInformation(registrationId as string, payload),
    onSuccess: () => invalidateRegistration(queryClient, registrationId),
  });
}

export function useApproveRegistration(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveRegistrationRequest) => approveRegistration(registrationId as string, payload),
    onSuccess: () => invalidateRegistration(queryClient, registrationId),
  });
}

export function useRejectRegistration(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectRegistrationRequest) => rejectRegistration(registrationId as string, payload),
    onSuccess: () => invalidateRegistration(queryClient, registrationId),
  });
}

// ---------------------------------------------------------------------------------------- documents

export function useRegistrationDocuments(registrationId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: registrationQueryKeys.documents(registrationId || ""),
    queryFn: () => listRegistrationDocuments(registrationId as string),
    enabled: Boolean(registrationId) && enabled,
  });
}

export function useRegistrationDocument(
  registrationId: string | null | undefined,
  documentId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: registrationQueryKeys.document(registrationId || "", documentId || ""),
    queryFn: () => getRegistrationDocument(registrationId as string, documentId as string),
    enabled: Boolean(registrationId) && Boolean(documentId) && enabled,
  });
}

function invalidateDocuments(queryClient: ReturnType<typeof useQueryClient>, registrationId: string | null | undefined) {
  if (!registrationId) return;
  queryClient.invalidateQueries({ queryKey: registrationQueryKeys.documents(registrationId) });
}

export function useUploadRegistrationDocument(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentType, file }: { documentType: string; file: File }) =>
      uploadRegistrationDocument(registrationId as string, documentType, file),
    onSuccess: () => invalidateDocuments(queryClient, registrationId),
  });
}

export function useReplaceRegistrationDocument(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, file }: { documentId: string; file: File }) =>
      replaceRegistrationDocument(registrationId as string, documentId, file),
    onSuccess: () => invalidateDocuments(queryClient, registrationId),
  });
}

export function useReviewRegistrationDocument(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, payload }: { documentId: string; payload: ReviewDocumentRequest }) =>
      reviewRegistrationDocument(registrationId as string, documentId, payload),
    onSuccess: () => invalidateDocuments(queryClient, registrationId),
  });
}

export function useRejectRegistrationDocument(registrationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, payload }: { documentId: string; payload: RejectDocumentRequest }) =>
      rejectRegistrationDocument(registrationId as string, documentId, payload),
    onSuccess: () => invalidateDocuments(queryClient, registrationId),
  });
}

// ---------------------------------------------------------------------------------------- extraction

// Polls while ANY run is Pending/Running (the backend's own durable background worker moves them
// along; this only re-reads state -- no new frontend worker). Stops automatically once every run in
// the list has reached a terminal status (Succeeded | Failed | Cancelled).
export function useExtractionRuns(
  registrationId: string | null | undefined,
  documentId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: registrationQueryKeys.extractionRuns(registrationId || "", documentId || ""),
    queryFn: () => listExtractionRuns(registrationId as string, documentId as string),
    enabled: Boolean(registrationId) && Boolean(documentId) && enabled,
    refetchInterval: (query) => {
      const runs = query.state.data as ExtractionRun[] | undefined;
      return runs?.some((run) => NON_TERMINAL_RUN_STATUSES.has(run.status)) ? 3000 : false;
    },
  });
}

export function useExtractionRun(
  registrationId: string | null | undefined,
  documentId: string | null | undefined,
  runId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: registrationQueryKeys.extractionRun(registrationId || "", documentId || "", runId || ""),
    queryFn: () => getExtractionRun(registrationId as string, documentId as string, runId as string),
    enabled: Boolean(registrationId) && Boolean(documentId) && Boolean(runId) && enabled,
    refetchInterval: (query) => (NON_TERMINAL_RUN_STATUSES.has(query.state.data?.status || "") ? 3000 : false),
  });
}

export function useExtractedValues(
  registrationId: string | null | undefined,
  documentId: string | null | undefined,
  runId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: registrationQueryKeys.extractedValues(registrationId || "", documentId || "", runId || ""),
    queryFn: () => getExtractedValues(registrationId as string, documentId as string, runId as string),
    enabled: Boolean(registrationId) && Boolean(documentId) && Boolean(runId) && enabled,
  });
}

export function useTriggerExtraction(registrationId: string | null | undefined, documentId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TriggerExtractionRequest = {}) => triggerExtraction(registrationId as string, documentId as string, payload),
    onSuccess: () => {
      if (!registrationId || !documentId) return;
      queryClient.invalidateQueries({ queryKey: registrationQueryKeys.extractionRuns(registrationId, documentId) });
      invalidateDocuments(queryClient, registrationId); // the document's own extractionStatus changed too
    },
  });
}

function invalidateValues(
  queryClient: ReturnType<typeof useQueryClient>,
  registrationId: string | null | undefined,
  documentId: string | null | undefined,
  runId: string | null | undefined,
) {
  if (!registrationId || !documentId || !runId) return;
  queryClient.invalidateQueries({ queryKey: registrationQueryKeys.extractedValues(registrationId, documentId, runId) });
  invalidateRegistration(queryClient, registrationId); // a confirm/correct writes a field value
}

export function useConfirmExtractedValue(
  registrationId: string | null | undefined,
  documentId: string | null | undefined,
  runId: string | null | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (valueId: string) => confirmExtractedValue(registrationId as string, documentId as string, runId as string, valueId),
    onSuccess: () => invalidateValues(queryClient, registrationId, documentId, runId),
  });
}

export function useCorrectExtractedValue(
  registrationId: string | null | undefined,
  documentId: string | null | undefined,
  runId: string | null | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ valueId, payload }: { valueId: string; payload: CorrectExtractedValueRequest }) =>
      correctExtractedValue(registrationId as string, documentId as string, runId as string, valueId, payload),
    onSuccess: () => invalidateValues(queryClient, registrationId, documentId, runId),
  });
}

export function useRejectExtractedValue(
  registrationId: string | null | undefined,
  documentId: string | null | undefined,
  runId: string | null | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ valueId, payload }: { valueId: string; payload: RejectExtractedValueRequest }) =>
      rejectExtractedValue(registrationId as string, documentId as string, runId as string, valueId, payload),
    onSuccess: () => invalidateValues(queryClient, registrationId, documentId, runId),
  });
}
