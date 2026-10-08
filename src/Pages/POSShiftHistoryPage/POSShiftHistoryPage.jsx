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
import { useI18n } from "../../i18n/I18nContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  usePosShiftDetails,
  usePosShifts,
  usePosTerminals,
} from "../../features/pos/hooks/usePosTerminals";
import { POS_VIEW_PERMISSION } from "../../features/authorization/constants/applicationPermissions";

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

function statusLabel(status, t) {
  return status === "Open" ? t("posShiftHistory.status.open") : t("posShiftHistory.status.closed");
}

const MOVEMENT_TYPE_LABEL_KEYS = {
  CashPayment: "posShiftHistory.movementType.cashPayment",
  CashIn: "posShiftHistory.movementType.cashIn",
  CashRefund: "posShiftHistory.movementType.cashRefund",
  CashOut: "posShiftHistory.movementType.cashOut",
};

function movementTypeLabel(type, t) {
  const key = MOVEMENT_TYPE_LABEL_KEYS[type];
  return key ? t(key) : type;
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
  const { t } = useI18n();
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
              {statusLabel(shift.status, t)}
            </span>
          </div>
          <div className="mt-1 truncate text-[11px] text-slate-500">{shift.terminalName}</div>
        </div>
        <div className="shrink-0 text-end">
          <div className={`text-xs font-black ${varianceTone}`}>
            {moneyOrDash(variance, shift.currencyCode, shift.currencyMinorUnitDigits)}
          </div>
          <div className="text-[10px] text-slate-500">{t("posShiftHistory.card.variance")}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("posShiftHistory.card.opened")}</div>
          <div className="mt-1 font-semibold text-slate-200">{formatDateTime(shift.openedAtUtc)}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2">
          <div className="text-slate-500">{t("posShiftHistory.card.closed")}</div>
          <div className="mt-1 font-semibold text-slate-200">
            {shift.closedAtUtc ? formatDateTime(shift.closedAtUtc) : "-"}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>{t("posShiftHistory.card.cashMovements", { count: shift.cashMovementCount })}</span>
        <span>{t("posShiftHistory.card.shiftId", { id: shortId(shift.posShiftId) })}</span>
      </div>
    </button>
  );
}

