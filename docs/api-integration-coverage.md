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
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/confirm` | Sales order confirmation | `SalesOrders.Confirm` | `useConfirmSalesOrder` | POS Confirm Order action, read-only confirmed cart state | Integrated |
| GET | `/api/companies/{companyId}/payments/methods` | Operational payment methods | `Payments.Receive` | `useActivePaymentMethods` | POS active payment method selector | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/payments` | Sales order payment history | `Payments.View` | `useSalesOrderPayments` | POS payment totals/history/refundable amounts | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/payments` | Receive sales order payment | `Payments.Receive` | `useReceiveSalesOrderPayment` | POS receive payment action | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/payments/{salesOrderPaymentId}/refunds` | Refund sales order payment | `Payments.Refund` | `useRefundSalesOrderPayment` | POS historical payment refund action | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/restaurant/seating` | Restaurant seating | `Restaurant.View` | `useRestaurantSeating` | DineIn floor/table selector with backend occupancy | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations` | Kitchen operational stations | `Kitchen.View` | `useOperationalKitchenStations` | KDS station selector/filter | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations/{kitchenStationId}/tickets/open` | Kitchen open tickets | `Kitchen.View` | `useOpenKitchenTickets` | KDS New/Preparing ticket board | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations/{kitchenStationId}/tickets/{kitchenTicketId}/start` | Kitchen ticket lifecycle | `Kitchen.Manage` | `useStartKitchenTicketPreparation` | KDS New -> Preparing action | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations/{kitchenStationId}/tickets/{kitchenTicketId}/ready` | Kitchen ticket lifecycle | `Kitchen.Manage` | `useMarkKitchenTicketReady` | KDS Preparing -> Ready action | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations` | Kitchen station admin | `Kitchen.Manage` | Not implemented | Kitchen Admin CRUD deferred | Pending |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/admin/stations` | Kitchen station admin | `Kitchen.View` | Not implemented | Kitchen Admin list deferred | Pending |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/admin/stations/{kitchenStationId}` | Kitchen station admin | `Kitchen.View` | Not implemented | Kitchen Admin details deferred | Pending |
| PUT | `/api/companies/{companyId}/branches/{branchId}/kitchen/admin/stations/{kitchenStationId}` | Kitchen station admin | `Kitchen.Manage` | Not implemented | Kitchen Admin update deferred | Pending |
| PUT | `/api/companies/{companyId}/branches/{branchId}/kitchen/admin/stations/{kitchenStationId}/status` | Kitchen station admin | `Kitchen.Manage` | Not implemented | Kitchen Admin status deferred | Pending |
| PUT | `/api/companies/{companyId}/branches/{branchId}/kitchen/routes/variants/{productVariantId}/stations/{kitchenStationId}` | Kitchen routing admin | `Kitchen.Manage` | Not implemented | Route configuration deferred | Pending |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/routes/variants/{productVariantId}` | Kitchen routing admin | `Kitchen.View` | Not implemented | Route configuration deferred | Pending |
