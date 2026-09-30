// Mirrors the backend's Nobo.Application.Authorization.PlatformPermissions -- plain string
// constants so nav/route code references them the same way ApplicationPermissions.*/entitlement
// codes are already referenced elsewhere in this frontend.
export const PLATFORM_COMPANIES_VIEW = "Platform.Companies.View";
export const PLATFORM_ENTITLEMENTS_VIEW = "Platform.Entitlements.View";
export const PLATFORM_ENTITLEMENTS_MANAGE = "Platform.Entitlements.Manage";
export const PLATFORM_STAFF_VIEW = "Platform.Staff.View";
export const PLATFORM_STAFF_MANAGE = "Platform.Staff.Manage";

// Mirrors Nobo.Application.Authorization.PlatformPermissions -- Registrations.* (Customer
// Registration review, P8.3/P8.4). Verified against source; one constant per handler's own
// RequirePermissionAsync call, no permission name invented.
export const PLATFORM_REGISTRATIONS_VIEW = "Platform.Registrations.View";
export const PLATFORM_REGISTRATIONS_REVIEW = "Platform.Registrations.Review";
export const PLATFORM_REGISTRATIONS_EDIT = "Platform.Registrations.Edit";
export const PLATFORM_REGISTRATIONS_REQUEST_INFORMATION = "Platform.Registrations.RequestInformation";
export const PLATFORM_REGISTRATIONS_APPROVE = "Platform.Registrations.Approve";
export const PLATFORM_REGISTRATIONS_REJECT = "Platform.Registrations.Reject";
export const PLATFORM_REGISTRATIONS_VIEW_HISTORY = "Platform.Registrations.ViewHistory";
export const PLATFORM_REGISTRATIONS_VIEW_DOCUMENTS = "Platform.Registrations.ViewDocuments";
export const PLATFORM_REGISTRATIONS_UPLOAD_DOCUMENT = "Platform.Registrations.UploadDocument";
export const PLATFORM_REGISTRATIONS_DOWNLOAD_DOCUMENT = "Platform.Registrations.DownloadDocument";
export const PLATFORM_REGISTRATIONS_REVIEW_DOCUMENTS = "Platform.Registrations.ReviewDocuments";
export const PLATFORM_REGISTRATIONS_TRIGGER_EXTRACTION = "Platform.Registrations.TriggerExtraction";
export const PLATFORM_REGISTRATIONS_VIEW_EXTRACTIONS = "Platform.Registrations.ViewExtractions";
export const PLATFORM_REGISTRATIONS_REVIEW_FIELDS = "Platform.Registrations.ReviewFields";
