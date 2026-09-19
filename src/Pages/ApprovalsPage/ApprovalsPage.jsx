import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, ShieldAlert } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../shared/components/ui";
import { formatMoney } from "../../shared/utils/formatters";
import { formatPaymentDate } from "../../features/pos/utils/posFormatters";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useCompanyEntitlements, useHasPermission, isEntitlementEnabled } from "../../features/companies/hooks/useCompanies";
import {
  approvalQueryKeys,
  useApprovalRequestsList,
  useApproveSalesOrderDiscount,
  useApproveSalesOrderPaymentRefund,
  useSalesOrderDiscountApproval,
  useSalesOrderPaymentRefundApproval,
} from "../../features/approvals/hooks/useApprovals";
import {
  PAYMENTS_REFUND_PERMISSION,
  SALES_ORDERS_APPLY_DISCOUNT_PERMISSION,
} from "../../features/authorization/constants/applicationPermissions";

// Presentation-level gates only. Backend independently re-checks the action's permission +
// entitlement + branch access + PIN on every list/approve attempt regardless of what this screen
// shows. Status stays fixed to Pending; the action tab selects which ActionCode the shared list
// endpoint (and the matching action-specific detail/approve endpoints) are used for.
const REFUND_ACTION_CODE = "Payments.Refund";
const DISCOUNT_ACTION_CODE = "SalesOrders.ApplyDiscount";
const PENDING_STATUS = "Pending";
const PAGE_SIZE = 25;

// Backend error codes -> localized messages. Never show raw backend exception text when a known
// code exists.
const ERROR_CODE_KEYS = {
  "ManagerPin.Invalid": "approvals.errors.invalidPin",
  "ManagerPin.Locked": "approvals.errors.pinLocked",
  "ManagerPin.NotSet": "approvals.errors.pinNotSet",
  "ManagerPin.Required": "approvals.errors.pinRequired",
  "Branch.NotAccessible": "approvals.errors.branchNotAccessible",
  "Authorization.PermissionDenied": "approvals.errors.permissionDenied",
  "Entitlement.NotEnabled": "approvals.errors.entitlementNotEnabled",
  "Approval.SelfApprovalNotAllowed": "approvals.errors.selfApproval",
  "Approval.Expired": "approvals.errors.expired",
  "Approval.NotPending": "approvals.errors.notPending",
  "Approval.NotAvailable": "approvals.errors.notAvailable",
  "Approval.RefundSnapshotMissing": "approvals.errors.notAvailable",
  "PaymentRefund.AmountExceedsRefundable": "approvals.errors.staleAmount",
  "PaymentRefund.AlreadyFullyRefunded": "approvals.errors.staleAmount",
  "PaymentRefund.SalesOrderNotRefundable": "approvals.errors.staleAmount",
  "PosShift.InsufficientExpectedCash": "approvals.errors.cashValidationFailed",
  "PosShift.NotOpen": "approvals.errors.cashValidationFailed",
  "PosShift.CurrencyMismatch": "approvals.errors.cashValidationFailed",
  "PosShift.RequiredForCashRefund": "approvals.errors.cashValidationFailed",
  "PosShift.NotAvailable": "approvals.errors.cashValidationFailed",
  "Approval.DiscountSnapshotMissing": "approvals.errors.notAvailable",
  "Approval.WrongActionType": "approvals.errors.notAvailable",
  "Approval.RequiresActionSpecificApproveEndpoint": "approvals.errors.generic",
  "SalesOrder.NotEditable": "approvals.errors.discountNotEditable",
  "SalesOrder.NotAvailable": "approvals.errors.notAvailable",
  "SalesOrder.DiscountExceedsOrderAmount": "approvals.errors.discountExceedsOrder",
  "SalesOrder.DiscountNotApplicable": "approvals.errors.discountNotApplicable",
};

