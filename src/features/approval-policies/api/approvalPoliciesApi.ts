import { httpClient } from "../../../shared/api/httpClient";
import type {
  CompanyApprovalPolicy,
  SetCompanyApprovalPolicyRequest,
} from "../types/approvalPolicy.types";

function approvalPoliciesUrl(companyId: string) {
  return `/api/companies/${companyId}/approval-policies`;
}

export async function getCompanyApprovalPolicy(companyId: string, actionCode: string) {
  const response = await httpClient.get<CompanyApprovalPolicy>(
    `${approvalPoliciesUrl(companyId)}/${actionCode}`,
  );

  return response.data;
}

export async function setCompanyApprovalPolicy(
  companyId: string,
  actionCode: string,
  payload: SetCompanyApprovalPolicyRequest,
) {
  const response = await httpClient.put<CompanyApprovalPolicy>(
    `${approvalPoliciesUrl(companyId)}/${actionCode}`,
    payload,
  );

  return response.data;
}
