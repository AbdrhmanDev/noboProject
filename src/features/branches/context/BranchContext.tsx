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
import { branchQueryKeys, isBranchEnterable, useMyBranches } from "../hooks/useBranches";

const STORAGE_KEY = "nobo.currentBranchId";

type BranchContextValue = {
  currentBranchId: string | null;
  selectBranch: (branchId: string) => void;
  clearBranch: () => void;
  isBranchContextReady: boolean;
  debug?: unknown;
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
  // Deliberately the SAME enabled condition BranchGate.tsx uses for its own useMyBranches call
  // (isCompanyContextReady && Boolean(currentCompanyId), no extra auth-status check here) --
  // isCompanyContextReady can only become true once already authenticated (CompanyContext requires
  // status === "authenticated" to populate it), so the check was redundant. Keeping the two
  // "enabled" expressions textually different was enough to desync their TanStack Query observers:
  // one would report status "pending"/fetchStatus "fetching" forever while the other, reading the
  // identical queryKey, had already resolved to "success" with data -- a timing/enabled mismatch
  // between two useQuery() calls for the same key, not a server or data problem.
  const canLoadBranches = isCompanyContextReady && Boolean(currentCompanyId);
  // Self-scoped (no Branches.View required) -- a cashier-only role must be able to resolve their
  // own working branch without being granted Branches.View, which would also surface the Branches
  // admin nav item for them.
  const branchesQuery = useMyBranches(currentCompanyId, canLoadBranches);
  const { data: branches, isSuccess: branchesLoaded, isError: branchesErrored } = branchesQuery;
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
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
      // invalidateQueries, NOT removeQueries: removeQueries destroys the Query object outright,
      // which can orphan an already-mounted useQuery() observer (e.g. this provider's own
      // useMyBranches call, alive for the app's whole lifetime) from the fresh Query object a
      // later/different observer (e.g. BranchGate's) creates for the same key -- producing two
      // observers of the "same" key stuck reporting different states (one permanently
      // pending/fetching, the other success) forever. invalidateQueries marks the existing Query
      // stale and refetches it in place, so every existing observer stays correctly bound.
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.all });
      previousCompanyId.current = currentCompanyId;
    }
  }, [clearBranch, currentCompanyId, queryClient]);

  useEffect(() => {
    if (status === "anonymous") {
      clearBranch();
      queryClient.removeQueries({ queryKey: branchQueryKeys.all });
    }
  }, [clearBranch, queryClient, status]);

  // Auto-selects a branch once the list is known. Deliberately NOT part of readiness below --
  // readiness only needs to know the branches QUERY has settled, not that a branch was picked
  // (zero/multiple active branches is a valid settled state, handled by BranchGate's own render).
  useEffect(() => {
    if (!branches || !currentCompanyId) return;

    const activeBranches = branches.filter(isBranchEnterable);
    const currentIsValid =
      currentBranchId && activeBranches.some((branch) => branch.branchId === currentBranchId);

    if (currentIsValid) {
      persistBranchId(currentBranchId as string);
      return;
    }

    const persistedBranchId = readPersistedBranchId();
    const persistedBranch = activeBranches.find(
      (branch) => branch.branchId === persistedBranchId && branch.companyId === currentCompanyId,
    );

    if (persistedBranch) {
      setCurrentBranchId(persistedBranch.branchId);
      persistBranchId(persistedBranch.branchId);
      return;
    }

    if (activeBranches.length === 1) {
      setCurrentBranchId(activeBranches[0].branchId);
      persistBranchId(activeBranches[0].branchId);
      return;
    }

    if (currentBranchId !== null) {
      setCurrentBranchId(null);
      removePersistedBranchId();
    }
  }, [branches, currentBranchId, currentCompanyId]);

  // Derived directly from this render's own values (not a separately-scheduled effect+setState
  // pair) so there is no timing window where fresh query data and a stale "ready" flag coexist.
  const isBranchContextReady =
    status === "checking"
      ? false
      : status === "anonymous"
        ? false
        : !isCompanyContextReady
          ? false
          : !currentCompanyId
            ? true
            : branchesLoaded || branchesErrored;

  const value = useMemo<BranchContextValue>(
    () => ({
      currentBranchId,
      selectBranch,
      clearBranch,
      isBranchContextReady,
      debug: {
        authStatus: status,
        isCompanyContextReady,
        currentCompanyId,
        canLoadBranches,
        queryStatus: branchesQuery.status,
        queryFetchStatus: branchesQuery.fetchStatus,
        branchesLoaded,
        branchesErrored,
        branchesLen: branches?.length ?? null,
      },
    }),
    [
      clearBranch,
      currentBranchId,
      isBranchContextReady,
      selectBranch,
      status,
      isCompanyContextReady,
      currentCompanyId,
      canLoadBranches,
      branchesQuery.status,
      branchesQuery.fetchStatus,
      branchesLoaded,
      branchesErrored,
      branches,
    ],
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
