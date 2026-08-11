import type { ReactNode } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { useBranch } from "../../branches/context/BranchContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { usePos } from "../context/PosContext";
import { useOpenPosShift } from "../hooks/useOpenPosShift";
import { isTerminalEnterable, usePosTerminals } from "../hooks/usePosTerminals";
import { OpenShiftPanel } from "./OpenShiftPanel";
import { OpenShiftSummary } from "./OpenShiftSummary";
import { PosTerminalSelector } from "./PosTerminalSelector";

const POS_VIEW_PERMISSION = "Pos.View";

type PosOperationalGateProps = {
  children: ReactNode;
};

export function PosOperationalGate({ children }: PosOperationalGateProps) {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const { currentPosTerminalId, isPosTerminalContextReady } = usePos();
  const permissionQuery = useHasPermission(currentCompanyId, POS_VIEW_PERMISSION);
  const canLoadTerminals =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !permissionQuery.isLoading &&
    !permissionQuery.isError &&
    permissionQuery.hasPermission;
  const {
    data: terminals,
    isLoading: terminalsLoading,
    isError: terminalsError,
    refetch: refetchTerminals,
  } = usePosTerminals(currentCompanyId, currentBranchId, canLoadTerminals);
  const selectedTerminal = terminals?.find(
    (terminal) => terminal.posTerminalId === currentPosTerminalId,
  );
  const openShiftQuery = useOpenPosShift(
    currentCompanyId,
    currentBranchId,
    currentPosTerminalId,
    Boolean(selectedTerminal),
  );

  if (!currentCompanyId || !currentBranchId) {
    return (
      <ErrorState
        title="POS context unavailable"
        message="Company and branch must be selected before opening POS."
      />
    );
  }

  if (permissionQuery.isLoading) {
    return <LoadingState label="Checking POS permissions..." />;
  }

  if (permissionQuery.isError) {
    return (
      <ErrorState
        title="POS permissions unavailable"
        message="Unable to confirm POS access for this company."
      />
    );
  }

  if (!permissionQuery.hasPermission) {
    return (
      <EmptyState
        title="POS access unavailable"
        message="Your current role cannot view POS terminals for this company."
      />
    );
  }

  if (terminalsLoading) return <LoadingState label="Loading POS terminals..." />;

  if (terminalsError) {
    return (
      <ErrorState
        title="POS terminals unavailable"
        message="Unable to load POS terminals for this branch."
      />
    );
  }

  if (!terminals) {
    return <LoadingState label="Preparing POS terminal..." />;
  }

  if (!isPosTerminalContextReady && currentPosTerminalId) {
    return <LoadingState label="Preparing POS terminal..." />;
  }

  if (!terminals.length) {
    return (
      <EmptyState
        title="No POS terminals found"
        message="This branch does not have configured POS terminals."
      />
    );
  }

  if (!terminals.some((terminal) => isTerminalEnterable(terminal.status))) {
    return <PosTerminalSelector />;
  }

  if (!selectedTerminal) return <PosTerminalSelector />;

  if (!isTerminalEnterable(selectedTerminal.status)) {
    return (
      <ErrorState
        title="Terminal unavailable"
        message="The selected terminal is suspended. Choose another active terminal."
      />
    );
  }

  if (openShiftQuery.isLoading) {
    return <LoadingState label="Checking open shift..." />;
  }

  if (openShiftQuery.isError) {
    return (
      <ErrorState
        title="Shift state unavailable"
        message="Unable to confirm the current POS shift."
      />
    );
  }

  if (!openShiftQuery.data) {
    return (
      <OpenShiftPanel
        terminal={selectedTerminal}
        onOpened={() => {
          refetchTerminals();
          openShiftQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <OpenShiftSummary shift={openShiftQuery.data} />
      {children}
    </div>
  );
}
