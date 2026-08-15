import { ArrowDownToLine, ArrowUpFromLine, Calculator, History, LockKeyhole } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import {
  formatPaymentDate,
  getCashMovementLabel,
  getCashMovementTone,
  isManualCashMovement,
} from "../../utils/posFormatters";
import { PosModal } from "../PosModal";
import { Metric } from "../PosPrimitives";

export function ShiftDialogs({
  modal,
  setModal,
  // Cash movement
  cashMovementDraft,
  setCashMovementDraft,
  expectedCashAmount,
  shiftCurrencyCode,
  shiftMinorUnitDigits,
  openShiftId,
  cashDrawerPermissionQuery,
  cashMovementAmount,
  canSubmitCashMovement,
  submitCashMovement,
  recentCashMovements,
  // Open shift
  // Close shift
  openShiftQuery,
  currentPosTerminalId,
  variancePreview,
  countedCashInput,
  setCountedCashInput,
  countedCash,
  closingNoteInput,
  setClosingNoteInput,
  hasOpenShift,
  closeShiftPermissionQuery,
  lastClosedShift,
  closeCurrentShift,
  canCloseShift,
  closeShiftMutation,
}) {
  return (
    <>
      {modal === "cashMovement" && (
        <PosModal title="Cash Drawer Movement" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCashMovementDraft((draft) => ({ ...draft, type: "CashIn" }))}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold ${cashMovementDraft.type === "CashIn" ? "border-emerald-400 bg-emerald-500/15 text-emerald-100" : "border-white/10 bg-white/[0.025] text-slate-300"}`}
              >
                <ArrowDownToLine size={15} />
                Cash In
              </button>
              <button
                type="button"
                onClick={() => setCashMovementDraft((draft) => ({ ...draft, type: "CashOut" }))}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold ${cashMovementDraft.type === "CashOut" ? "border-rose-400 bg-rose-500/15 text-rose-100" : "border-white/10 bg-white/[0.025] text-slate-300"}`}
              >
                <ArrowUpFromLine size={15} />
                Cash Out
              </button>
            </div>

            <Metric
              label="Expected cash"
              value={formatMoney(expectedCashAmount, shiftCurrencyCode, shiftMinorUnitDigits)}
              detail="Server-owned drawer balance"
              tone="green"
            />

            {!openShiftId && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Open POS shift is required.
              </div>
            )}
            {!cashDrawerPermissionQuery.hasPermission && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Pos.AdjustCashDrawer permission is required.
              </div>
            )}

            <label className="block text-xs text-slate-400">Amount</label>
            <input
              type="text"
              inputMode="decimal"
              value={cashMovementDraft.amount}
              onChange={(event) => setCashMovementDraft((draft) => ({ ...draft, amount: event.target.value }))}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
              placeholder={formatMoney(0, shiftCurrencyCode, shiftMinorUnitDigits)}
            />
            {cashMovementDraft.amount && cashMovementAmount.error && (
              <p className="text-[10px] text-amber-200">{cashMovementAmount.error}</p>
            )}

            <label className="block text-xs text-slate-400">Reason</label>
            <textarea
              value={cashMovementDraft.reason}
              onChange={(event) => setCashMovementDraft((draft) => ({ ...draft, reason: event.target.value }))}
              className="h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none"
            />

            <button
              type="button"
              disabled={!canSubmitCashMovement}
              onClick={submitCashMovement}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 ${cashMovementDraft.type === "CashIn" ? "bg-emerald-600" : "bg-rose-600"}`}
            >
              {cashMovementDraft.type === "CashIn" ? <ArrowDownToLine size={15} /> : <ArrowUpFromLine size={15} />}
              Record {getCashMovementLabel(cashMovementDraft.type)}
            </button>

            <div className="border-t border-white/10 pt-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                <History size={13} />
                Current shift drawer activity
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {recentCashMovements.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                    No cash movement yet.
                  </div>
                )}
                {recentCashMovements.map((movement) => {
                  const manual = isManualCashMovement(movement.type);

                  return (
                    <div key={movement.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                            <span>{getCashMovementLabel(movement.type)}</span>
                            <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-400">
                              {manual ? "Manual" : "Automatic"}
                            </span>
                          </div>
                          <div className="mt-1 truncate text-[10px] text-slate-500">
                            {movement.reason || "Server generated"} - {formatPaymentDate(movement.createdAtUtc)}
                          </div>
                        </div>
                        <div className={`shrink-0 text-xs font-black ${getCashMovementTone(movement.type)}`}>
                          {formatMoney(movement.amountDelta, shiftCurrencyCode, shiftMinorUnitDigits)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </PosModal>
      )}

      {modal === "openShift" && (
        <PosModal title="Open POS shift" onClose={() => setModal(null)}>
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-50">
            <LockKeyhole size={17} className="mb-2 text-amber-300" />
            Open shift setup is handled by the POS operational gate before the workspace renders.
          </div>
          <button
            type="button"
            onClick={() => setModal(null)}
            className="mt-4 w-full rounded-xl bg-slate-700 py-2.5 text-xs font-bold text-white"
          >
            Close
          </button>
        </PosModal>
      )}

      {modal === "closeShift" && (
        <PosModal title="Close POS shift" onClose={() => setModal(null)} size="lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-2.5 text-xs leading-5 text-rose-50">
              <LockKeyhole size={16} className="shrink-0 text-rose-300" />
              <span>Cash reconciliation for the current open shift.</span>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              <Metric
                label="Terminal"
                value={openShiftQuery.data?.terminalCode || currentPosTerminalId || "-"}
                detail={openShiftQuery.data?.terminalName || "Current POS"}
                tone="blue"
              />
              <Metric
                label="Opened"
                value={formatPaymentDate(openShiftQuery.data?.openedAtUtc) || "-"}
                detail={openShiftQuery.data?.posShiftId || "No open shift"}
                tone="gold"
              />
              <Metric
                label="Opening float"
                value={formatMoney(
                  openShiftQuery.data?.openingFloatAmount ?? 0,
                  shiftCurrencyCode,
                  shiftMinorUnitDigits,
                )}
                detail="Server snapshot"
                tone="blue"
              />
              <Metric
                label="Cash payments"
                value={formatMoney(
                  openShiftQuery.data?.cashPaymentsAmount ?? 0,
                  shiftCurrencyCode,
                  shiftMinorUnitDigits,
                )}
                detail="Sales cash"
                tone="green"
              />
              <Metric
                label="Cash refunds"
                value={formatMoney(
                  openShiftQuery.data?.cashRefundsAmount ?? 0,
                  shiftCurrencyCode,
                  shiftMinorUnitDigits,
                )}
                detail="Refunded cash"
                tone="pink"
              />
              <Metric
                label="Cash In / Out"
                value={`${formatMoney(openShiftQuery.data?.cashInAmount ?? 0, shiftCurrencyCode, shiftMinorUnitDigits)} / ${formatMoney(openShiftQuery.data?.cashOutAmount ?? 0, shiftCurrencyCode, shiftMinorUnitDigits)}`}
                detail="Manual drawer movements"
                tone="gold"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Metric
                label="Expected cash"
                value={formatMoney(expectedCashAmount, shiftCurrencyCode, shiftMinorUnitDigits)}
                detail="Opening float + cash movements"
                tone="green"
              />
              <Metric
                label="Variance preview"
                value={formatMoney(variancePreview, shiftCurrencyCode, shiftMinorUnitDigits)}
                detail="Counted cash - expected cash"
                tone={variancePreview < 0 ? "pink" : variancePreview > 0 ? "gold" : "green"}
              />
            </div>

            <label className="block text-xs font-semibold text-slate-300">
              Counted cash
              <input
                type="number"
                min="0"
                step="0.01"
                value={countedCashInput}
                onChange={(event) => setCountedCashInput(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
                placeholder="0.00"
              />
            </label>
            {countedCash.error && countedCashInput.trim() && (
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100">
                {countedCash.error}
              </div>
            )}

            <label className="block text-xs font-semibold text-slate-300">
              Closing note
              <textarea
                value={closingNoteInput}
                onChange={(event) => setClosingNoteInput(event.target.value)}
                maxLength={500}
                className="mt-2 h-16 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:border-blue-400/60"
                placeholder="Optional note"
              />
            </label>
            <div className={`text-[11px] ${closingNoteInput.trim().length > 500 ? "text-rose-300" : "text-slate-500"}`}>
              {closingNoteInput.trim().length}/500
            </div>

            {!hasOpenShift && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                Open POS shift is required.
              </div>
            )}
            {!closeShiftPermissionQuery.hasPermission && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                Pos.CloseShift permission is required.
              </div>
            )}

            {lastClosedShift && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-50">
                <div className="mb-2 flex items-center gap-2 font-bold">
                  <Calculator size={16} className="text-emerald-300" />
                  Last close result
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <span>Expected: {formatMoney(lastClosedShift.expectedCashAmountAtClose, shiftCurrencyCode, shiftMinorUnitDigits)}</span>
                  <span>Counted: {formatMoney(lastClosedShift.countedCashAmount, shiftCurrencyCode, shiftMinorUnitDigits)}</span>
                  <span>Variance: {formatMoney(lastClosedShift.cashVarianceAmount, shiftCurrencyCode, shiftMinorUnitDigits)}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={closeCurrentShift}
              disabled={!canCloseShift}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LockKeyhole size={16} />
              {closeShiftMutation.isPending ? "Closing shift..." : "Confirm close shift"}
            </button>
          </div>
        </PosModal>
      )}
    </>
  );
}