function DetailsPanel({ query }) {
  const { t } = useI18n();
  if (query.isLoading) return <LoadingState label={t("posShiftHistory.loadingDetails")} />;
  if (query.isError) {
    return (
      <ErrorState
        title={t("posShiftHistory.loadDetailsError")}
        message={query.error?.message || t("posShiftHistory.loadDetailsErrorFallback")}
      />
    );
  }

  const shift = query.data;
  if (!shift) {
    return (
      <EmptyState
        title={t("posShiftHistory.emptySelectShift.title")}
        message={t("posShiftHistory.emptySelectShift.message")}
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
            <span>{t("posShiftHistory.details.label")}</span>
            <span className="text-slate-600">#{shortId(shift.posShiftId)}</span>
          </div>
          <h2 className="mt-1 text-xl font-black text-white">
            {shift.terminalCode} · {shift.terminalName}
          </h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(shift.status)}`}>
          {statusLabel(shift.status, t)}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t("posShiftHistory.metric.openedAt")} value={formatDateTime(shift.openedAtUtc)} detail={t("posShiftHistory.userIdLabel", { id: shortId(shift.openedByUserId) })} />
        <Metric label={t("posShiftHistory.metric.closedAt")} value={shift.closedAtUtc ? formatDateTime(shift.closedAtUtc) : "-"} detail={shift.closedByUserId ? t("posShiftHistory.userIdLabel", { id: shortId(shift.closedByUserId) }) : t("posShiftHistory.openShiftLabel")} />
        <Metric label={t("posShiftHistory.metric.openingFloat")} value={formatMoney(shift.openingFloatAmount, currency, digits)} tone="blue" />
        <Metric label={t("posShiftHistory.metric.expectedCash")} value={formatMoney(shift.expectedCashAmount, currency, digits)} tone="green" />
        <Metric label={t("posShiftHistory.metric.cashPayments")} value={formatMoney(shift.cashPaymentsAmount, currency, digits)} tone="green" />
        <Metric label={t("posShiftHistory.metric.cashRefunds")} value={formatMoney(shift.cashRefundsAmount, currency, digits)} tone="pink" />
        <Metric label={t("posShiftHistory.metric.cashIn")} value={formatMoney(shift.cashInAmount, currency, digits)} tone="green" />
        <Metric label={t("posShiftHistory.metric.cashOut")} value={formatMoney(shift.cashOutAmount, currency, digits)} tone="pink" />
        <Metric label={t("posShiftHistory.metric.expectedAtClose")} value={moneyOrDash(shift.expectedCashAmountAtClose, currency, digits)} tone="gold" />
        <Metric label={t("posShiftHistory.metric.countedCash")} value={moneyOrDash(shift.countedCashAmount, currency, digits)} tone="gold" />
        <Metric label={t("posShiftHistory.metric.variance")} value={moneyOrDash(shift.cashVarianceAmount, currency, digits)} tone={shift.cashVarianceAmount && shift.cashVarianceAmount < 0 ? "pink" : "green"} />
        <Metric label={t("posShiftHistory.metric.closingNote")} value={shift.closingNote || "-"} tone="blue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black">
            <ReceiptText size={16} className="text-blue-300" />
            {t("posShiftHistory.ledger.heading")}
          </div>
          {shift.cashMovements.length === 0 ? (
            <EmptyState title={t("posShiftHistory.emptyMovements.title")} message={t("posShiftHistory.emptyMovements.message")} />
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
                          <span>{movementTypeLabel(movement.type, t)}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {t("posShiftHistory.movement.dateUser", {
                            date: formatDateTime(movement.createdAtUtc),
                            id: shortId(movement.createdByUserId),
                          })}
                        </div>
                        <div className="mt-1 truncate text-[11px] text-slate-400">
                          {movement.reason || t("posShiftHistory.movement.serverGenerated")}
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
            {t("posShiftHistory.reconciliation.heading")}
          </div>
          {shift.paymentMethods.length === 0 ? (
            <EmptyState title={t("posShiftHistory.emptyPayments.title")} message={t("posShiftHistory.emptyPayments.message")} />
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
                      <div className="text-slate-500">{t("posShiftHistory.payment.gross")}</div>
                      <div className="font-bold text-slate-200">{formatMoney(method.grossPaidAmount, currency, digits)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">{t("posShiftHistory.payment.refunded")}</div>
                      <div className="font-bold text-rose-200">{formatMoney(method.refundedAmount, currency, digits)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">{t("posShiftHistory.payment.net")}</div>
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
  const { t } = useI18n();
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
                {t("posShiftHistory.breadcrumb")}
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">{t("posShiftHistory.pageTitle")}</h1>
            </div>
            <button
              type="button"
              onClick={() => shiftsQuery.refetch()}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
            >
              <RefreshCw size={14} />
              {t("posShiftHistory.refresh")}
            </button>
          </div>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState title={t("posShiftHistory.gate.companyRequired.title")} message={t("posShiftHistory.gate.companyRequired.message")} />
        ) : permissionQuery.isLoading ? (
          <LoadingState label={t("posShiftHistory.gate.checkingPermission")} />
        ) : !permissionQuery.hasPermission ? (
          <ErrorState title={t("posShiftHistory.gate.permissionRequired.title")} message={t("posShiftHistory.gate.permissionRequired.message")} />
        ) : (
          <>
            <section className="grid gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3 md:grid-cols-5">
              <label className="text-[11px] font-semibold text-slate-400">
                {t("posShiftHistory.field.terminal")}
                <select
                  value={terminalId}
                  onChange={(event) => {
                    setTerminalId(event.target.value);
                    setPageNumber(1);
                    setSelectedShiftId(null);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("posShiftHistory.field.allTerminals")}</option>
                  {terminalsQuery.data?.map((terminal) => (
                    <option key={terminal.posTerminalId} value={terminal.posTerminalId}>
                      {terminal.code} · {terminal.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("posShiftHistory.field.status")}
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPageNumber(1);
                    setSelectedShiftId(null);
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                >
                  <option value="">{t("posShiftHistory.common.allStatuses")}</option>
                  <option value="Open">{t("posShiftHistory.status.open")}</option>
                  <option value="Closed">{t("posShiftHistory.status.closed")}</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-400">
                {t("posShiftHistory.field.openedFrom")}
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
                {t("posShiftHistory.field.openedTo")}
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
                {t("posShiftHistory.action.reset")}
              </button>
            </section>

            <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
              <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black">
                    <Clock3 size={16} className="text-blue-300" />
                    {t("posShiftHistory.shiftsHeading")}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t("posShiftHistory.totalCount", { count: shiftsQuery.data?.totalCount ?? 0 })}
                  </div>
                </div>

                {shiftsQuery.isLoading && <LoadingState label={t("posShiftHistory.loadingShifts")} />}
                {shiftsQuery.isError && (
                  <ErrorState
                    title={t("posShiftHistory.loadShiftsError")}
                    message={shiftsQuery.error?.message || t("posShiftHistory.loadShiftsErrorFallback")}
                  />
                )}
                {!shiftsQuery.isLoading && !shiftsQuery.isError && shiftsQuery.data?.items.length === 0 && (
                  <EmptyState title={t("posShiftHistory.emptyShifts.title")} message={t("posShiftHistory.emptyShifts.message")} />
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
                      {t("posShiftHistory.action.previous")}
                    </button>
                    <span className="text-xs text-slate-400">
                      {t("posShiftHistory.pageOf", {
                        page: shiftsQuery.data.pageNumber,
                        total: shiftsQuery.data.totalPages,
                      })}
                    </span>
                    <button
                      type="button"
                      disabled={pageNumber >= shiftsQuery.data.totalPages}
                      onClick={() => setPageNumber((page) => page + 1)}
                      className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("posShiftHistory.action.next")}
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
