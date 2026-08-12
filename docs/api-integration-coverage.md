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
| GET | `/api/companies/{companyId}/branches/{branchId}/pos/terminals` | POS terminals | `Pos.View` | `usePosTerminals` | Terminal selector/context and POS Terminal Admin list/search/filter | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/pos/terminals/{posTerminalId}` | POS terminal admin | `Pos.View` | `usePosTerminalDetails` | POS Terminal Admin details/edit panel | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/pos/terminals` | POS terminal admin | `Pos.Configure` | `useCreatePosTerminal` | POS Terminal Admin create form | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/pos/terminals/{posTerminalId}` | POS terminal admin | `Pos.Configure` | `useUpdatePosTerminal` | POS Terminal Admin update/status actions | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/pos/terminals/{posTerminalId}/open-shift` | POS shifts | `Pos.View` | `useOpenPosShift` | POS operational gate | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/pos/terminals/{posTerminalId}/shifts/open` | POS shifts | `Pos.OpenShift` | `useOpenShift` | Open Shift panel | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/pos/shifts/{posShiftId}/cash-movements` | POS cash drawer movements | `Pos.AdjustCashDrawer` | `useManualCashMovement` | Current shift Cash In / Cash Out modal | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/pos/shifts/{posShiftId}/close` | POS shifts | `Pos.CloseShift` | `useClosePosShift` | POS close shift cash reconciliation modal | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/pos/shifts` | POS shift history | `Pos.View` | `usePosShifts` | POS Shift History page with server filters/pagination | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/pos/shifts/{posShiftId}` | POS shift details | `Pos.View` | `usePosShiftDetails` | POS Shift History details reconciliation panel | Integrated |

POS Module Coverage: Complete for existing POS Operational and POS Terminal Admin endpoints. Other admin modules remain deferred below.

| GET | `/api/companies/{companyId}/branches/{branchId}/catalog/sellable` | POS sellable catalog | `SalesOrders.Create` | `useSellableCatalog` | POS product/category grid | Integrated |
| POST | `/api/companies/{companyId}/catalog/categories` | Catalog categories admin | `Catalog.Manage` | `useCreateCategory` | Catalog Admin category create form | Integrated |
| GET | `/api/companies/{companyId}/catalog/categories` | Catalog categories admin | `Catalog.View` | `useCategories` | Catalog Admin category list/status filter and parent selectors | Integrated |
| GET | `/api/companies/{companyId}/catalog/categories/{categoryId}` | Catalog categories admin | `Catalog.View` | `useCategoryDetails` | Catalog Admin category details/edit panel | Integrated |
| PUT | `/api/companies/{companyId}/catalog/categories/{categoryId}` | Catalog categories admin | `Catalog.Manage` | `useUpdateCategory` | Catalog Admin category update form | Integrated |
| PUT | `/api/companies/{companyId}/catalog/categories/{categoryId}/status` | Catalog categories admin | `Catalog.Manage` | `useChangeCategoryStatus` | Catalog Admin category activate/suspend action | Integrated |
| POST | `/api/companies/{companyId}/catalog/products` | Catalog products admin | `Catalog.Manage` | `useCreateProduct` | Catalog Admin product create form with real category selector | Integrated |
| GET | `/api/companies/{companyId}/catalog/products` | Catalog products admin | `Catalog.View` | `useProducts` | Catalog Admin product paged list with category/status/search filters | Integrated |
| GET | `/api/companies/{companyId}/catalog/products/{productId}` | Catalog products admin | `Catalog.View` | `useProductDetails` | Catalog Admin product details with variant summaries and tax read-only fields | Integrated |
| PUT | `/api/companies/{companyId}/catalog/products/{productId}` | Catalog products admin | `Catalog.Manage` | `useUpdateProduct` | Catalog Admin product update form | Integrated |
| PUT | `/api/companies/{companyId}/catalog/products/{productId}/status` | Catalog products admin | `Catalog.Manage` | `useChangeProductStatus` | Catalog Admin product activate/suspend action | Integrated |
| PUT | `/api/companies/{companyId}/catalog/products/{productId}/sales-tax-category` | Product tax assignment | `Tax.Manage` | Not implemented | Tax module mutation deferred; Catalog Admin displays tax assignment read-only | Pending |
| POST | `/api/companies/{companyId}/catalog/products/{productId}/variants` | Catalog product variants admin | `Catalog.Manage` | `useCreateProductVariant` | Catalog Admin variant create form with active unit-of-measure selector | Integrated |
| GET | `/api/companies/{companyId}/catalog/products/{productId}/variants` | Catalog product variants admin | `Catalog.View` | `useProductVariants` | Catalog Admin variant list/status filter under selected product | Integrated |
| GET | `/api/companies/{companyId}/catalog/products/{productId}/variants/{productVariantId}` | Catalog product variants admin | `Catalog.View` | `useProductVariantDetails` | Catalog Admin variant details/edit panel | Integrated |
| PUT | `/api/companies/{companyId}/catalog/products/{productId}/variants/{productVariantId}` | Catalog product variants admin | `Catalog.Manage` | `useUpdateProductVariant` | Catalog Admin variant update form | Integrated |
| PUT | `/api/companies/{companyId}/catalog/products/{productId}/variants/{productVariantId}/status` | Catalog product variants admin | `Catalog.Manage` | `useChangeProductVariantStatus` | Catalog Admin variant activate/suspend action | Integrated |
| GET | `/api/units-of-measure` | Unit of measure reference data | Authenticated | `useActiveUnitsOfMeasure` | Catalog Admin variant sales UOM selector | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders` | Draft sales orders | `SalesOrders.Create`; `SalesOrders.ApplyDiscount` when discount included | `useCreateDraftSalesOrder` | First cart item creates backend Draft | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}` | Sales order details | `SalesOrders.View` | `useDraftSalesOrderDetails` | Draft refetch/stale conflict recovery | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/draft` | Draft sales orders | `SalesOrders.EditDraft`; `SalesOrders.ApplyDiscount` when discount included | `useUpdateDraftSalesOrder` | Quantity, line rebuild, modifiers, discount | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/confirm` | Sales order confirmation | `SalesOrders.Confirm` | `useConfirmSalesOrder` | POS Confirm Order action, read-only confirmed cart state | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/close` | Sales order close | `SalesOrders.Close` | `useCloseSalesOrder` | POS Close Order action after full payment/kitchen readiness | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/cancel` | Sales order cancel | `SalesOrders.Cancel` | `useCancelSalesOrder` | POS Cancel action before preparation | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/void-prepared` | Prepared sales order void | `SalesOrders.VoidPrepared` | `useVoidPreparedSalesOrder` | POS Prepared Void action after preparation starts | Integrated |
| GET | `/api/companies/{companyId}/payments/methods` | Operational payment methods | `Payments.Receive` | `useActivePaymentMethods` | POS active payment method selector | Integrated |
| POST | `/api/companies/{companyId}/payments/methods` | Payment method admin | `Payments.Configure` | `useCreatePaymentMethod` | Payment Methods create form with immutable Kind selection | Integrated |
| GET | `/api/companies/{companyId}/payments/admin/methods` | Payment method admin | `Payments.Configure` | `usePaymentMethods` | Payment Methods admin list with status/kind/search filters | Integrated |
| GET | `/api/companies/{companyId}/payments/admin/methods/{paymentMethodId}` | Payment method admin | `Payments.Configure` | `usePaymentMethodDetails` | Payment Methods details/edit panel | Integrated |
| PUT | `/api/companies/{companyId}/payments/admin/methods/{paymentMethodId}` | Payment method admin | `Payments.Configure` | `useUpdatePaymentMethod` | Payment Methods update form for code/name/sort order | Integrated |
| PUT | `/api/companies/{companyId}/payments/admin/methods/{paymentMethodId}/status` | Payment method admin | `Payments.Configure` | `useChangePaymentMethodStatus` | Payment Methods activate/suspend action | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/payments` | Sales order payment history | `Payments.View` | `useSalesOrderPayments` | POS payment totals/history/refundable amounts | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/payments` | Receive sales order payment | `Payments.Receive` | `useReceiveSalesOrderPayment` | POS receive payment action | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/sales-orders/{salesOrderId}/payments/{salesOrderPaymentId}/refunds` | Refund sales order payment | `Payments.Refund` | `useRefundSalesOrderPayment` | POS historical payment refund action | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/restaurant/seating` | Restaurant seating | `Restaurant.View` | `useRestaurantSeating` | DineIn floor/table selector with backend occupancy | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors` | Restaurant floor admin | `Restaurant.Manage` | `useCreateRestaurantFloor` | Restaurant Configuration floor create form | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors` | Restaurant floor admin | `Restaurant.View` | `useRestaurantFloors` | Restaurant Configuration floor list/status filter | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors/{floorId}` | Restaurant floor admin | `Restaurant.View` | `useRestaurantFloorDetails` | Restaurant Configuration floor details/tables panel | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors/{floorId}` | Restaurant floor admin | `Restaurant.Manage` | `useUpdateRestaurantFloor` | Restaurant Configuration floor edit form | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors/{floorId}/status` | Restaurant floor admin | `Restaurant.Manage` | `useChangeRestaurantFloorStatus` | Restaurant Configuration floor activate/suspend action | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors/{floorId}/tables` | Restaurant table admin | `Restaurant.Manage` | `useCreateRestaurantTable` | Restaurant Configuration table create form | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors/{floorId}/tables` | Restaurant table admin | `Restaurant.View` | `useRestaurantTables` | Restaurant Configuration table list/status filter | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors/{floorId}/tables/{tableId}` | Restaurant table admin | `Restaurant.View` | `useRestaurantTableDetails` | Restaurant Configuration table details/edit panel | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors/{floorId}/tables/{tableId}` | Restaurant table admin | `Restaurant.Manage` | `useUpdateRestaurantTable` | Restaurant Configuration table edit form | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/restaurant/floors/{floorId}/tables/{tableId}/status` | Restaurant table admin | `Restaurant.Manage` | `useChangeRestaurantTableStatus` | Restaurant Configuration table activate/suspend action | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations` | Kitchen operational stations | `Kitchen.View` | `useOperationalKitchenStations` | KDS station selector/filter | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations/{kitchenStationId}/tickets/open` | Kitchen open tickets | `Kitchen.View` | `useOpenKitchenTickets` | KDS New/Preparing ticket board | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations/{kitchenStationId}/tickets/{kitchenTicketId}/start` | Kitchen ticket lifecycle | `Kitchen.Manage` | `useStartKitchenTicketPreparation` | KDS New -> Preparing action | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations/{kitchenStationId}/tickets/{kitchenTicketId}/ready` | Kitchen ticket lifecycle | `Kitchen.Manage` | `useMarkKitchenTicketReady` | KDS Preparing -> Ready action | Integrated |
| POST | `/api/companies/{companyId}/branches/{branchId}/kitchen/stations` | Kitchen station admin | `Kitchen.Manage` | `useCreateKitchenStation` | Kitchen Configuration station create form | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/admin/stations` | Kitchen station admin | `Kitchen.View` | `useKitchenStations` | Kitchen Configuration station list/search/status filter | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/admin/stations/{kitchenStationId}` | Kitchen station admin | `Kitchen.View` | `useKitchenStationDetails` | Kitchen Configuration station details/routes panel | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/kitchen/admin/stations/{kitchenStationId}` | Kitchen station admin | `Kitchen.Manage` | `useUpdateKitchenStation` | Kitchen Configuration station edit form | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/kitchen/admin/stations/{kitchenStationId}/status` | Kitchen station admin | `Kitchen.Manage` | `useChangeKitchenStationStatus` | Kitchen Configuration activate/suspend action | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/kitchen/routes/variants/{productVariantId}/stations/{kitchenStationId}` | Kitchen routing admin | `Kitchen.Manage` | `useSetProductVariantKitchenRoute` | Kitchen Configuration route assign/enable/disable | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/kitchen/routes/variants/{productVariantId}` | Kitchen routing admin | `Kitchen.View` | `useProductVariantKitchenRoutes` | Kitchen Configuration variant route list | Integrated |

Payments Operational Coverage: Complete. Payment Methods Admin Coverage: Complete. Payments Module Coverage: Complete for existing Payment and Payment Method endpoints.

Catalog Operational Coverage: Complete. Catalog Core Admin Coverage: Complete. Catalog Modifiers Admin: Pending. Tax assignment mutation: Pending for Tax module.

Restaurant Operational Coverage: Complete. Restaurant Admin Coverage: Complete. Restaurant Module Coverage: Complete for existing Restaurant endpoints.

Kitchen Operational Coverage: Complete. Kitchen Admin Coverage: Complete. Kitchen Module Coverage: Complete for existing Kitchen endpoints.
