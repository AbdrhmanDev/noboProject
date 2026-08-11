import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Clock3,
  History,
  Monitor,
  ReceiptText,
  RefreshCw,
  Scale,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatDateTime, formatMoney } from "../../shared/utils/formatters";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  usePosShiftDetails,
  usePosShifts,
  usePosTerminals,
} from "../../features/pos/hooks/usePosTerminals";

const POS_VIEW_PERMISSION = "Pos.View";
const PAGE_SIZE = 25;

function toUtcStart(value) {
  return value ? `${value}T00:00:00.000Z` : undefined;
}

function toUtcEnd(value) {
  return value ? `${value}T23:59:59.999Z` : undefined;
}

function shortId(value) {
  return value ? value.slice(0, 8) : "-";
}

function statusTone(status) {
  if (status === "Open") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }

  return "border-slate-400/25 bg-slate-500/10 text-slate-200";
}

function movementTone(type) {
  if (type === "CashPayment" || type === "CashIn") return "text-emerald-300";
  if (type === "CashRefund" || type === "CashOut") return "text-rose-300";
  return "text-slate-300";
}

function movementIcon(type) {
  if (type === "CashIn" || type === "CashPayment") return ArrowDownToLine;
  if (type === "CashOut" || type === "CashRefund") return ArrowUpFromLine;
  return ReceiptText;
}

function moneyOrDash(value, currencyCode, minorUnitDigits) {
  return value === null || value === undefined
    ? "-"
    : formatMoney(value, currencyCode, minorUnitDigits);
}

function Metric({ label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "text-blue-300",
    green: "text-emerald-300",
    gold: "text-amber-300",
    pink: "text-pink-300",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-black ${tones[tone]}`}>{value}</div>
      {detail && <div className="mt-1 text-[10px] text-slate-500">{detail}</div>}
    </div>
  );
}

function ShiftRow({ shift, selected, onSelect }) {
  const variance = shift.cashVarianceAmount;
  const varianceTone =
    variance === null ? "text-slate-500" : variance < 0 ? "text-rose-300" : variance > 0 ? "text-amber-300" : "text-emerald-300";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-start transition hover:border-blue-400/40 hover:bg-blue-500/10 ${
        selected ? "border-blue-400/60 bg-blue-500/15" : "border-white/10 bg-[#0d1728]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Monitor size={14} className="text-blue-300" />
            <span className="truncate font-bold text-white">{shift.terminalCode}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusTone(shift.status)}`}>
              {shift.status}
            </span>
          </div>
          <div className="mt-1 truncate text-[11px] text-slate-500">{shift.terminalName}</div>
        </div>
        <div className="shrink-0 text-end">
          <div className={`text-xs font-black ${varianceTone}`}>
            {moneyOrDash(variance, shift.currencyCode, shift.currencyMinorUnitDigits)}
          </div>
          <div className="text-[10px] text-slate-500">variance</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Opened</div>
          <div className="mt-1 font-semibold text-slate-200">{formatDateTime(shift.openedAtUtc)}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">Closed</div>
          <div className="mt-1 font-semibold text-slate-200">
            {shift.closedAtUtc ? formatDateTime(shift.closedAtUtc) : "-"}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>Cash movements: {shift.cashMovementCount}</span>
        <span>Shift #{shortId(shift.posShiftId)}</span>
      </div>
    </button>
  );
}

