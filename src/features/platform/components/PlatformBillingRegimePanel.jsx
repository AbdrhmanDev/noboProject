import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { BranchesModal } from "../../branches/components/BranchesModal";
import { StatusBadge } from "../../../shared/components/ui";
import { formatMoney } from "../../../shared/utils/formatters";
import {
  cancelStaleDraftSalesOrders,
  getBillingRegimeBlockingOrders,
  setCompanyBillingRegime,
} from "../../tax/api/taxApi";
import { disableCompanyCompliance } from "../../compliance-settings/api/companyComplianceApi";

// NOBO staff only (the page sits behind PlatformAccessGate; the action also needs Platform.Entitlements.Manage, which the server checks
// again): move a company DOWN one billing regime, always with a reason.
//   KsaPhase1 -> NotVatRegistered: PUT /tax/billing-regime (prices stay exactly as stored; no VAT is charged on top or extracted).
//     Blocked only by Confirmed orders not invoiced yet (listed here); Drafts follow the new regime when they are confirmed.
//     Abandoned Drafts can be cancelled in bulk here (optional; they never block).
//   KsaPhase2 -> KsaPhase1       : disabling the compliance integration (POST /compliance/disable), which moves the regime.
const KNOWN_ERRORS = [
  "BillingRegime.OpenOrdersExist",
  "BillingRegime.ReasonRequired",
  "BillingRegime.DisableIntegrationFirst",
  "Authorization.PlatformPermissionDenied",
  "StaleDrafts.DaysInvalid",
];
const DEFAULT_STALE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function errorMessage(t, error) {
  if (!error) return "";
  if (KNOWN_ERRORS.includes(error.code)) {
    const key = `platform.billing.error.${error.code}`;
    const text = t(key);
    if (text && text !== key) return text;
  }
  return error.message || t("platform.error.message");
}

function ageInDays(utc) {
  return Math.max(0, Math.floor((Date.now() - new Date(utc).getTime()) / DAY_MS));
}

