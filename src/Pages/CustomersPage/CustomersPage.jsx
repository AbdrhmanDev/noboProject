import { UserPlus, Mail, Phone, ScrollText, Search } from "lucide-react";
import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { ROUTES } from "../../utils/routes";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import {
  CUSTOMERS_MANAGE_PERMISSION,
  CUSTOMERS_VIEW_PERMISSION,
} from "../../features/authorization/constants/applicationPermissions";
import { useCreateCustomer, useCustomers } from "../../features/customers/hooks/useCustomers";
import { useCustomerComplianceProfileCache } from "../../features/customers/hooks/useCustomerComplianceProfile";
import { CustomerComplianceProfileModal } from "../../features/customers/components/CustomerComplianceProfileModal";
import { CustomerComplianceProfileForm } from "../../features/customers/components/CustomerComplianceProfileForm";
import { LoadingState } from "../../shared/components/ui/LoadingState";
import { EmptyState } from "../../shared/components/ui/EmptyState";

// Still placeholder, cosmetic-only figures -- no backend metric backs "new this month" / "active"
// / "VIP" today. Left as-is (out of scope for the Compliance Profile task); the table below it is
// now the real thing.
const stats = [
  { labelKey: "cust.totalCustomers", value: "8,920", color: "#2b8cff" },
  { labelKey: "cust.newThisMonth", value: "124", color: "#f5b800" },
  { labelKey: "cust.activeCustomers", value: "3,210", color: "#17d9c4" },
  { labelKey: "cust.vipCustomers", value: "86", color: "#8b5cf6" },
];

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

