// Mirrors Nobo.Api.Compliance.GenerationUnitEndpoints EXACTLY (read-only source inspection) --
// GenerationUnitResponse / BranchGenerationUnitResponse / their request bodies. Nothing here is a
// ZATCA credential, key, secret, OTP or signing/QR field -- the real endpoints never return those,
// and none is added here.

export type GenerationUnitStatus = "Active" | "Inactive";

export type GenerationUnit = {
  id: string;
  companyId: string;
  name: string;
  status: GenerationUnitStatus;
  isDefault: boolean;
  // How many branches currently use this unit. There is no endpoint listing WHICH branches --
  // see the implementation report's "backend gaps" section.
  assignedBranchCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type CreateGenerationUnitRequest = {
  name: string;
};

export type SetGenerationUnitStatusResponse = {
  unit: GenerationUnit;
  changed: boolean;
};

// The branch's CURRENT generation unit only -- the backend keeps no assignment HISTORY (one row per
// branch, replaced on reassignment; see GenerationUnitAssignment.cs). isAssigned=false + every other
// field null means the branch has never been assigned one.
export type BranchGenerationUnit = {
  companyId: string;
  branchId: string;
  isAssigned: boolean;
  generationUnitId: string | null;
  generationUnitName: string | null;
  generationUnitStatus: GenerationUnitStatus | null;
  assignedAtUtc: string | null;
};

export type AssignGenerationUnitRequest = {
  generationUnitId: string;
};

export type AssignGenerationUnitResponse = {
  assignment: BranchGenerationUnit;
  changed: boolean;
};