// A stale/terminal state means the previously-shown detail (and the list row it came from) no
// longer reflects reality -- reload both instead of leaving the manager looking at data that's
// already wrong.
const STALE_CODES = [
  "Approval.Expired",
  "Approval.NotPending",
  "Approval.NotAvailable",
  "Approval.RefundSnapshotMissing",
  "PaymentRefund.AmountExceedsRefundable",
  "PaymentRefund.AlreadyFullyRefunded",
  "PaymentRefund.SalesOrderNotRefundable",
  "Approval.DiscountSnapshotMissing",
  "SalesOrder.NotEditable",
  "SalesOrder.NotAvailable",
  "SalesOrder.DiscountExceedsOrderAmount",
  "SalesOrder.DiscountNotApplicable",
];

function statusTone(status) {
  if (status === "Approved") return "success";
  if (status === "Pending") return "warning";
  if (status === "Rejected" || status === "Expired" || status === "Cancelled") return "danger";
  return "neutral";
}

// Shared Manager PIN step-up block (password style, numeric, never persisted/logged; the caller
// clears the value after every attempt and disables submit while a request is in flight).
function PinApproveBlock({ pin, onPinChange, pending, onApprove }) {
  const { t } = useI18n();

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <label className="block text-xs font-semibold text-slate-400">{t("approvals.pin.label")}</label>
      <p className="mb-2 mt-1 text-[10px] leading-4 text-slate-500">{t("approvals.pin.disclaimer")}</p>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={pin}
        onChange={(event) => onPinChange(event.target.value)}
        placeholder={t("approvals.pin.placeholder")}
        disabled={pending}
        className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-50"
      />
      <button
        type="button"
        onClick={onApprove}
        disabled={pending || !pin.trim()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle2 size={15} />
        {pending ? t("approvals.approving") : t("approvals.approveButton")}
      </button>
    </div>
  );
}

