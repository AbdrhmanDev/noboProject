// Mirrors Nobo.Api.Compliance.CompanyComplianceEndpoints EXACTLY (read-only source inspection) --
// CompanyComplianceStatusResponse / CompanyComplianceChangeResponse / the disable request body.
// Nothing here is a ZATCA credential, key, secret, OTP or signing/QR field -- the real endpoints
// never return those, and none is added here.

export type CompanyComplianceState = "Disabled" | "Enabled";

export type CompanyComplianceStatus = {
  companyId: string;
  state: CompanyComplianceState;
  isEnabled: boolean;
  stateChangedAtUtc: string | null;
};

export type CompanyComplianceChangeResult = {
  status: CompanyComplianceStatus;
  changed: boolean;
};

export type DisableCompanyComplianceRequest = {
  reason?: string | null;
};
