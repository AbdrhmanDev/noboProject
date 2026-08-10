import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { branchQueryKeys, isBranchEnterable, useBranches } from "../hooks/useBranches";

const STORAGE_KEY = "nobo.currentBranchId";
const BRANCHES_VIEW_PERMISSION = "Branches.View";

type BranchContextValue = {
  currentBranchId: string | null;
  selectBranch: (branchId: string) => void;
  clearBranch: () => void;
  isBranchContextReady: boolean;
};

const BranchContext = createContext<BranchContextValue | null>(null);

function readPersistedBranchId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistBranchId(branchId: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, branchId);
  } catch {
    // ignore storage failures
  }
}

function removePersistedBranchId() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

type BranchProviderProps = {
  children: ReactNode;
};

export function BranchProvider({ children }: BranchProviderProps) {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const { currentCompanyId, isCompanyContextReady } = useCompany();
  const permissionQuery = useHasPermission(currentCompanyId, BRANCHES_VIEW_PERMISSION);
  const canLoadBranches =
    status === "authenticated" &&
    isCompanyContextReady &&
    Boolean(currentCompanyId) &&
    !permissionQuery.isLoading &&
    !permissionQuery.isError &&
    permissionQuery.hasPermission;
  const { data: branches } = useBranches(currentCompanyId, canLoadBranches);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const [isBranchContextReady, setIsBranchContextReady] = useState(false);
  const previousCompanyId = useRef<string | null>(null);

  const clearBranch = useCallback(() => {
    setCurrentBranchId(null);
    removePersistedBranchId();
  }, []);

  const selectBranch = useCallback((branchId: string) => {
    setCurrentBranchId(branchId);
    persistBranchId(branchId);
  }, []);

  useEffect(() => {
    if (previousCompanyId.current !== currentCompanyId) {
      clearBranch();
      setIsBranchContextReady(false);
      queryClient.removeQueries({ queryKey: branchQueryKeys.all });
      previousCompanyId.current = currentCompanyId;
    }
  }, [clearBranch, currentCompanyId, queryClient]);

  useEffect(() => {
    if (status === "checking") {
      setIsBranchContextReady(false);
      return;
    }

    if (status === "anonymous") {
      clearBranch();
      queryClient.removeQueries({ queryKey: branchQueryKeys.all });
      setIsBranchContextReady(false);
      return;
    }

    if (!currentCompanyId || !isCompanyContextReady) {
      setIsBranchContextReady(false);
      return;
    }

    if (permissionQuery.isLoading) {
      setIsBranchContextReady(false);
      return;
    }

    if (permissionQuery.isError || !permissionQuery.hasPermission) {
      clearBranch();
      setIsBranchContextReady(true);
      return;
    }

    if (!branches) return;

    const activeBranches = branches.filter(isBranchEnterable);
    const currentIsValid =
      currentBranchId &&
      activeBranches.some((branch) => branch.branchId === currentBranchId);
    const persistedBranchId = readPersistedBranchId();
    const persistedBranch = activeBranches.find(
      (branch) =>
        branch.branchId === persistedBranchId &&
        branch.companyId === currentCompanyId,
    );

    if (currentIsValid) {
      persistBranchId(currentBranchId);
      setIsBranchContextReady(true);
      return;
    }

    if (persistedBranch) {
      setCurrentBranchId(persistedBranch.branchId);
      persistBranchId(persistedBranch.branchId);
      setIsBranchContextReady(true);
      return;
    }

    if (activeBranches.length === 1) {
      setCurrentBranchId(activeBranches[0].branchId);
      persistBranchId(activeBranches[0].branchId);
      setIsBranchContextReady(true);
      return;
    }

    setCurrentBranchId(null);
    removePersistedBranchId();
    setIsBranchContextReady(true);
  }, [
    branches,
    clearBranch,
    currentBranchId,
    currentCompanyId,
    isCompanyContextReady,
    permissionQuery.hasPermission,
    permissionQuery.isError,
    permissionQuery.isLoading,
    status,
  ]);

  const value = useMemo<BranchContextValue>(
    () => ({
      currentBranchId,
      selectBranch,
      clearBranch,
      isBranchContextReady,
    }),
    [clearBranch, currentBranchId, isBranchContextReady, selectBranch],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const context = useContext(BranchContext);

  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }

  return context;
}
