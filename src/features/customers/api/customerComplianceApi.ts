import { httpClient } from "../../../shared/api/httpClient";
import type {
  CustomerComplianceProfileResult,
  SetCustomerComplianceProfileRequest,
} from "../types/customerCompliance.types";

// The ONE existing endpoint this feature calls. No other route, no new backend surface: exactly
// PUT /api/companies/{companyId}/customers/{customerId}/compliance-profile, exactly this payload
// shape (Nobo.Api.Customers.CustomerEndpointContracts.SetCustomerComplianceProfileRequest).
export async function setCustomerComplianceProfile(
  companyId: string,
  customerId: string,
  payload: SetCustomerComplianceProfileRequest,
) {
  const response = await httpClient.put<CustomerComplianceProfileResult>(
    `/api/companies/${companyId}/customers/${customerId}/compliance-profile`,
    payload,
  );
  return response.data;
}
