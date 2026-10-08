import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileClock, FilePenLine, History, Package, ShieldCheck } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/utils/formatters";
import { useResolvedImageSrc } from "../../../shared/hooks/useResolvedImageSrc";
import { useCompany } from "../../companies/context/CompanyContext";
import {
  useCompanyDetails,
  useCompanyPermissions,
  useDeleteCompanyLogo,
  useHasPermission,
  useSetCompanyReceiptContactLines,
  useUploadCompanyLogo,
} from "../../companies/hooks/useCompanies";
import { COMPANY_PROFILE_VIEW_PERMISSION } from "../../authorization/constants/applicationPermissions";
import { ROUTES } from "../../../utils/routes";
import {
  useApprovedCompanyProfile,
  useApprovedCompanyProfileVersion,
  useApprovedCompanyProfileVersions,
} from "../hooks/useCompanyProfile";
import { useAmendments } from "../hooks/useAmendments";

// Company-administration functionality -- gated on the existing Company.Manage permission, same
// convention as ApprovalPoliciesPage.jsx's local COMPANY_MANAGE_PERMISSION constant.
const COMPANY_MANAGE_PERMISSION = "Company.Manage";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

// The logo printed at the top of the POS customer receipt. Independent of the read-only, amendment-
// versioned profile fields below it -- this is a plain mutable upload/delete, not part of that flow.
function CompanyLogoCard({ companyId, canManage }) {
  const fileInputRef = useRef(null);
  const [notice, setNotice] = useState("");
  const detailsQuery = useCompanyDetails(companyId);
  const uploadMutation = useUploadCompanyLogo(companyId);
  const deleteMutation = useDeleteCompanyLogo(companyId);
  const { src: logoPreviewSrc, failed: logoPreviewFailed } = useResolvedImageSrc(detailsQuery.data?.logoUrl);

  if (detailsQuery.isError) return null;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const pickLogoFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    uploadMutation.mutate(file, {
      onSuccess: () => showNotice("Logo updated."),
      onError: (error) => showNotice(getErrorMessage(error)),
    });
  };

  const removeLogo = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => showNotice("Logo removed."),
      onError: (error) => showNotice(getErrorMessage(error)),
    });
  };

  const hasLogo = Boolean(detailsQuery.data?.logoUrl);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 text-sm font-bold text-muted">Receipt logo</div>
      <p className="mb-3 text-xs text-subtle">Printed at the top of every POS customer receipt.</p>
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-raised">
          {logoPreviewSrc && !logoPreviewFailed ? (
            <img src={logoPreviewSrc} alt="" className="h-full w-full object-contain" />
          ) : (
            <Package size={20} className="text-subtle" />
          )}
        </div>
        {canManage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={pickLogoFile}
            />
            <button
              type="button"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadMutation.isPending ? "Uploading..." : hasLogo ? "Replace" : "Upload"}
            </button>
            {hasLogo && (
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={removeLogo}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Removing..." : "Remove"}
              </button>
            )}
          </>
        )}
      </div>
      {notice && <div className="mt-3 rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">{notice}</div>}
    </div>
  );
}

// Free-text lines (e.g. a branch/delivery phone number) printed just above "Thank you" on the
// receipt. One line per entry; the backend trims/drops blanks and caps count and length.
function ReceiptContactLinesCard({ companyId, canManage }) {
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState(null);
  const detailsQuery = useCompanyDetails(companyId);
  const saveMutation = useSetCompanyReceiptContactLines(companyId);

  if (detailsQuery.isError || !canManage) return null;

  const savedText = (detailsQuery.data?.receiptContactLines || []).join("\n");
  const text = draft ?? savedText;
  const isDirty = draft !== null && draft !== savedText;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const save = () => {
    saveMutation.mutate(text.trim() === "" ? null : text, {
      onSuccess: () => {
        setDraft(null);
        showNotice("Saved.");
      },
      onError: (error) => showNotice(getErrorMessage(error)),
    });
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 text-sm font-bold text-muted">Receipt contact lines</div>
      <p className="mb-3 text-xs text-subtle">
        Printed just above "Thank you" on the receipt, one per line (e.g. a delivery or branch phone number).
      </p>
      <textarea
        value={text}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        placeholder={"Delivery: 0555555555\nBranch: 0111111111"}
        className="w-full rounded-xl border border-line bg-raised px-3 py-2 text-sm text-ink"
      />
      <button
        type="button"
        disabled={!isDirty || saveMutation.isPending}
        onClick={save}
        className="mt-2 flex h-11 items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saveMutation.isPending ? "Saving..." : "Save"}
      </button>
      {notice && <div className="mt-3 rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent">{notice}</div>}
    </div>
  );
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
  const manageCompanyQuery = useHasPermission(currentCompanyId, COMPANY_MANAGE_PERMISSION);
  const permissionsQuery = useCompanyPermissions(currentCompanyId);
  const isOwner = Boolean(permissionsQuery.data?.isOwner);
  const canView = viewPermissionQuery.hasPermission;
  const canManageCompany = manageCompanyQuery.hasPermission;

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

        {currentCompanyId && <CompanyLogoCard companyId={currentCompanyId} canManage={canManageCompany} />}
        {currentCompanyId && <ReceiptContactLinesCard companyId={currentCompanyId} canManage={canManageCompany} />}

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
                  profileQuery.error?.code === "CompanyProfile.NotFound" ? (
                    <EmptyState
                      title="No approved profile yet"
                      message="This company has no approved profile yet. An approved profile is created once a customer registration for this company is reviewed and approved."
                    />
                  ) : (
                    <ErrorState title="Unable to load profile" message={getErrorMessage(profileQuery.error)} />
                  )
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
