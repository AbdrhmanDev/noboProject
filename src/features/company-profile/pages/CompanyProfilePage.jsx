import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileClock, FilePenLine, History, ShieldCheck } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useCompany } from "../../companies/context/CompanyContext";
import { useCompanyPermissions, useHasPermission } from "../../companies/hooks/useCompanies";
import { COMPANY_PROFILE_VIEW_PERMISSION } from "../../authorization/constants/applicationPermissions";
import { ROUTES } from "../../../utils/routes";
import {
  useApprovedCompanyProfile,
  useApprovedCompanyProfileVersion,
  useApprovedCompanyProfileVersions,
} from "../hooks/useCompanyProfile";
import { useAmendments } from "../hooks/useAmendments";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

function FieldRow({ label, value }) {
  return (
    <div className="rounded-lg bg-raised px-3 py-2">
      <div className="text-xs text-subtle">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink">{value ?? "-"}</div>
    </div>
  );
}

function ProfileContent({ profile }) {
  const { identity, address, financial, representative, contacts } = profile;
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-sm font-bold text-muted">Legal identity</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <FieldRow label="Legal name" value={identity.legalName} />
          <FieldRow label="Trade name" value={identity.tradeName} />
          <FieldRow label="VAT / tax number" value={identity.taxNumber} />
          <FieldRow label="Commercial registration number" value={identity.commercialRegistrationNumber} />
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-bold text-muted">Registered address</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <FieldRow label="Country" value={address.countryCode} />
          <FieldRow label="City" value={address.city} />
          <FieldRow label="District" value={address.district} />
          <FieldRow label="Street" value={address.street} />
          <FieldRow label="Building number" value={address.buildingNumber} />
          <FieldRow label="Additional number" value={address.additionalNumber} />
          <FieldRow label="Postal code" value={address.postalCode} />
          <FieldRow label="Unit number" value={address.unitNumber} />
          <FieldRow label="Short address" value={address.shortAddress} />
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-bold text-muted">Financial</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <FieldRow label="Bank name" value={financial.bankName} />
          <FieldRow label="IBAN" value={financial.iban} />
          <FieldRow label="Fiscal year" value={financial.fiscalYear} />
          <FieldRow label="VAT filing frequency" value={financial.vatFilingFrequency} />
          <FieldRow label="Annual revenue" value={financial.annualRevenue} />
          <FieldRow label="Annual expenses" value={financial.annualExpenses} />
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-bold text-muted">Representative</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <FieldRow label="Name" value={representative.fullName} />
          <FieldRow label="ID number" value={representative.identificationNumber} />
          <FieldRow label="Phone" value={representative.phone} />
          <FieldRow label="Email" value={representative.email} />
          <FieldRow label="Role" value={representative.role} />
          <FieldRow label="Authority basis" value={representative.authorityBasis} />
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-bold text-muted">Contacts</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <FieldRow label="Primary phone" value={contacts.primaryPhone} />
          <FieldRow label="Primary email" value={contacts.primaryEmail} />
        </div>
      </div>
      {profile.proposedBranches.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-bold text-muted">Proposed branches (from registration)</div>
          <div className="space-y-1.5">
            {profile.proposedBranches.map((branch) => (
              <div key={branch.ordinal} className="rounded-lg bg-raised px-3 py-2 text-sm text-muted">
                <span className="font-bold text-ink">{branch.name}</span> — {branch.city}
                {branch.materializedBranchId ? (
                  <span className="ms-2 rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">
                    Applied ({branch.materializedBranchStatus})
                  </span>
                ) : (
                  <span className="ms-2 text-xs text-subtle">Not applied yet -- see Branches</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VersionHistoryPanel({ companyId }) {
  const versionsQuery = useApprovedCompanyProfileVersions(companyId, true);
  const [openVersion, setOpenVersion] = useState(null);
  const versionDetailQuery = useApprovedCompanyProfileVersion(companyId, openVersion, Boolean(openVersion));

  if (versionsQuery.isLoading) return <LoadingState label="Loading version history..." />;
  if (versionsQuery.isError) return <ErrorState title="Unable to load version history" message={getErrorMessage(versionsQuery.error)} />;
  if ((versionsQuery.data || []).length === 0) return <EmptyState title="No versions yet" message="No approved profile version exists." />;

  return (
    <div className="space-y-2">
      {versionsQuery.data.map((version) => (
        <div key={version.versionId} className="rounded-xl border border-line bg-raised p-3">
          <button
            type="button"
            onClick={() => setOpenVersion(openVersion === version.versionNumber ? null : version.versionNumber)}
            className="flex w-full items-center justify-between gap-2 text-start"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-ink">
                v{version.versionNumber}
                {version.supersedesVersionNumber != null && (
                  <span className="text-xs font-normal text-subtle">(supersedes v{version.supersedesVersionNumber})</span>
                )}
              </div>
              <div className="text-xs text-subtle">Approved {formatDateTime(version.approvedAtUtc)}</div>
            </div>
            <History size={14} className="text-subtle" />
          </button>
          {openVersion === version.versionNumber && (
            <div className="mt-3 border-t border-line pt-3">
              {versionDetailQuery.isLoading && <LoadingState label="Loading this version..." />}
              {versionDetailQuery.isError && (
                <ErrorState title="Unable to load version" message={getErrorMessage(versionDetailQuery.error)} />
              )}
              {versionDetailQuery.data && (
                <>
                  <p className="mb-2 text-xs text-subtle">
                    A historical, read-only snapshot -- the backend has no endpoint to edit a past version. To
                    change the current profile, start an amendment.
                  </p>
                  <ProfileContent profile={versionDetailQuery.data} />
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CompanyProfilePage() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const viewPermissionQuery = useHasPermission(currentCompanyId, COMPANY_PROFILE_VIEW_PERMISSION);
  const permissionsQuery = useCompanyPermissions(currentCompanyId);
  const isOwner = Boolean(permissionsQuery.data?.isOwner);
  const canView = viewPermissionQuery.hasPermission;

  const profileQuery = useApprovedCompanyProfile(currentCompanyId, canView);
  const amendmentsQuery = useAmendments(currentCompanyId, isOwner);
  const [tab, setTab] = useState("profile");

  const openAmendment = (amendmentsQuery.data || []).find((amendment) =>
    ["Draft", "Submitted", "UnderReview", "NeedsMoreInformation"].includes(amendment.status),
  );

  return (
    <AppLayout>
      <main className="odoo-root space-y-3" dir="rtl">
        <PageHeader
          title="Company Profile"
          actions={
            isOwner && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.COMPANY_PROFILE_AMENDMENTS)}
                className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white"
              >
                <FilePenLine size={14} /> {openAmendment ? "Continue amendment" : "Amendments"}
              </button>
            )
          }
        />

        {!currentCompanyId ? (
          <EmptyState title="Company required" message="Select a company to see its profile." />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label="Checking permissions..." />
        ) : !canView ? (
          <ErrorState title="Permission required" message="CompanyProfile.View permission is required to see the company profile." />
        ) : (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("profile")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${
                  tab === "profile" ? "bg-accent text-white" : "border border-line text-muted"
                }`}
              >
                <ShieldCheck size={13} /> Current profile
              </button>
              <button
                type="button"
                onClick={() => setTab("history")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${
                  tab === "history" ? "bg-accent text-white" : "border border-line text-muted"
                }`}
              >
                <FileClock size={13} /> Version history
              </button>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4">
              {tab === "profile" ? (
                profileQuery.isLoading ? (
                  <LoadingState label="Loading company profile..." />
                ) : profileQuery.isError ? (
                  <ErrorState title="Unable to load profile" message={getErrorMessage(profileQuery.error)} />
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <StatusBadge tone="success">Approved</StatusBadge>
                      <span className="text-sm text-muted">
                        Current version v{profileQuery.data.version.versionNumber} · approved{" "}
                        {formatDateTime(profileQuery.data.version.approvedAtUtc)}
                      </span>
                    </div>
                    <ProfileContent profile={profileQuery.data} />
                  </>
                )
              ) : (
                <VersionHistoryPanel companyId={currentCompanyId} />
              )}
            </div>
          </>
        )}
      </main>
    </AppLayout>
  );
}