export default function CustomersPage({ onLogout }) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const viewPermissionQuery = useHasPermission(currentCompanyId, CUSTOMERS_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, CUSTOMERS_MANAGE_PERMISSION);
  const canManage = managePermissionQuery.hasPermission;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const customersQuery = useCustomers(
    currentCompanyId,
    { search, pageSize: 50 },
    viewPermissionQuery.hasPermission,
  );
  const customersList = customersQuery.data?.items || [];

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [complianceCustomer, setComplianceCustomer] = useState(null);

  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.CUSTOMERS}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-black brand-text">{t("cust.title")}</h1>
        <div className="flex flex-wrap gap-2">
          <button className="panel rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><Mail size={13} /> {t("cust.emailCampaign")}</button>
          {canManage && (
            <button onClick={() => setShowAddCustomer(true)} className="primary-btn rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"><UserPlus size={13} /> {t("cust.newCustomer")}</button>
          )}
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-4">
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{t(s.labelKey)}</div>
          </div>
        ))}
      </div>

      {/* customers table -- real data (GET /api/companies/{companyId}/customers) */}
      <div className="panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-sm">{t("cust.customerList")}</h3>
          <div className="flex-1" />
          <div className="flex items-center gap-2 input-dark rounded-xl px-3 py-2">
            <Search size={14} color="#60a5fa" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("cust.search")}
              className="bg-transparent outline-none text-xs text-white placeholder-gray-500"
            />
          </div>
        </div>

        {!viewPermissionQuery.isLoading && !viewPermissionQuery.hasPermission && (
          <EmptyState title={t("cust.noPermissionTitle")} message={t("cust.noPermissionBody")} />
        )}

        {viewPermissionQuery.hasPermission && customersQuery.isLoading && (
          <LoadingState label={t("cust.loading")} />
        )}

        {viewPermissionQuery.hasPermission && customersQuery.isError && (
          <EmptyState title={t("cust.loadErrorTitle")} message={getErrorMessage(customersQuery.error)} />
        )}

        {viewPermissionQuery.hasPermission &&
          !customersQuery.isLoading &&
          !customersQuery.isError &&
          customersList.length === 0 && (
            <EmptyState title={t("cust.emptyTitle")} message={t("cust.emptyBody")} />
          )}

        {viewPermissionQuery.hasPermission && !customersQuery.isLoading && customersList.length > 0 && (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 text-right">
                <th className="font-medium pb-2">{t("cust.customer")}</th>
                <th className="font-medium pb-2">{t("cust.email")}</th>
                <th className="font-medium pb-2">{t("cust.phone")}</th>
                <th className="font-medium pb-2">{t("cust.status")}</th>
                <th className="font-medium pb-2">{t("cust.classification")}</th>
                <th className="font-medium pb-2">{t("cust.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {customersList.map((customer) => (
                <CustomerRow
                  key={customer.customerId}
                  customer={customer}
                  companyId={currentCompanyId}
                  onOpenCompliance={() => setComplianceCustomer(customer)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddCustomer && (
        <AddCustomerModal currentCompanyId={currentCompanyId} onClose={() => setShowAddCustomer(false)} />
      )}

      {complianceCustomer && (
        <ComplianceProfileHost
          companyId={currentCompanyId}
          customer={complianceCustomer}
          canManage={canManage}
          onClose={() => setComplianceCustomer(null)}
        />
      )}
    </AppLayout>
  );
}

// Resolves the session cache read (see useCustomerComplianceProfileCache) BEFORE the form mounts,
// so the form's own field state can initialize with a plain lazy useState -- no effect needed to
// "catch up" once the read settles.
function ComplianceProfileHost({ companyId, customer, canManage, onClose }) {
  const { t } = useI18n();
  const cached = useCustomerComplianceProfileCache(companyId, customer.customerId);

  return (
    <CustomerComplianceProfileModal title={t("custCompliance.title", { name: customer.name })} onClose={onClose}>
      {cached.isFetched ? (
        <CustomerComplianceProfileForm
          companyId={companyId}
          customer={customer}
          canManage={canManage}
          cachedProfile={cached.data}
          onClose={onClose}
        />
      ) : (
        <LoadingState label={t("cust.loading")} />
      )}
    </CustomerComplianceProfileModal>
  );
}

// One customer's real name/email/phone/status, and its per-session-cached compliance
// classification (see useCustomerComplianceProfileCache -- "-" when nothing has been saved for
// it yet, never a guessed/fake value).
function CustomerRow({ customer, companyId, onOpenCompliance }) {
  const { t } = useI18n();
  return (
    <tr className="border-t border-white/5">
      <td className="py-2.5">
        <span className="text-gray-200 font-bold">{customer.name}</span>
        <span className="ms-1.5 text-[10px] text-gray-500">{customer.customerNumberFormatted}</span>
      </td>
      <td className="py-2.5 text-gray-400">{customer.email || "-"}</td>
      <td className="py-2.5 text-gray-300">
        {customer.phone ? (
          <span className="flex items-center gap-1">
            <Phone size={11} /> {customer.phone}
          </span>
        ) : (
          "-"
        )}
      </td>
      <td className="py-2.5">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            customer.status === "Suspended" ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"
          }`}
        >
          {t(`cust.status.${customer.status}`)}
        </span>
      </td>
      <td className="py-2.5 text-gray-400">
        <CustomerClassificationCell companyId={companyId} customer={customer} />
      </td>
      <td className="py-2.5">
        <button
          type="button"
          onClick={onOpenCompliance}
          className="input-dark rounded-lg px-2 py-1.5 text-[10.5px] font-bold flex items-center gap-1"
        >
          <ScrollText size={12} /> {t("custCompliance.action")}
        </button>
      </td>
    </tr>
  );
}

function CustomerClassificationCell({ companyId, customer }) {
  const { t } = useI18n();
  const cached = useCustomerComplianceProfileCache(companyId, customer.customerId);
  const classification = cached.data?.classification;
  if (classification === "Consumer") return <>{t("custCompliance.classification.consumer")}</>;
  if (classification === "Business") return <>{t("custCompliance.classification.business")}</>;
  return <>-</>;
}

function AddCustomerModal({ currentCompanyId, onClose }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const createCustomer = useCreateCustomer(currentCompanyId);

  const submit = async () => {
    if (!name.trim()) {
      setError(t("cust.nameRequired"));
      return;
    }
    setError("");
    try {
      await createCustomer.mutateAsync({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        taxNumber: null,
        address: null,
        note: null,
      });
      onClose();
    } catch (createError) {
      setError(getErrorMessage(createError));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-md panel rounded-2xl p-4">
        <h3 className="font-bold mb-3">{t("cust.createCustomer")}</h3>
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("cust.customer")} disabled={createCustomer.isPending} className="w-full input-dark p-2 rounded disabled:opacity-50" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("cust.email")} disabled={createCustomer.isPending} className="w-full input-dark p-2 rounded disabled:opacity-50" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("cust.phone")} disabled={createCustomer.isPending} className="w-full input-dark p-2 rounded disabled:opacity-50" />
          {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={onClose} disabled={createCustomer.isPending} className="panel px-3 py-2 rounded disabled:opacity-50">{t("common.cancel")}</button>
            <button onClick={submit} disabled={createCustomer.isPending} className="primary-btn px-3 py-2 rounded disabled:opacity-50">
              {createCustomer.isPending ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
