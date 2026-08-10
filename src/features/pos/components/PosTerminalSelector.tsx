import { CheckCircle2, Monitor, RefreshCw } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { formatMoney } from "../../../shared/utils/formatters";
import { useBranch } from "../../branches/context/BranchContext";
import { useCompany } from "../../companies/context/CompanyContext";
import { usePos } from "../context/PosContext";
import { isTerminalEnterable, usePosTerminals } from "../hooks/usePosTerminals";

export function PosTerminalSelector() {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const { selectPosTerminal } = usePos();
  const {
    data: terminals,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePosTerminals(currentCompanyId, currentBranchId);

  if (isLoading) return <LoadingState label="Loading POS terminals..." />;
  if (isError) {
    return (
      <ErrorState
        title="Unable to load POS terminals"
        message="Please refresh or contact your administrator."
      />
    );
  }

  if (!terminals?.length) {
    return (
      <EmptyState
        title="No POS terminals found"
        message="This branch does not have configured terminals yet."
      />
    );
  }

  const hasActiveTerminal = terminals.some((terminal) =>
    isTerminalEnterable(terminal.status),
  );

  return (
    <section className="panel rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
            <Monitor size={20} />
          </div>
          <div>
            <h1 className="brand-text text-xl font-black">Select POS Terminal</h1>
            <p className="text-xs text-slate-400">
              {hasActiveTerminal
                ? "Choose an active terminal for this branch."
                : "No active terminal is currently available."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-bold text-slate-200 transition hover:border-blue-400/45 hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {terminals.map((terminal) => {
          const enterable = isTerminalEnterable(terminal.status);
          const hasOpenShift = Boolean(terminal.openShift);

          return (
            <button
              key={terminal.posTerminalId}
              type="button"
              disabled={!enterable}
              onClick={() => selectPosTerminal(terminal.posTerminalId)}
              className="group rounded-2xl border border-white/10 bg-[#0d1728]/75 p-4 text-start transition hover:border-blue-400/45 hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-white/10 disabled:hover:bg-[#0d1728]/75"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-black text-white">
                    <Monitor size={16} className="text-blue-300" />
                    {terminal.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{terminal.code}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    terminal.status === "Active"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  {terminal.status}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.025] p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <CheckCircle2
                    size={15}
                    className={hasOpenShift ? "text-emerald-300" : "text-slate-500"}
                  />
                  {hasOpenShift ? "Shift Open" : "No Open Shift"}
                </div>
                {terminal.openShift ? (
                  <div className="mt-2 text-[11px] text-slate-400">
                    Expected Cash:{" "}
                    <span className="font-bold text-emerald-300">
                      {formatMoney(terminal.openShift.expectedCashAmount, "SAR", 2)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-slate-500">
                    Select to open or inspect current shift state.
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
