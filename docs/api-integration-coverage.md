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
| PUT | `/api/companies/{companyId}/catalog/products/{productId}/sales-tax-category` | Product tax assignment | `Tax.Manage` | `useSetProductSalesTaxCategory` | Tax Admin Product Assignments assign/change/clear sales tax category | Integrated |
| POST | `/api/companies/{companyId}/catalog/products/{productId}/variants` | Catalog product variants admin | `Catalog.Manage` | `useCreateProductVariant` | Catalog Admin variant create form with active unit-of-measure selector | Integrated |
| GET | `/api/companies/{companyId}/catalog/products/{productId}/variants` | Catalog product variants admin | `Catalog.View` | `useProductVariants` | Catalog Admin variant list/status filter under selected product | Integrated |
| GET | `/api/companies/{companyId}/catalog/products/{productId}/variants/{productVariantId}` | Catalog product variants admin | `Catalog.View` | `useProductVariantDetails` | Catalog Admin variant details/edit panel | Integrated |
| PUT | `/api/companies/{companyId}/catalog/products/{productId}/variants/{productVariantId}` | Catalog product variants admin | `Catalog.Manage` | `useUpdateProductVariant` | Catalog Admin variant update form | Integrated |
| PUT | `/api/companies/{companyId}/catalog/products/{productId}/variants/{productVariantId}/status` | Catalog product variants admin | `Catalog.Manage` | `useChangeProductVariantStatus` | Catalog Admin variant activate/suspend action | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/catalog/availability` | Branch ProductVariant availability admin | `Catalog.View` | `useBranchProductVariantAvailabilities` | Catalog Admin selected product current-branch availability summary | Integrated |
| GET | `/api/companies/{companyId}/branches/{branchId}/catalog/variants/{productVariantId}/availability` | Branch ProductVariant availability admin | `Catalog.View` | `useBranchProductVariantAvailability` | Catalog Admin selected ProductVariant branch availability panel | Integrated |
| PUT | `/api/companies/{companyId}/branches/{branchId}/catalog/variants/{productVariantId}/availability` | Branch ProductVariant availability admin | `Catalog.Manage` | `useSetBranchProductVariantAvailability` | Catalog Admin Make available / Make unavailable actions | Integrated |
| GET | `/api/units-of-measure` | Unit of measure reference data | Authenticated | `useActiveUnitsOfMeasure` | Catalog Admin variant sales UOM selector | Integrated |
| POST | `/api/companies/{companyId}/catalog/modifier-groups` | Catalog modifier groups admin | `Catalog.Manage` | `useCreateModifierGroup` | Catalog Admin modifier group create form | Integrated |
| GET | `/api/companies/{companyId}/catalog/modifier-groups` | Catalog modifier groups admin | `Catalog.View` | `useModifierGroups` | Catalog Admin modifier group list with status/search/pagination | Integrated |
| GET | `/api/companies/{companyId}/catalog/modifier-groups/{modifierGroupId}` | Catalog modifier groups admin | `Catalog.View` | `useModifierGroupDetails` | Catalog Admin modifier group details/edit panel | Integrated |
| PUT | `/api/companies/{companyId}/catalog/modifier-groups/{modifierGroupId}` | Catalog modifier groups admin | `Catalog.Manage` | `useUpdateModifierGroup` | Catalog Admin modifier group update form | Integrated |
| PUT | `/api/companies/{companyId}/catalog/modifier-groups/{modifierGroupId}/status` | Catalog modifier groups admin | `Catalog.Manage` | `useChangeModifierGroupStatus` | Catalog Admin modifier group activate/suspend action | Integrated |
| POST | `/api/companies/{companyId}/catalog/modifier-groups/{modifierGroupId}/options` | Catalog modifier options admin | `Catalog.Manage` | `useCreateModifierOption` | Catalog Admin modifier option create form | Integrated |
| GET | `/api/companies/{companyId}/catalog/modifier-groups/{modifierGroupId}/options` | Catalog modifier options admin | `Catalog.View` | `useModifierOptions` | Catalog Admin modifier option list/status filter | Integrated |
| GET | `/api/companies/{companyId}/catalog/modifier-groups/{modifierGroupId}/options/{modifierOptionId}` | Catalog modifier options admin | `Catalog.View` | `useModifierOptionDetails` | Catalog Admin modifier option details/edit panel | Integrated |
| PUT | `/api/companies/{companyId}/catalog/modifier-groups/{modifierGroupId}/options/{modifierOptionId}` | Catalog modifier options admin | `Catalog.Manage` | `useUpdateModifierOption` | Catalog Admin modifier option update form | Integrated |
| PUT | `/api/companies/{companyId}/catalog/modifier-groups/{modifierGroupId}/options/{modifierOptionId}/status` | Catalog modifier options admin | `Catalog.Manage` | `useChangeModifierOptionStatus` | Catalog Admin modifier option activate/suspend action | Integrated |
| GET | `/api/companies/{companyId}/catalog/variants/{productVariantId}/modifier-groups` | Catalog variant modifier assignments | `Catalog.View` | `useProductVariantModifierGroups` | Catalog Admin selected ProductVariant modifier assignment list | Integrated |
| PUT | `/api/companies/{companyId}/catalog/variants/{productVariantId}/modifier-groups/{modifierGroupId}` | Catalog variant modifier assignments | `Catalog.Manage` | `useSetProductVariantModifierGroup` | Catalog Admin assignment enable/disable min/max/sort configuration | Integrated |
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
| POST | `/api/companies/{companyId}/pricing/price-lists` | Pricing price lists admin | `Pricing.Manage` | `useCreatePriceList` | Pricing Admin price list create form | Integrated |
| GET | `/api/companies/{companyId}/pricing/price-lists` | Pricing price lists admin | `Pricing.View` | `usePriceLists` | Pricing Admin price list list/search/status filter | Integrated |
| GET | `/api/companies/{companyId}/pricing/price-lists/{priceListId}` | Pricing price lists admin | `Pricing.View` | `usePriceListDetails` | Pricing Admin selected price list configuration panel | Integrated |
| PUT | `/api/companies/{companyId}/pricing/price-lists/{priceListId}` | Pricing price lists admin | `Pricing.Manage` | `useUpdatePriceList` | Pricing Admin price list name update | Integrated |
| PUT | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/status` | Pricing price lists admin | `Pricing.Manage` | `useChangePriceListStatus` | Pricing Admin price list activate/suspend action | Integrated |
| PUT | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/tax-mode` | Pricing price lists admin | `Pricing.Manage` | `useSetPriceListTaxMode` | Pricing Admin tax mode configuration action | Integrated |
| GET | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/items` | Pricing variant prices admin | `Pricing.View` | `useProductVariantPrices` | Pricing Admin variant price list with category/product/search/configuration filters | Integrated |
| GET | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/items/{productVariantId}` | Pricing variant prices admin | `Pricing.View` | `useProductVariantPriceDetails` | Pricing Admin selected ProductVariant price details panel | Integrated |
| PUT | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/items/{productVariantId}` | Pricing variant prices admin | `Pricing.Manage` | `useSetProductVariantPrice` | Pricing Admin set/update ProductVariant price including explicit zero | Integrated |
| DELETE | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/items/{productVariantId}` | Pricing variant prices admin | `Pricing.Manage` | `useRemoveProductVariantPrice` | Pricing Admin delete configured ProductVariant price | Integrated |
| GET | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/variants/{productVariantId}/modifier-prices` | Pricing modifier prices admin | `Pricing.View` | `useModifierPrices` | Pricing Admin selected ProductVariant modifier price list | Integrated |
| GET | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/variants/{productVariantId}/modifier-groups/{modifierGroupId}/options/{modifierOptionId}` | Pricing modifier prices admin | `Pricing.View` | `useModifierPriceDetails` | Pricing Admin selected modifier option price details panel | Integrated |
| PUT | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/variants/{productVariantId}/modifier-groups/{modifierGroupId}/options/{modifierOptionId}` | Pricing modifier prices admin | `Pricing.Manage` | `useSetModifierOptionPrice` | Pricing Admin set/update modifier option price adjustment including explicit zero | Integrated |
| DELETE | `/api/companies/{companyId}/pricing/price-lists/{priceListId}/variants/{productVariantId}/modifier-groups/{modifierGroupId}/options/{modifierOptionId}` | Pricing modifier prices admin | `Pricing.Manage` | `useRemoveModifierOptionPrice` | Pricing Admin delete configured modifier option price adjustment | Integrated |
| GET | `/api/companies/{companyId}/tax/settings` | Tax settings admin | `Tax.View` | `useCompanyTaxSettings` | Tax Admin settings current enabled/configured state | Integrated |
| PUT | `/api/companies/{companyId}/tax/settings` | Tax settings admin | `Tax.Manage` | `useSetCompanyTaxSettings` | Tax Admin enable/disable company tax settings | Integrated |
| POST | `/api/companies/{companyId}/tax/categories` | Tax categories admin | `Tax.Manage` | `useCreateTaxCategory` | Tax Admin tax category create form with create-only TaxTreatment | Integrated |
| GET | `/api/companies/{companyId}/tax/categories` | Tax categories admin | `Tax.View` | `useTaxCategories` | Tax Admin category list with status/treatment/search filters and active assignment selector | Integrated |
| GET | `/api/companies/{companyId}/tax/categories/{taxCategoryId}` | Tax categories admin | `Tax.View` | `useTaxCategoryDetails` | Tax Admin selected category details/edit panel | Integrated |
| PUT | `/api/companies/{companyId}/tax/categories/{taxCategoryId}` | Tax categories admin | `Tax.Manage` | `useUpdateTaxCategory` | Tax Admin update code/name/rate percent | Integrated |
| PUT | `/api/companies/{companyId}/tax/categories/{taxCategoryId}/status` | Tax categories admin | `Tax.Manage` | `useChangeTaxCategoryStatus` | Tax Admin activate/suspend category action | Integrated |
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

Pricing Admin Coverage: Complete. Pricing Module Coverage: Complete for existing Pricing endpoints.

Tax Settings Coverage: Complete. Tax Categories Coverage: Complete. Product Tax Assignment Coverage: Complete. Tax Module Coverage: Complete for existing Tax endpoints.

Catalog Operational Coverage: Complete. Catalog Core Admin Coverage: Complete. Catalog Modifiers Admin Coverage: Complete. Catalog Module Coverage: Complete for existing Catalog endpoints.

Restaurant Operational Coverage: Complete. Restaurant Admin Coverage: Complete. Restaurant Module Coverage: Complete for existing Restaurant endpoints.

Kitchen Operational Coverage: Complete. Kitchen Admin Coverage: Complete. Kitchen Module Coverage: Complete for existing Kitchen endpoints.
