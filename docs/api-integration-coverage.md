# API Integration Coverage

| Method | Route | Feature | Permission | Frontend API/hook | UI usage | Status |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | Auth | Public | `login` / `AuthProvider` | Login | Integrated |
| POST | `/api/auth/refresh` | Auth | Secure refresh cookie | `refreshSession` / HTTP interceptor | Auth restore | Integrated |
| POST | `/api/auth/logout` | Auth | Authenticated | `logout` / `AuthProvider` | Logout | Integrated |
| GET | `/api/companies/mine` | Companies | Authenticated | `useMyCompanies` | Company gate/switcher | Integrated |
| GET | `/api/companies/{companyId}` | Companies | Company access | `useCompanyDetails` | Company gate | Integrated |
| GET | `/api/companies/{companyId}/me/permissions` | Companies | Company access | `useCompanyPermissions`, `useHasPermission` | Gates/permission checks | Integrated |
| GET | `/api/companies/{companyId}/branches` | Branches | `Branches.View` | `useBranches` | Branch gate/switcher | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/pos/terminals` | POS terminals | `Pos.View` | `usePosTerminals` | Terminal selector/context | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/pos/terminals/{posTerminalId}/open-shift` | POS shifts | `Pos.View` | `useOpenPosShift` | POS operational gate | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/pos/terminals/{posTerminalId}/shifts/open` | POS shifts | `Pos.OpenShift` | `useOpenShift` | Open Shift panel | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/catalog/sellable` | POS sellable catalog | `SalesOrders.Create` | `useSellableCatalog` | POS product/category grid | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders` | Draft sales orders | `SalesOrders.Create`; `SalesOrders.ApplyDiscount` when discount included | `useCreateDraftSalesOrder` | First cart item creates backend Draft | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}` | Sales order details | `SalesOrders.View` | `useDraftSalesOrderDetails` | Draft refetch/stale conflict recovery | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/draft` | Draft sales orders | `SalesOrders.EditDraft`; `SalesOrders.ApplyDiscount` when discount included | `useUpdateDraftSalesOrder` | Quantity, line rebuild, modifiers, discount | Integrated |
