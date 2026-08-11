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
import { useBranch } from "../../branches/context/BranchContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { isTerminalEnterable, posQueryKeys, usePosTerminals } from "../hooks/usePosTerminals";

const STORAGE_KEY = "nobo.currentPosTerminalId";
const POS_VIEW_PERMISSION = "Pos.View";

type PosContextValue = {
  currentPosTerminalId: string | null;
  selectPosTerminal: (posTerminalId: string) => void;
  clearPosTerminal: () => void;
  isPosTerminalContextReady: boolean;
};

const PosContext = createContext<PosContextValue | null>(null);

function readPersistedTerminalId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistTerminalId(posTerminalId: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, posTerminalId);
  } catch {
    // ignore storage failures
  }
}

function removePersistedTerminalId() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

type PosProviderProps = {
  children: ReactNode;
};

export function PosProvider({ children }: PosProviderProps) {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const { currentCompanyId, isCompanyContextReady } = useCompany();
  const { currentBranchId, isBranchContextReady } = useBranch();
  const permissionQuery = useHasPermission(currentCompanyId, POS_VIEW_PERMISSION);
  const canLoadTerminals =
    status === "authenticated" &&
    isCompanyContextReady &&
    isBranchContextReady &&
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !permissionQuery.isLoading &&
    !permissionQuery.isError &&
    permissionQuery.hasPermission;
  const {
    data: terminals,
    isError: terminalsError,
    isLoading: terminalsLoading,
  } = usePosTerminals(currentCompanyId, currentBranchId, canLoadTerminals);
  const [currentPosTerminalId, setCurrentPosTerminalId] = useState<string | null>(null);
  const [isPosTerminalContextReady, setIsPosTerminalContextReady] = useState(false);
  const previousScope = useRef<string>("");

  const clearPosTerminal = useCallback(() => {
    setCurrentPosTerminalId(null);
    removePersistedTerminalId();
  }, []);

  const selectPosTerminal = useCallback((posTerminalId: string) => {
    setCurrentPosTerminalId(posTerminalId);
    persistTerminalId(posTerminalId);
  }, []);

  useEffect(() => {
    const scope = `${currentCompanyId || ""}:${currentBranchId || ""}`;
    if (previousScope.current !== scope) {
      clearPosTerminal();
      setIsPosTerminalContextReady(false);
      queryClient.removeQueries({ queryKey: posQueryKeys.all });
      previousScope.current = scope;
    }
  }, [clearPosTerminal, currentBranchId, currentCompanyId, queryClient]);

  useEffect(() => {
    if (status === "checking") {
      setIsPosTerminalContextReady(false);
      return;
    }

    if (status === "anonymous") {
      clearPosTerminal();
      queryClient.removeQueries({ queryKey: posQueryKeys.all });
      setIsPosTerminalContextReady(false);
      return;
    }

    if (!currentCompanyId || !currentBranchId || !isBranchContextReady) {
      setIsPosTerminalContextReady(false);
      return;
    }

    if (permissionQuery.isLoading) {
      setIsPosTerminalContextReady(false);
      return;
    }

    if (permissionQuery.isError || !permissionQuery.hasPermission) {
      clearPosTerminal();
      setIsPosTerminalContextReady(true);
      return;
    }

    if (terminalsLoading) {
      setIsPosTerminalContextReady(false);
      return;
    }

    if (terminalsError) {
      clearPosTerminal();
      setIsPosTerminalContextReady(true);
      return;
    }

    if (!terminals) {
      setIsPosTerminalContextReady(false);
      return;
    }

    const activeTerminals = terminals.filter((terminal) =>
      isTerminalEnterable(terminal.status),
    );
    const currentIsValid =
      currentPosTerminalId &&
      activeTerminals.some(
        (terminal) => terminal.posTerminalId === currentPosTerminalId,
      );
    const persistedTerminalId = readPersistedTerminalId();
    const persistedTerminal = activeTerminals.find(
      (terminal) =>
        terminal.posTerminalId === persistedTerminalId &&
        terminal.branchId === currentBranchId,
    );

    if (currentIsValid) {
      persistTerminalId(currentPosTerminalId);
      setIsPosTerminalContextReady(true);
      return;
    }

    if (persistedTerminal) {
      setCurrentPosTerminalId(persistedTerminal.posTerminalId);
      persistTerminalId(persistedTerminal.posTerminalId);
      setIsPosTerminalContextReady(true);
      return;
    }

    if (activeTerminals.length === 1) {
      setCurrentPosTerminalId(activeTerminals[0].posTerminalId);
      persistTerminalId(activeTerminals[0].posTerminalId);
      setIsPosTerminalContextReady(true);
      return;
    }

    setCurrentPosTerminalId(null);
    removePersistedTerminalId();
    setIsPosTerminalContextReady(true);
  }, [
    clearPosTerminal,
    currentBranchId,
    currentCompanyId,
    currentPosTerminalId,
    isBranchContextReady,
    permissionQuery.hasPermission,
    permissionQuery.isError,
    permissionQuery.isLoading,
    queryClient,
    status,
    terminals,
    terminalsError,
    terminalsLoading,
  ]);

  const resolvedPosTerminalContextReady =
    isPosTerminalContextReady || terminalsError || Array.isArray(terminals);

  const value = useMemo<PosContextValue>(
    () => ({
      currentPosTerminalId,
      selectPosTerminal,
      clearPosTerminal,
      isPosTerminalContextReady: resolvedPosTerminalContextReady,
    }),
    [
      clearPosTerminal,
      currentPosTerminalId,
      resolvedPosTerminalContextReady,
      selectPosTerminal,
    ],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const context = useContext(PosContext);

  if (!context) {
    throw new Error("usePos must be used within a PosProvider");
  }

  return context;
}