// Detail + PIN approve panel. Always reloads the request fresh from the backend (GET
// .../approvals/{id}/refund) regardless of what the list row showed -- list data is never trusted
// as the final approval state.
function ApprovalDetailPanel({ companyId, approvalRequestId, onClose, onApproved }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [managerPin, setManagerPin] = useState("");
  const [notice, setNotice] = useState("");

  const detailQuery = useSalesOrderPaymentRefundApproval(companyId, approvalRequestId, Boolean(approvalRequestId));
  const detail = detailQuery.data;

  // branchId/salesOrderId are only known once the detail has loaded -- fine, since Approve can
  // only be triggered after that point; the mutation closes over each render's latest values.
  const approveMutation = useApproveSalesOrderPaymentRefund(
    companyId,
    detail?.branchId,
    detail?.salesOrderId,
    undefined,
  );

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  };

  const invalidatePendingList = () => {
    queryClient.invalidateQueries({
      queryKey: approvalQueryKeys.list(companyId, REFUND_ACTION_CODE, PENDING_STATUS),
    });
  };

  const handleApprove = async () => {
    // Never send a manager identity of any kind -- the authenticated session IS the approver, the
    // PIN is only a step-up confirmation for that same session.
    if (!approvalRequestId || !managerPin.trim() || approveMutation.isPending) return;

    try {
      await approveMutation.mutateAsync({ approvalRequestId, pin: managerPin });
      setManagerPin("");
      // Only after the backend confirms success -- never optimistic. The approved request
      // disappears from the Pending list because this refetches it from the server, not because
      // the row was removed locally.
      invalidatePendingList();
      onApproved(t("approvals.approvedMessage"));
    } catch (error) {
      // Never leave a PIN attempt sitting in the input after a failed try.
      setManagerPin("");
      const key = ERROR_CODE_KEYS[error?.code];
      showNotice(key ? t(key) : error?.message || t("approvals.errors.generic"));

      if (STALE_CODES.includes(error?.code)) {
        detailQuery.refetch();
        invalidatePendingList();
      }
    }
  };

  return (
    <aside className="h-fit rounded-2xl border border-white/10 bg-[#0c1424] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-blue-300" />
          <h2 className="text-sm font-bold text-slate-100">{t("approvals.detail.title")}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white"
        >
          {t("approvals.detail.close")}
        </button>
      </div>

      {detailQuery.isLoading ? (
        <LoadingState />
      ) : detailQuery.isError ? (
        <ErrorState
          title={t("approvals.loadErrorTitle")}
          message={
            (detailQuery.error && ERROR_CODE_KEYS[detailQuery.error.code] && t(ERROR_CODE_KEYS[detailQuery.error.code])) ||
            detailQuery.error?.message ||
            t("approvals.loadError")
          }
        />
      ) : (
        detail && (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <StatusBadge tone={statusTone(detail.status)}>{detail.status}</StatusBadge>
              <span className="text-lg font-black text-blue-300">
                {formatMoney(detail.amount, detail.currencyCode)}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-500">{t("approvals.detail.branch")}</dt>
                <dd className="mt-0.5 truncate font-bold text-slate-100">{detail.branchId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.detail.order")}</dt>
                <dd className="mt-0.5 truncate font-bold text-slate-100">{detail.salesOrderId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.detail.requester")}</dt>
                <dd className="mt-0.5 truncate font-bold text-slate-100">{detail.requestedByUserId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.detail.createdAt")}</dt>
                <dd className="mt-0.5 font-bold text-slate-100">{formatPaymentDate(detail.createdAtUtc)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">{t("approvals.detail.expiresAt")}</dt>
                <dd className="mt-0.5 font-bold text-slate-100">{formatPaymentDate(detail.expiresAtUtc)}</dd>
              </div>
            </dl>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-[10px] font-semibold text-slate-500">{t("approvals.detail.reason")}</div>
              <p className="mt-1 text-xs text-slate-200">{detail.reason || "—"}</p>
            </div>

            {notice && (
              <div className="mt-3 rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
                {notice}
              </div>
            )}

            {detail.status === "Pending" ? (
              <PinApproveBlock
                pin={managerPin}
                onPinChange={setManagerPin}
                pending={approveMutation.isPending}
                onApprove={handleApprove}
              />
            ) : (
              <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-slate-500">
                {t("approvals.detail.notActionable")}
              </p>
            )}
          </>
        )
      )}
    </aside>
  );
}

function formatDiscountValue(discountType, value) {
  return discountType === "Percentage" ? `${Number(value)}%` : formatMoney(value, "");
}

// Discount detail + PIN approve panel. Uses the Discount-specific endpoints only (never the refund
// detail). Estimated values are display-only; the backend recomputes the real discount from the
// order's current lines at approval time.
function DiscountApprovalDetailPanel({ companyId, approvalRequestId, onClose, onApproved }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [managerPin, setManagerPin] = useState("");
  const [notice, setNotice] = useState("");

  const detailQuery = useSalesOrderDiscountApproval(companyId, approvalRequestId, Boolean(approvalRequestId), true);
  const detail = detailQuery.data;
  const approveMutation = useApproveSalesOrderDiscount(companyId);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  };

  const invalidatePendingList = () => {
    queryClient.invalidateQueries({
      queryKey: approvalQueryKeys.list(companyId, DISCOUNT_ACTION_CODE, PENDING_STATUS),
    });
  };

  const handleApprove = async () => {
    // No manager identity is ever sent -- the authenticated session is the approver.
    if (!approvalRequestId || !managerPin.trim() || approveMutation.isPending) return;

    try {
      await approveMutation.mutateAsync({ approvalRequestId, pin: managerPin });
      setManagerPin("");
      invalidatePendingList();
      onApproved(t("approvals.discount.approvedMessage"));
    } catch (error) {
      setManagerPin("");
      const key = ERROR_CODE_KEYS[error?.code];
      showNotice(key ? t(key) : error?.message || t("approvals.errors.generic"));

      if (STALE_CODES.includes(error?.code)) {
        detailQuery.refetch();
        invalidatePendingList();
      }
    }
  };

  return (
    <aside className="h-fit rounded-2xl border border-white/10 bg-[#0c1424] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-blue-300" />
          <h2 className="text-sm font-bold text-slate-100">{t("approvals.detail.title")}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white"
        >
          {t("approvals.detail.close")}
        </button>
      </div>

      {detailQuery.isLoading ? (
        <LoadingState />
      ) : detailQuery.isError ? (
        <ErrorState
          title={t("approvals.loadErrorTitle")}
          message={
            (detailQuery.error && ERROR_CODE_KEYS[detailQuery.error.code] && t(ERROR_CODE_KEYS[detailQuery.error.code])) ||
            detailQuery.error?.message ||
            t("approvals.loadError")
          }
        />
      ) : (
        detail && (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <StatusBadge tone={statusTone(detail.status)}>{detail.status}</StatusBadge>
              <span className="text-lg font-black text-blue-300">
                {formatDiscountValue(detail.discountType, detail.requestedValue)}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-500">{t("approvals.discount.type")}</dt>
                <dd className="mt-0.5 font-bold text-slate-100">
                  {detail.discountType === "Percentage"
                    ? t("approvals.discount.typePercentage")
                    : t("approvals.discount.typeFixedAmount")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.discount.requestedValue")}</dt>
                <dd className="mt-0.5 font-bold text-slate-100">
                  {formatDiscountValue(detail.discountType, detail.requestedValue)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.discount.estimatedAmount")}</dt>
                <dd className="mt-0.5 font-bold text-slate-100">{formatMoney(detail.estimatedAppliedAmount, "")}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.discount.effectivePercent")}</dt>
                <dd className="mt-0.5 font-bold text-slate-100">{Number(detail.estimatedEffectivePercent)}%</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.detail.branch")}</dt>
                <dd className="mt-0.5 truncate font-bold text-slate-100">{detail.branchId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.detail.order")}</dt>
                <dd className="mt-0.5 truncate font-bold text-slate-100">{detail.salesOrderId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.detail.requester")}</dt>
                <dd className="mt-0.5 truncate font-bold text-slate-100">{detail.requestedByUserId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("approvals.detail.createdAt")}</dt>
                <dd className="mt-0.5 font-bold text-slate-100">{formatPaymentDate(detail.createdAtUtc)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">{t("approvals.detail.expiresAt")}</dt>
                <dd className="mt-0.5 font-bold text-slate-100">{formatPaymentDate(detail.expiresAtUtc)}</dd>
              </div>
            </dl>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="text-[10px] font-semibold text-slate-500">{t("approvals.detail.reason")}</div>
              <p className="mt-1 text-xs text-slate-200">{detail.reason || "—"}</p>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-slate-500">{t("approvals.discount.estimateNote")}</p>

            {notice && (
              <div className="mt-3 rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
                {notice}
              </div>
            )}

            {detail.status === "Pending" ? (
              <PinApproveBlock
                pin={managerPin}
                onPinChange={setManagerPin}
                pending={approveMutation.isPending}
                onApprove={handleApprove}
              />
            ) : (
              <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-slate-500">
                {t("approvals.detail.notActionable")}
              </p>
            )}
          </>
        )
      )}
    </aside>
  );
}

// The shared list endpoint returns no discount-specific fields, so each Discount row loads its own
// authoritative detail (react-query dedupes this with the detail panel's identical query key).
function DiscountRowMetrics({ companyId, approvalRequestId }) {
  const { t } = useI18n();
  const query = useSalesOrderDiscountApproval(companyId, approvalRequestId);
  const detail = query.data;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400">
      <span>
        {t("approvals.discount.requestedValue")}:{" "}
        <b className="text-slate-200">{detail ? formatDiscountValue(detail.discountType, detail.requestedValue) : "—"}</b>
      </span>
      <span>
        {t("approvals.discount.estimatedAmount")}:{" "}
        <b className="text-slate-200">{detail ? formatMoney(detail.estimatedAppliedAmount, "") : "—"}</b>
      </span>
      <span>
        {t("approvals.discount.effectivePercent")}:{" "}
        <b className="text-slate-200">{detail ? `${Number(detail.estimatedEffectivePercent)}%` : "—"}</b>
      </span>
    </div>
  );
}

function ApprovalsInbox({ companyId, actionCode }) {
  const isDiscount = actionCode === DISCOUNT_ACTION_CODE;
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [listNotice, setListNotice] = useState("");
  const [openByIdVisible, setOpenByIdVisible] = useState(false);
  const [openByIdInput, setOpenByIdInput] = useState("");

  const listQuery = useApprovalRequestsList(companyId, {
    actionCode,
    status: PENDING_STATUS,
    page,
    pageSize: PAGE_SIZE,
  });

  const data = listQuery.data;
  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const showListNotice = (message) => {
    setListNotice(message);
    window.setTimeout(() => setListNotice(""), 4000);
  };

  const handleApproved = (message) => {
    setSelectedId(null);
    showListNotice(message);
  };

  const handleOpenById = (event) => {
    event.preventDefault();
    const trimmed = openByIdInput.trim();
    if (!trimmed) return;
    setSelectedId(trimmed);
    setOpenByIdInput("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {t("approvals.inbox.totalCount", { count: totalCount })}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenByIdVisible((visible) => !visible)}
            className="text-[11px] font-bold text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
          >
            {t("approvals.lookup.toggle")}
          </button>
          <button
            type="button"
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} />
            {t("approvals.refresh")}
          </button>
        </div>
      </div>

      {openByIdVisible && (
        <form onSubmit={handleOpenById} className="flex flex-wrap items-end gap-2">
          <label className="min-w-[240px] flex-1">
            <span className="mb-1 block text-xs font-semibold text-slate-400">
              {t("approvals.lookup.label")}
            </span>
            <input
              type="text"
              value={openByIdInput}
              onChange={(event) => setOpenByIdInput(event.target.value)}
              placeholder={t("approvals.lookup.placeholder")}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60"
            />
          </label>
          <button
            type="submit"
            disabled={!openByIdInput.trim()}
            className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("approvals.lookup.button")}
          </button>
        </form>
      )}

      {listNotice && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          {listNotice}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <section className="space-y-2">
          {listQuery.isLoading ? (
            <LoadingState />
          ) : listQuery.isError ? (
            <div className="space-y-2">
              <ErrorState title={t("approvals.loadErrorTitle")} message={listQuery.error?.message || t("approvals.loadError")} />
              <button
                type="button"
                onClick={() => listQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                {t("approvals.refresh")}
              </button>
            </div>
          ) : items.length === 0 ? (
            <EmptyState title={t("approvals.inbox.emptyTitle")} message={t("approvals.inbox.emptyMessage")} />
          ) : (
            <>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.approvalRequestId}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.approvalRequestId)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        selectedId === item.approvalRequestId
                          ? "border-blue-400/60 bg-blue-500/10"
                          : "border-white/10 bg-white/[0.025] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-100">
                          {item.orderReference || `#${item.approvalRequestId.slice(-8)}`}
                        </span>
                        {isDiscount ? (
                          <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
                        ) : (
                          <span className="text-sm font-black text-blue-300">
                            {formatMoney(item.amount ?? 0, item.currencyCode ?? "")}
                          </span>
                        )}
                      </div>
                      {isDiscount && (
                        <DiscountRowMetrics companyId={companyId} approvalRequestId={item.approvalRequestId} />
                      )}
                      <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                        <span className="truncate">{item.requesterDisplayName || item.requesterId}</span>
                        <span className="shrink-0">{item.branchName || item.branchId}</span>
                      </div>
                      {item.reason && (
                        <p className="mt-1 truncate text-[10px] text-slate-500">{item.reason}</p>
                      )}
                      <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                        <span>{formatPaymentDate(item.createdAtUtc)}</span>
                        <span>{t("approvals.inbox.expiresAt", { time: formatPaymentDate(item.expiresAtUtc) })}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || listQuery.isFetching}
                  className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  {t("approvals.inbox.previous")}
                </button>
                <span className="text-[10px] font-semibold text-slate-500">
                  {t("approvals.inbox.pageOf", { page, totalPages: Math.max(totalPages, 1) })}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= totalPages || listQuery.isFetching}
                  className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("approvals.inbox.next")}
                  <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}
        </section>

        {selectedId &&
          (isDiscount ? (
            <DiscountApprovalDetailPanel
              companyId={companyId}
              approvalRequestId={selectedId}
              onClose={() => setSelectedId(null)}
              onApproved={handleApproved}
            />
          ) : (
            <ApprovalDetailPanel
              companyId={companyId}
              approvalRequestId={selectedId}
              onClose={() => setSelectedId(null)}
              onApproved={handleApproved}
            />
          ))}
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const { t, dir } = useI18n();
  const { currentCompanyId } = useCompany();

  const refundPermission = useHasPermission(currentCompanyId, PAYMENTS_REFUND_PERMISSION);
  const discountPermission = useHasPermission(currentCompanyId, SALES_ORDERS_APPLY_DISCOUNT_PERMISSION);
  const entitlementsQuery = useCompanyEntitlements(currentCompanyId);
  const permissionQuery = {
    isLoading: refundPermission.isLoading || discountPermission.isLoading || entitlementsQuery.isLoading,
  };
  // Action-specific presentation gates (backend re-checks every one): Refund needs
  // Payments.Refund + POS.REFUNDS, Discount needs SalesOrders.ApplyDiscount + POS. A discount-only
  // approver is never blocked for lacking Refund access.
  const availableTabs = [
    refundPermission.hasPermission &&
      isEntitlementEnabled(entitlementsQuery.data, "POS.REFUNDS") && { code: REFUND_ACTION_CODE, labelKey: "approvals.tabs.refund" },
    discountPermission.hasPermission &&
      isEntitlementEnabled(entitlementsQuery.data, "POS") && { code: DISCOUNT_ACTION_CODE, labelKey: "approvals.tabs.discount" },
  ].filter(Boolean);
  const canAccess =
    Boolean(currentCompanyId) && !permissionQuery.isLoading && availableTabs.length > 0;
  // Selection is stored together with its company so switching companies falls back to the default.
  const [tabState, setTabState] = useState({ companyId: null, code: REFUND_ACTION_CODE });
  const requestedCode = tabState.companyId === currentCompanyId ? tabState.code : REFUND_ACTION_CODE;
  const activeCode = availableTabs.some((tab) => tab.code === requestedCode)
    ? requestedCode
    : availableTabs[0]?.code;

  return (
    <AppLayout>
      <main className="space-y-4" dir={dir}>
        <PageHeader title={t("approvals.title")} />
        <p className="text-sm text-slate-400">{t("approvals.subtitle")}</p>

        {!currentCompanyId ? (
          <EmptyState title={t("approvals.title")} message={t("approvals.companyRequired")} />
        ) : permissionQuery.isLoading ? (
          <LoadingState label={t("approvals.checkingPermission")} />
        ) : !canAccess ? (
          <ErrorState title={t("approvals.title")} message={t("approvals.permissionRequired")} />
        ) : (
          // Keyed by company so switching companies fully discards any selected/open approval,
          // in-progress PIN entry, and pagination state from the previous company, rather than
          // risking anything carrying over. The list query itself is also company-scoped via its
          // query key, so a stale cache entry from another company is never shown even briefly.
          <div className="space-y-3">
            {availableTabs.length > 1 && (
              <div role="tablist" aria-label={t("approvals.tabs.label")} className="flex flex-wrap gap-2">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.code}
                    type="button"
                    role="tab"
                    aria-selected={activeCode === tab.code}
                    onClick={() => setTabState({ companyId: currentCompanyId, code: tab.code })}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                      activeCode === tab.code
                        ? "border-blue-400/60 bg-blue-500/10 text-blue-100"
                        : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20"
                    }`}
                  >
                    {t(tab.labelKey)}
                  </button>
                ))}
              </div>
            )}
            <ApprovalsInbox
              key={`${currentCompanyId}-${activeCode}`}
              companyId={currentCompanyId}
              actionCode={activeCode}
            />
          </div>
        )}
      </main>
    </AppLayout>
  );
}
