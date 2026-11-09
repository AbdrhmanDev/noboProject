import { useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { COMPLIANCE_MANAGE_PERMISSION } from "../../authorization/constants/applicationPermissions";
import { useCompanyComplianceStatus, useDisableCompanyCompliance, useEnableCompanyCompliance } from "../hooks/useCompanyCompliance";
import { useCompanyTaxSettings } from "../../tax/hooks/useTax";
import { useI18n } from "../../../i18n/I18nContext";
import { ROUTES } from "../../../utils/routes";

// Known gate codes get a translated message; anything else shows the server's own message.
const GATE_ERROR_CODES = ["Integration.NotAvailableYet", "Integration.BranchesNotReady", "BillingRegime.ReasonRequired"];

function getErrorMessage(error, t) {
  // 403 from the backend's own permission checks (never re-derived client-side) surfaces
  // through the same normalized error shape every other feature in this app already uses.
  if (t && GATE_ERROR_CODES.includes(error?.code)) {
    const key = `compliance.switch.error.${error.code}`;
    const text = t(key);
    if (text && text !== key) return error.code === "Integration.BranchesNotReady" && error.message ? `${text} ${error.message}` : text;
  }
  return error?.message || "Request failed.";
}

function isForbidden(error) {
  // httpClient's response interceptor always normalizes the raw axios error through
  // normalizeApiError before it reaches React Query, so `status` is already the plain HTTP code.
  return error?.status === 403;
}

export function CompanyComplianceSettingsPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const permissionQuery = useHasPermission(currentCompanyId, COMPLIANCE_MANAGE_PERMISSION);
  const canManage = permissionQuery.hasPermission;

  const statusQuery = useCompanyComplianceStatus(currentCompanyId, canManage);
  const enableMutation = useEnableCompanyCompliance(currentCompanyId);
  const disableMutation = useDisableCompanyCompliance(currentCompanyId);

  // One source of truth: the billing regime lives on the tax page; this tab only shows it.
  const taxSettingsQuery = useCompanyTaxSettings(currentCompanyId, canManage);
  const billingRegime =
    taxSettingsQuery.data?.billingRegime || (taxSettingsQuery.data?.isTaxEnabled ? "KsaPhase1" : "NotVatRegistered");

  const [confirmDisable, setConfirmDisable] = useState(false);
  const [disableReason, setDisableReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [lastAction, setLastAction] = useState(null); // "enabled" | "disabled" | null

  const isMutating = enableMutation.isPending || disableMutation.isPending;

  const handleEnable = async () => {
    setActionError("");
    try {
      await enableMutation.mutateAsync();
      setLastAction("enabled");
    } catch (error) {
      setActionError(getErrorMessage(error, t));
    }
  };

  const handleDisable = async () => {
    setActionError("");
    try {
      await disableMutation.mutateAsync({ reason: disableReason.trim() });
      setConfirmDisable(false);
      setDisableReason("");
      setLastAction("disabled");
    } catch (error) {
      setActionError(getErrorMessage(error, t));
      setConfirmDisable(false);
    }
  };

  const status = statusQuery.data;
  // Never assumed: if the status query has not succeeded, nothing below renders a toggle, a state
  // badge, or a button that could act on a guessed value. Pending/error states are handled first.
  const hasLoadedStatus = statusQuery.isSuccess && Boolean(status);

  return (
    <AppLayout>
      <main className="odoo-root space-y-3" dir="rtl">
        <PageHeader
          title="ZATCA Integration"
          actions={
            <button
              type="button"
              onClick={() => statusQuery.refetch()}
              disabled={!currentCompanyId || !canManage || statusQuery.isFetching}
              className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={statusQuery.isFetching ? "animate-spin" : ""} /> Refresh
            </button>
          }
        />

        <div className="flex items-start gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-xs text-subtle">
          This is a company-wide master switch, separate from each branch's own compliance setting
          (Branches page). A branch can only be effectively enabled when BOTH this switch and that
          branch's own setting are Enabled -- turning this off never changes a branch's own saved
          setting, and turning it back on restores exactly what each branch already had.
        </div>

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company to manage ZATCA integration." />
        ) : permissionQuery.isLoading ? (
          <LoadingState label="Checking permissions..." />
        ) : !canManage ? (
          <ErrorState
            title="Permission required"
            message="Compliance.Manage permission is required to view or change this setting."
          />
        ) : (
          <div className="rounded-xl border border-line bg-surface p-4">
            {statusQuery.isLoading && <LoadingState label="Loading integration status..." />}

            {statusQuery.isError && (
              <ErrorState
                title={isForbidden(statusQuery.error) ? "Permission required" : "Unable to load integration status"}
                message={
                  isForbidden(statusQuery.error)
                    ? "The server refused this request. Compliance.Manage permission is required."
                    : getErrorMessage(statusQuery.error)
                }
              />
            )}

            {taxSettingsQuery.data && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm">
                <div>
                  <span className="text-subtle">{t("taxAdmin.field.billingRegime")}: </span>
                  <span className="font-bold text-ink">{t(`taxAdmin.regime.${billingRegime}`)}</span>
                </div>
                <Link to={ROUTES.TAX_ADMIN} className="text-xs font-bold text-accent underline">
                  {t("compliance.switch.manageOnTaxPage")}
                </Link>
              </div>
            )}

            {hasLoadedStatus && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {status.state === "Enabled" ? (
                        <ShieldCheck size={16} className="text-success" />
                      ) : (
                        <ShieldAlert size={16} className="text-subtle" />
                      )}
                      <span className="text-sm font-black text-ink">ZATCA integration</span>
                      <StatusBadge tone={status.state === "Enabled" ? "success" : "neutral"}>
                        {status.state}
                      </StatusBadge>
                    </div>
                    {status.stateChangedAtUtc && (
                      <div className="mt-1 text-xs text-subtle">
                        Last changed {formatDateTime(status.stateChangedAtUtc)}
                      </div>
                    )}
                  </div>

                  {status.state === "Enabled" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActionError("");
                        setConfirmDisable(true);
                      }}
                      disabled={isMutating}
                      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink hover:border-accent-line disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Disable
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnable}
                      disabled={isMutating}
                      className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {enableMutation.isPending ? "Enabling..." : "Enable"}
                    </button>
                  )}
                </div>

                {status.state === "Enabled" && (
                  <div className="rounded-xl border border-warning bg-warning-soft p-3 text-xs leading-5 text-warning">
                    Enabling this switch only permits ZATCA integration for this company -- it does
                    not, by itself, mean onboarding is complete, that any branch is ready, or that
                    the system can already submit invoices to ZATCA. Each branch still needs its own
                    setting enabled and its own readiness checked separately.
                  </div>
                )}

                {status.state === "Disabled" && (
                  <div className="rounded-xl border border-line bg-raised p-3 text-xs leading-5 text-subtle">
                    While disabled, every branch is treated as effectively disabled for ZATCA
                    integration, regardless of what that branch's own setting already says. No
                    branch setting is changed by this -- re-enabling restores each branch to exactly
                    the state it was already in.
                  </div>
                )}

                {lastAction && !actionError && (
                  <div className="rounded-xl border border-success bg-success-soft p-2 text-xs text-success">
                    {lastAction === "enabled"
                      ? "Integration enabled for this company."
                      : "Integration disabled for this company. Branch settings were left unchanged."}
                  </div>
                )}

                {actionError && (
                  <div className="rounded-xl border border-danger bg-danger-soft p-2 text-xs text-danger">
                    {actionError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {confirmDisable && (
          <div className="space-y-2 rounded-xl border border-warning bg-warning-soft p-3">
            <div className="text-sm font-bold text-warning">{t("compliance.switch.disableTitle")}</div>
            <p className="text-xs leading-5 text-warning">{t("compliance.switch.disableMessage")}</p>
            <textarea
              value={disableReason}
              onChange={(event) => setDisableReason(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder={t("compliance.switch.reasonPlaceholder")}
              className="w-full rounded-lg border border-line bg-canvas p-2 text-sm text-ink outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDisable}
                disabled={!disableReason.trim() || disableMutation.isPending}
                className="rounded-lg bg-danger px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {disableMutation.isPending ? t("compliance.switch.disabling") : t("compliance.switch.disable")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDisable(false)}
                className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink"
              >
                {t("compliance.switch.cancel")}
              </button>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