function BlockingOrders({ t, query }) {
  if (query.isLoading) return <div className="text-xs text-subtle">{t("platform.billing.blockers.loading")}</div>;
  if (query.isError) return <div className="text-xs text-danger">{errorMessage(t, query.error)}</div>;

  const { total, items } = query.data;
  if (total === 0) {
    return <div className="rounded-xl border border-success bg-success-soft p-2 text-xs text-success">{t("platform.billing.blockers.none")}</div>;
  }

  return (
    <div className="space-y-2 rounded-xl border border-danger bg-danger-soft p-2 text-xs text-danger">
      <div className="font-bold">{t("platform.billing.blockers.title", { count: total })}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-start text-ink">
          <thead className="text-subtle">
            <tr>
              <th className="p-1 text-start">{t("platform.billing.blockers.order")}</th>
              <th className="p-1 text-start">{t("platform.billing.blockers.branch")}</th>
              <th className="p-1 text-start">{t("platform.billing.blockers.status")}</th>
              <th className="p-1 text-start">{t("platform.billing.blockers.age")}</th>
              <th className="p-1 text-end">{t("platform.billing.blockers.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => (
              <tr key={order.salesOrderId} className="border-t border-line">
                <td className="p-1 font-bold">{order.orderNumber}</td>
                <td className="p-1">{order.branchName}</td>
                <td className="p-1">{order.paidAmount > 0 ? t("platform.billing.blockers.partlyPaid") : order.status}</td>
                <td className="p-1">{t("platform.billing.blockers.days", { count: ageInDays(order.createdAtUtc) })}</td>
                <td className="p-1 text-end">{formatMoney(order.payableAmount, order.currencyCode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > items.length && <div>{t("platform.billing.blockers.more", { count: total - items.length })}</div>}
      <div>{t("platform.billing.blockers.hint")}</div>
    </div>
  );
}

function StaleDrafts({ t, companyId, onDone }) {
  const [daysInput, setDaysInput] = useState(String(DEFAULT_STALE_DAYS));
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const days = Number.parseInt(daysInput, 10);
  const daysValid = Number.isInteger(days) && days >= 1 && days <= 3650;

  const preview = useQuery({
    queryKey: ["platform", "companies", companyId, "stale-drafts", days],
    queryFn: () => cancelStaleDraftSalesOrders(companyId, { olderThanDays: days, previewOnly: true }),
    enabled: daysValid,
  });

  const mutation = useMutation({
    mutationFn: () => cancelStaleDraftSalesOrders(companyId, { olderThanDays: days, reason: reason.trim(), previewOnly: false }),
    onSuccess: (result) => {
      setReason("");
      setConfirmed(false);
      onDone(result);
    },
  });

  const matching = preview.data?.matching ?? 0;

  return (
    <div className="space-y-2 rounded-xl border border-line p-2 text-xs">
      <div className="font-bold text-ink">{t("platform.billing.stale.title")}</div>
      <div className="text-subtle">{t("platform.billing.stale.hint")}</div>
      <label className="flex items-center gap-2 text-ink">
        {t("platform.billing.stale.days")}
        <input
          type="number"
          min={1}
          max={3650}
          value={daysInput}
          onChange={(event) => {
            setDaysInput(event.target.value);
            setConfirmed(false);
          }}
          className="w-20 rounded-lg border border-line bg-canvas p-1 text-ink outline-none"
        />
      </label>
      <div className="text-ink">
        {!daysValid
          ? t("platform.billing.error.StaleDrafts.DaysInvalid")
          : preview.isLoading
            ? t("platform.billing.blockers.loading")
            : t("platform.billing.stale.matching", { count: matching })}
      </div>
      {matching > 0 && (
        <>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={400}
            rows={2}
            placeholder={t("platform.billing.reasonPlaceholder")}
            className="w-full rounded-lg border border-line bg-canvas p-2 text-ink outline-none"
          />
          <label className="flex items-center gap-2 text-ink">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            {t("platform.billing.stale.confirm", { count: matching })}
          </label>
          {mutation.error && <div className="text-danger">{errorMessage(t, mutation.error)}</div>}
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!reason.trim() || !confirmed || mutation.isPending}
            className="rounded-xl border border-danger px-3 py-2 font-bold text-danger disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? t("platform.billing.saving") : t("platform.billing.stale.action", { count: matching })}
          </button>
        </>
      )}
    </div>
  );
}

export function PlatformBillingRegimePanel({ companyId, company, canManage }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [staleNotice, setStaleNotice] = useState("");

  const regime = company.billingRegime || "NotVatRegistered";
  const target = regime === "KsaPhase2" ? "KsaPhase1" : regime === "KsaPhase1" ? "NotVatRegistered" : null;
  // Only the VAT on -> off move (KsaPhase1 -> NotVatRegistered) changes how orders are taxed, so only it can be blocked by orders.
  const checksOrders = dialogOpen && regime === "KsaPhase1";

  const blockers = useQuery({
    queryKey: ["platform", "companies", companyId, "billing-blockers"],
    queryFn: () => getBillingRegimeBlockingOrders(companyId),
    enabled: checksOrders,
  });
  const blocked = checksOrders && (blockers.isLoading || blockers.isError || (blockers.data?.total ?? 0) > 0);

  const mutation = useMutation({
    mutationFn: (trimmedReason) =>
      regime === "KsaPhase2"
        ? disableCompanyCompliance(companyId, { reason: trimmedReason })
        : setCompanyBillingRegime(companyId, { targetRegime: "NotVatRegistered", reason: trimmedReason }),
    onSuccess: () => {
      setDialogOpen(false);
      setReason("");
      setNotice(t("platform.billing.done"));
      queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId] });
    },
    onError: (error) => {
      if (error?.code === "BillingRegime.OpenOrdersExist") blockers.refetch();
    },
  });

  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-black text-ink">{t("platform.billing.title")}</div>
        {canManage && target && (
          <button
            type="button"
            onClick={() => {
              setNotice("");
              setStaleNotice("");
              mutation.reset();
              setDialogOpen(true);
            }}
            className="rounded-xl border border-danger px-3 py-2 text-xs font-bold text-danger hover:bg-danger-soft"
          >
            {t(`platform.billing.action.${regime}`)}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-subtle">{t("taxAdmin.field.billingRegime")}:</span>
        <span className="font-bold text-ink">{t(`taxAdmin.regime.${regime}`)}</span>
        <StatusBadge tone={company.integrationEnabled ? "success" : "neutral"}>
          {company.integrationEnabled ? t("platform.billing.integrationOn") : t("platform.billing.integrationOff")}
        </StatusBadge>
        {company.sellerVatNumberMissing && <StatusBadge tone="warning">{t("tax.vatNumberMissing.title")}</StatusBadge>}
      </div>

      {notice && <div className="mt-2 rounded-xl border border-success bg-success-soft p-2 text-xs text-success">{notice}</div>}

      {dialogOpen && (
        <BranchesModal title={t(`platform.billing.action.${regime}`)} onClose={() => setDialogOpen(false)}>
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-warning bg-warning-soft p-3 text-xs leading-5 text-warning">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="font-bold">{company.legalName}</div>
                <div>{t(`platform.billing.warning.${regime}`)}</div>
                <div>{t("platform.billing.warning.documents")}</div>
              </div>
            </div>
            {checksOrders && <BlockingOrders t={t} query={blockers} />}
            {checksOrders && (
              <StaleDrafts
                t={t}
                companyId={companyId}
                onDone={(result) => {
                  setStaleNotice(t("platform.billing.stale.done", { count: result.cancelled }));
                  queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId, "stale-drafts"] });
                }}
              />
            )}
            {staleNotice && <div className="rounded-xl border border-success bg-success-soft p-2 text-xs text-success">{staleNotice}</div>}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t("platform.billing.reasonPlaceholder")}
              className="w-full rounded-lg border border-line bg-canvas p-2 text-sm text-ink outline-none"
            />
            {mutation.error && (
              <div className="rounded-xl border border-danger bg-danger-soft p-2 text-xs text-danger">{errorMessage(t, mutation.error)}</div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => mutation.mutate(reason.trim())}
                disabled={!reason.trim() || blocked || mutation.isPending}
                className="flex-1 rounded-xl bg-danger px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mutation.isPending ? t("platform.billing.saving") : t("platform.billing.confirm")}
              </button>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl border border-line px-3 py-2 text-sm font-bold text-ink"
              >
                {t("compliance.switch.cancel")}
              </button>
            </div>
          </div>
        </BranchesModal>
      )}
    </section>
  );
}
