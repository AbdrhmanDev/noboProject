import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { companyQueryKeys, useMyCompanies } from "../hooks/useCompanies";
import type { MyCompany } from "../types/company.types";

const STORAGE_KEY = "nobo.currentCompanyId";

type CompanyContextValue = {
  currentCompanyId: string | null;
  selectCompany: (companyId: string) => void;
  clearCompany: () => void;
  isCompanyContextReady: boolean;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function getCompanyDisplayName(company: MyCompany) {
  return company.tradeName || company.legalName;
}

export function isCompanyEnterable(company: MyCompany) {
  return company.companyStatus === "Active" && company.membershipStatus === "Active";
}

function readPersistedCompanyId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistCompanyId(companyId: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, companyId);
  } catch {
    // ignore storage failures
  }
}

function removePersistedCompanyId() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

type CompanyProviderProps = {
  children: ReactNode;
};

export function CompanyProvider({ children }: CompanyProviderProps) {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [isCompanyContextReady, setIsCompanyContextReady] = useState(false);
  const { data: companies } = useMyCompanies(status === "authenticated");

  const clearCompany = useCallback(() => {
    setCurrentCompanyId(null);
    removePersistedCompanyId();
  }, []);

  const selectCompany = useCallback((companyId: string) => {
    setCurrentCompanyId(companyId);
    persistCompanyId(companyId);
  }, []);

  useEffect(() => {
    if (status === "checking") {
      setIsCompanyContextReady(false);
      return;
    }

    if (status === "anonymous") {
      clearCompany();
      queryClient.removeQueries({ queryKey: companyQueryKeys.all });
      setIsCompanyContextReady(false);
    }
  }, [clearCompany, queryClient, status]);

  useEffect(() => {
    if (status !== "authenticated" || !companies) return;

    const enterableCompanies = companies.filter(isCompanyEnterable);
    const currentIsValid =
      currentCompanyId &&
      enterableCompanies.some((company) => company.companyId === currentCompanyId);
    const persistedCompanyId = readPersistedCompanyId();
    const persistedCompany = enterableCompanies.find(
      (company) => company.companyId === persistedCompanyId,
    );

    if (currentIsValid) {
      persistCompanyId(currentCompanyId);
      setIsCompanyContextReady(true);
      return;
    }

    if (persistedCompany) {
      setCurrentCompanyId(persistedCompany.companyId);
      persistCompanyId(persistedCompany.companyId);
      setIsCompanyContextReady(true);
      return;
    }

    if (enterableCompanies.length === 1) {
      setCurrentCompanyId(enterableCompanies[0].companyId);
      persistCompanyId(enterableCompanies[0].companyId);
      setIsCompanyContextReady(true);
      return;
    }

    setCurrentCompanyId(null);
    removePersistedCompanyId();
    setIsCompanyContextReady(true);
  }, [companies, currentCompanyId, status]);

  const value = useMemo<CompanyContextValue>(
    () => ({
      currentCompanyId,
      selectCompany,
      clearCompany,
      isCompanyContextReady,
    }),
    [clearCompany, currentCompanyId, isCompanyContextReady, selectCompany],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }

  return context;
}