function DetailsPanel({ query }) {
  if (query.isLoading) return <LoadingState label="Loading shift details..." />;
  if (query.isError) {
    return (
      <ErrorState
        title="Unable to load shift details"
        message={query.error?.message || "The selected shift could not be loaded."}
      />
    );
  }

  const shift = query.data;
  if (!shift) {
    return (
      <EmptyState
        title="Select a shift"
        message="Choose a shift from the history list to view reconciliation details."
      />
    );
  }

  const currency = shift.currencyCode;
  const digits = shift.currencyMinorUnitDigits;

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0b1424] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <History size={15} className="text-blue-300" />
            <span>Shift details</span>
            <span className="text-slate-600">#{shortId(shift.posShiftId)}</span>
          </div>
          <h2 className="mt-1 text-xl font-black text-white">
            {shift.terminalCode} · {shift.terminalName}
          </h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(shift.status)}`}>
          {shift.status}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Opened At" value={formatDateTime(shift.openedAtUtc)} detail={`User ${shortId(shift.openedByUserId)}`} />
        <Metric label="Closed At" value={shift.closedAtUtc ? formatDateTime(shift.closedAtUtc) : "-"} detail={shift.closedByUserId ? `User ${shortId(shift.closedByUserId)}` : "Open shift"} />
        <Metric label="Opening Float" value={formatMoney(shift.openingFloatAmount, currency, digits)} tone="blue" />
        <Metric label="Expected Cash" value={formatMoney(shift.expectedCashAmount, currency, digits)} tone="green" />
        <Metric label="Cash Payments" value={formatMoney(shift.cashPaymentsAmount, currency, digits)} tone="green" />
        <Metric label="Cash Refunds" value={formatMoney(shift.cashRefundsAmount, currency, digits)} tone="pink" />
        <Metric label="Cash In" value={formatMoney(shift.cashInAmount, currency, digits)} tone="green" />
        <Metric label="Cash Out" value={formatMoney(shift.cashOutAmount, currency, digits)} tone="pink" />
        <Metric label="Expected At Close" value={moneyOrDash(shift.expectedCashAmountAtClose, currency, digits)} tone="gold" />
        <Metric label="Counted Cash" value={moneyOrDash(shift.countedCashAmount, currency, digits)} tone="gold" />
        <Metric label="Variance" value={moneyOrDash(shift.cashVarianceAmount, currency, digits)} tone={shift.cashVarianceAmount && shift.cashVarianceAmount < 0 ? "pink" : "green"} />
        <Metric label="Closing Note" value={shift.closingNote || "-"} tone="blue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black">
            <ReceiptText size={16} className="text-blue-300" />
            Cash movement ledger
          </div>
          {shift.cashMovements.length === 0 ? (
            <EmptyState title="No cash movements" message="This shift has no cash movement rows." />
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
              {shift.cashMovements.map((movement) => {
                const MovementIcon = movementIcon(movement.type);
                return (
                  <div key={movement.id} className="rounded-xl border border-white/10 bg-[#0d1728] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <MovementIcon size={14} className={movementTone(movement.type)} />
                          <span>{movement.type}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {formatDateTime(movement.createdAtUtc)} · User {shortId(movement.createdByUserId)}
                        </div>
                        <div className="mt-1 truncate text-[11px] text-slate-400">
                          {movement.reason || "Server generated"}
                        </div>
                      </div>
                      <div className={`shrink-0 text-xs font-black ${movementTone(movement.type)}`}>
                        {formatMoney(movement.amountDelta, currency, digits)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black">
            <Scale size={16} className="text-amber-300" />
            Payment reconciliation
          </div>
          {shift.paymentMethods.length === 0 ? (
            <EmptyState title="No payment rows" message="This shift has no payment method reconciliation rows." />
          ) : (
            <div className="space-y-2">
              {shift.paymentMethods.map((method) => (
                <div key={method.paymentMethodId} className="rounded-xl border border-white/10 bg-[#0d1728] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-white">{method.name}</div>
                      <div className="mt-1 text-[10px] text-slate-500">{method.code} · {method.kind}</div>
                    </div>
                    <Banknote size={16} className="text-emerald-300" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <div className="text-slate-500">Gross</div>
                      <div className="font-bold text-slate-200">{formatMoney(method.grossPaidAmount, currency, digits)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Refunded</div>
                      <div className="font-bold text-rose-200">{formatMoney(method.refundedAmount, currency, digits)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Net</div>
                      <div className="font-bold text-emerald-200">{formatMoney(method.netPaidAmount, currency, digits)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function POSShiftHistoryPage() {
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [terminalId, setTerminalId] = useState("");
  const [status, setStatus] = useState("");
  const [openedFrom, setOpenedFrom] = useState("");
  const [openedTo, setOpenedTo] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  const permissionQuery = useHasPermission(currentCompanyId, POS_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !permissionQuery.isLoading &&
    permissionQuery.hasPermission;
  const terminalsQuery = usePosTerminals(currentCompanyId, currentBranchId, canQuery);
  const filters = useMemo(
    () => ({
      posTerminalId: terminalId || undefined,
      status,
      openedFromUtc: toUtcStart(openedFrom),
      openedToUtc: toUtcEnd(openedTo),
      pageNumber,
      pageSize: PAGE_SIZE,
    }),
    [openedFrom, openedTo, pageNumber, status, terminalId],
  );
  const shiftsQuery = usePosShifts(currentCompanyId, currentBranchId, filters, canQuery);
  const selectedShift =
    shiftsQuery.data?.items.find((shift) => shift.posShiftId === selectedShiftId) ||
    shiftsQuery.data?.items[0] ||
    null;
  const detailsQuery = usePosShiftDetails(
    currentCompanyId,
    currentBranchId,
    selectedShift?.posShiftId,
    canQuery && Boolean(selectedShift),
  );

  const resetFilters = () => {
    setTerminalId("");
    setStatus("");
    setOpenedFrom("");
    setOpenedTo("");
    setPageNumber(1);
    setSelectedShiftId(null);
  };

  return (
    <AppLayout>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <History size={16} className="text-blue-300" />
                POS · Operational history
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">Shift History</h1>
            </div>
            <button
              type="button"
              onClick={() => shiftsQuery.refetch()}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState title="Company and branch required" message="Select a company and branch to view POS shift history." />
        ) : permissionQuery.isLoading ? (
          <LoadingState label="Checking POS permission..." />
        ) : !permissionQuery.hasPermission ? (
          <ErrorState title="Permission required" message="Pos.View permission is required to view shift history." />
        ) : (
          <>
            <section className="grid gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3 md:grid-cols-5">
              <label className="text-[11px] font-semibold text-slate-400">
                Terminal
                <select
                  value={terminalId}
                  onChange={(event) => {
                    setTerminalId(event.target.value);
                    setPageNumber(1);
                    setSelectedShiftId(null);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">All terminals</option>
                  {terminalsQuery.data?.map((terminal) => (
                    <option key={terminal.posTerminalId} value={terminal.posTerminalId}>
                      {terminal.code} · {terminal.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                Status
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPageNumber(1);
                    setSelectedShiftId(null);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">All statuses</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                Opened From
                <input
                  type="date"
                  value={openedFrom}
                  onChange={(event) => {
                    setOpenedFrom(event.target.value);
                    setPageNumber(1);
                    setSelectedShiftId(null);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                />
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                Opened To
                <input
                  type="date"
                  value={openedTo}
                  onChange={(event) => {
                    setOpenedTo(event.target.value);
                    setPageNumber(1);
                    setSelectedShiftId(null);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                />
              </label>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-auto h-10 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-bold text-slate-200"
              >
                Reset
              </button>
            </section>

            <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
              <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black">
                    <Clock3 size={16} className="text-blue-300" />
                    Shifts
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {shiftsQuery.data?.totalCount ?? 0} total
                  </div>
                </div>

                {shiftsQuery.isLoading && <LoadingState label="Loading shifts..." />}
                {shiftsQuery.isError && (
                  <ErrorState
                    title="Unable to load shifts"
                    message={shiftsQuery.error?.message || "Shift history could not be loaded."}
                  />
                )}
                {!shiftsQuery.isLoading && !shiftsQuery.isError && shiftsQuery.data?.items.length === 0 && (
                  <EmptyState title="No shifts found" message="No POS shifts match the current filters." />
                )}
                {!shiftsQuery.isLoading && !shiftsQuery.isError && Boolean(shiftsQuery.data?.items.length) && (
                  <div className="max-h-[calc(100vh-380px)] min-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-none">
                    {shiftsQuery.data.items.map((shift) => (
                      <ShiftRow
                        key={shift.posShiftId}
                        shift={shift}
                        selected={selectedShift?.posShiftId === shift.posShiftId}
                        onSelect={() => setSelectedShiftId(shift.posShiftId)}
                      />
                    ))}
                  </div>
                )}

                {shiftsQuery.data && shiftsQuery.data.totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                      className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-400">
                      Page {shiftsQuery.data.pageNumber} / {shiftsQuery.data.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={pageNumber >= shiftsQuery.data.totalPages}
                      onClick={() => setPageNumber((page) => page + 1)}
                      className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </section>

              <DetailsPanel query={detailsQuery} />
            </div>
          </>
        )}
      </main>
    </AppLayout>
  );
}
