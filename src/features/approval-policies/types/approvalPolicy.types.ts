export type ApprovalPolicyMode = "Never" | "Always" | "AboveThreshold";

export type CompanyApprovalPolicy = {
  actionCode: string;
  mode: ApprovalPolicyMode;
  thresholdAmount: number | null;
  thresholdPercent: number | null;
  hasExplicitPolicy: boolean;
};

export type SetCompanyApprovalPolicyRequest = {
  mode: ApprovalPolicyMode;
  thresholdAmount: number | null;
  thresholdPercent: number | null;
};
