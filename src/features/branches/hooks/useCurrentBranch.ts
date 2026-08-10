import { useCompany } from "../../companies/context/CompanyContext";
import { useBranch } from "../context/BranchContext";
import { useBranches } from "./useBranches";

export function useCurrentBranch() {
  const { currentBranchId } = useBranch();
  const { currentCompanyId } = useCompany();
  const { data: branches = [] } = useBranches(
    currentCompanyId,
    Boolean(currentCompanyId),
  );

  return branches.find((branch) => branch.branchId === currentBranchId) || null;
}
