import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  History,
  Layers3,
  Package,
  Power,
  Search,
  UserRound,
} from "lucide-react";
import { ROUTES } from "../../utils/routes";
import AppLayout from "../../components/AppLayout";
import { useI18n } from "../../i18n/I18nContext";
import { formatMoney } from "../../shared/utils/formatters";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useCurrentUserProfile } from "../../features/auth/hooks/useCurrentUserProfile";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { PosOperationalGate } from "../../features/pos/components/PosOperationalGate";
import { useCompanyTaxSettings } from "../../features/tax/hooks/useTax";
import { usePos } from "../../features/pos/context/PosContext";
import { useOpenPosShift } from "../../features/pos/hooks/useOpenPosShift";
import { useClosePosShift } from "../../features/pos/hooks/useClosePosShift";
import { useManualCashMovement } from "../../features/pos/hooks/useManualCashMovement";
import { useSellableCatalog } from "../../features/pos/hooks/useSellableCatalog";
import { useResolveBarcode } from "../../features/pos/hooks/useResolveBarcode";
import { useKeyboardWedgeScanner } from "../../features/scanning/hooks/useKeyboardWedgeScanner";
import { useQueryClient } from "@tanstack/react-query";
import {
  draftSalesOrderQueryKeys,
  useConfirmSalesOrder,
  useCreateDraftSalesOrder,
  useCloseSalesOrder,
  useCancelSalesOrder,
  useDraftSalesOrderDetails,
  useRequestSalesOrderDiscount,
  useVoidPreparedSalesOrder,
  useUpdateDraftSalesOrder,
} from "../../features/sales-orders/hooks/useDraftSalesOrder";
import { getSalesOrderDetails } from "../../features/sales-orders/api/draftSalesOrdersApi";
import { useDraftLineEditor } from "../../features/pos/hooks/useDraftLineEditor";
import {
  useActivePaymentMethods,
  useReceiveSalesOrderPayment,
  useRefundSalesOrderPayment,
} from "../../features/payments/hooks/usePayments";
import {
  useApproveSalesOrderPaymentRefund,
  useSalesOrderPaymentRefundApproval,
} from "../../features/approvals/hooks/useApprovals";
import {
  useInvalidateRestaurantSeating,
  useRestaurantSeating,
} from "../../features/restaurant/hooks/useRestaurantSeating";
import { ALL_CATEGORY_ID, CatalogPanel, UNCATEGORIZED_CATEGORY_ID } from "../../features/pos/components/catalog/CatalogPanel";
import { OrderSidebar } from "../../features/pos/components/order/OrderSidebar";
import { OrderDialogs } from "../../features/pos/components/order/OrderDialogs";
import { OrderRetrievalModal } from "../../features/pos/components/order/OrderRetrievalModal";
import { PaymentStep } from "../../features/pos/components/payment/PaymentStep";
import { CompleteStep } from "../../features/pos/components/payment/CompleteStep";
import { ShiftDialogs } from "../../features/pos/components/shift/ShiftDialogs";
import { ShiftReportDialog } from "../../features/pos/components/shift/ShiftReportDialog";
import { PosMiscDialogs } from "../../features/pos/components/PosMiscDialogs";
import { NumericKeypadModal } from "../../features/pos/components/keypad/NumericKeypadModal";
import {
  getCashMovementLabel,
  parseMoneyInput,
  parseNonNegativeMoneyInput,
} from "../../features/pos/utils/posFormatters";
import { getOrderPrimaryAction } from "../../features/pos/components/order/getOrderPrimaryAction";
import { SCOPE_PRIORITY, SHORTCUT_SCOPES } from "../../features/shortcuts/registry";
import { useShortcutScope } from "../../features/shortcuts/useShortcuts";
import { ShortcutHint } from "../../features/shortcuts/components/ShortcutHint";
import { getFocusableGridItems, ROVING_ITEM_SELECTOR } from "../../features/shortcuts/rovingFocus";
import {
  CATALOG_MANAGE_PERMISSION,
  CUSTOMERS_MANAGE_PERMISSION,
  CUSTOMERS_VIEW_PERMISSION,
  PAYMENTS_RECEIVE_PERMISSION,
  PAYMENTS_REFUND_PERMISSION,
  PAYMENTS_VIEW_PERMISSION,
  POS_ADJUST_CASH_DRAWER_PERMISSION,
  POS_CLOSE_SHIFT_PERMISSION,
  PRICING_MANAGE_PERMISSION,
  RESTAURANT_VIEW_PERMISSION,
  SALES_ORDERS_APPLY_DISCOUNT_PERMISSION,
  SALES_ORDERS_CANCEL_PERMISSION,
  SALES_ORDERS_CLOSE_PERMISSION,
  SALES_ORDERS_CONFIRM_PERMISSION,
  SALES_ORDERS_CREATE_PERMISSION,
  SALES_ORDERS_EDIT_DRAFT_PERMISSION,
  SALES_ORDERS_VIEW_PERMISSION,
  SALES_ORDERS_VOID_PREPARED_PERMISSION,
} from "../../features/authorization/constants/applicationPermissions";

const DEFAULT_FULFILLMENT_TYPE = "Takeaway";

// Backend error codes -> localized POS discount messages (never raw exception text when known).
const DISCOUNT_ERROR_KEYS = {
  "Authorization.PermissionDenied": "pos.discount.errors.permissionDenied",
  "Entitlement.NotEnabled": "pos.discount.errors.entitlementNotEnabled",
  "Branch.NotAccessible": "pos.discount.errors.branchNotAccessible",
  "SalesOrder.NotEditable": "pos.discount.errors.notEditable",
  "SalesOrder.NotAvailable": "pos.discount.errors.notAvailable",
  "SalesOrder.DiscountExceedsOrderAmount": "pos.discount.errors.exceedsOrder",
  "SalesOrder.DiscountNotApplicable": "pos.discount.errors.notApplicable",
  "SalesOrder.InvalidDiscountValue": "pos.discount.errors.invalidValue",
  "SalesOrder.InvalidDiscountType": "pos.discount.errors.invalidValue",
  "SalesOrder.DiscountPrecisionInvalid": "pos.discount.errors.invalidValue",
  "SalesOrder.DiscountReasonRequired": "pos.discount.errors.reasonRequired",
  "SalesOrder.DiscountReasonTooLong": "pos.discount.errors.reasonRequired",
};

export default function POSPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { status, session } = useAuth();
  const currentUserProfileQuery = useCurrentUserProfile();
  // Real authenticated cashier identity only (Cashier Real Identity task) -- displayName once
  // /api/auth/me resolves, the session's own real email as an immediate fallback. Never a
  // hardcoded name.
  const currentCashierName = currentUserProfileQuery.data?.displayName || session?.email || "";
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const { currentPosTerminalId } = usePos();
  const openShiftQuery = useOpenPosShift(
    currentCompanyId,
    currentBranchId,
    currentPosTerminalId,
    Boolean(currentPosTerminalId),
  );
  const catalogPermissionQuery = useHasPermission(
    currentCompanyId,
    SALES_ORDERS_CREATE_PERMISSION,
  );
  // Backend UpdateDraftSalesOrderHandler requires SalesOrders.EditDraft for every line-level
  // mutation (add/remove/quantity) on an already-existing draft. POS Authorization Hardening,
  // priority 2: line-item edit controls must honor this permission, not just order status.
  const editDraftPermissionQuery = useHasPermission(
    currentCompanyId,
    SALES_ORDERS_EDIT_DRAFT_PERMISSION,
  );
  // Backend GetSalesOrderDetails/GetRetrievableSalesOrders both require SalesOrders.View. POS
  // Authorization Hardening, priority 4: order retrieval must honor this permission explicitly.
  const salesOrdersViewPermissionQuery = useHasPermission(
    currentCompanyId,
    SALES_ORDERS_VIEW_PERMISSION,
  );
  const discountPermissionQuery = useHasPermission(
    currentCompanyId,
    SALES_ORDERS_APPLY_DISCOUNT_PERMISSION,
  );
  const confirmPermissionQuery = useHasPermission(
    currentCompanyId,
    SALES_ORDERS_CONFIRM_PERMISSION,
  );
  const closePermissionQuery = useHasPermission(
    currentCompanyId,
    SALES_ORDERS_CLOSE_PERMISSION,
  );
  const cancelPermissionQuery = useHasPermission(
    currentCompanyId,
    SALES_ORDERS_CANCEL_PERMISSION,
  );
  const voidPreparedPermissionQuery = useHasPermission(
    currentCompanyId,
    SALES_ORDERS_VOID_PREPARED_PERMISSION,
  );
  const restaurantPermissionQuery = useHasPermission(
    currentCompanyId,
    RESTAURANT_VIEW_PERMISSION,
  );
  const cashDrawerPermissionQuery = useHasPermission(
    currentCompanyId,
    POS_ADJUST_CASH_DRAWER_PERMISSION,
  );
  const closeShiftPermissionQuery = useHasPermission(
    currentCompanyId,
    POS_CLOSE_SHIFT_PERMISSION,
  );
  const paymentsViewPermissionQuery = useHasPermission(
    currentCompanyId,
    PAYMENTS_VIEW_PERMISSION,
  );
  const paymentsReceivePermissionQuery = useHasPermission(
    currentCompanyId,
    PAYMENTS_RECEIVE_PERMISSION,
  );
  const paymentsRefundPermissionQuery = useHasPermission(
    currentCompanyId,
    PAYMENTS_REFUND_PERMISSION,
  );
  const catalogManagePermissionQuery = useHasPermission(
    currentCompanyId,
    CATALOG_MANAGE_PERMISSION,
  );
  const pricingManagePermissionQuery = useHasPermission(
    currentCompanyId,
    PRICING_MANAGE_PERMISSION,
  );
  const customersViewPermissionQuery = useHasPermission(
    currentCompanyId,
    CUSTOMERS_VIEW_PERMISSION,
  );
  const customersManagePermissionQuery = useHasPermission(
    currentCompanyId,
    CUSTOMERS_MANAGE_PERMISSION,
  );
  const canLoadCatalog =
    status === "authenticated" &&
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    Boolean(currentPosTerminalId) &&
    !catalogPermissionQuery.isLoading &&
    !catalogPermissionQuery.isError &&
    catalogPermissionQuery.hasPermission;
  const sellableCatalogQuery = useSellableCatalog(
    currentCompanyId,
    currentBranchId,
    canLoadCatalog,
  );
  const resolveBarcodeMutation = useResolveBarcode(currentCompanyId, currentBranchId);
  const taxSettingsQuery = useCompanyTaxSettings(currentCompanyId, canLoadCatalog);
  const taxSetupRequired = Boolean(
    taxSettingsQuery.data && !taxSettingsQuery.data.isConfigured,
  );
  const openShiftId = openShiftQuery.data?.posShiftId || null;
  const hasOpenShift = Boolean(openShiftId);
  const cashMovementMutation = useManualCashMovement(
    currentCompanyId,
    currentBranchId,
    currentPosTerminalId,
    openShiftId,
  );
  const closeShiftMutation = useClosePosShift(
    currentCompanyId,
    currentBranchId,
    currentPosTerminalId,
    openShiftId,
  );
  const draftScope = `${currentCompanyId || ""}:${currentBranchId || ""}:${currentPosTerminalId || ""}:${openShiftId || ""}`;
  const [draftSession, setDraftSession] = useState({
    scope: "",
    salesOrderId: null,
  });
  const draftSalesOrderId =
    draftSession.scope === draftScope ? draftSession.salesOrderId : null;
  const draftDetailsQuery = useDraftSalesOrderDetails(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
    Boolean(draftSalesOrderId),
  );
  const createDraftMutation = useCreateDraftSalesOrder(
    currentCompanyId,
    currentBranchId,
  );
  const updateDraftMutation = useUpdateDraftSalesOrder(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
  );
  // Discount-only endpoint used ONLY when the user lacks SalesOrders.ApplyDiscount (the backend
  // decides Applied vs ApprovalRequired). Authorized users keep the existing full-draft PUT path.
  const requestDiscountMutation = useRequestSalesOrderDiscount(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
  );
  const confirmSalesOrderMutation = useConfirmSalesOrder(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
  );
  const closeSalesOrderMutation = useCloseSalesOrder(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
  );
  const cancelSalesOrderMutation = useCancelSalesOrder(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
  );
  const voidPreparedSalesOrderMutation = useVoidPreparedSalesOrder(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
  );
  // Loaded as soon as the cashier is allowed to take payments (not only once a draft exists), so
  // the basket's payment-method choice is usable on an empty cart too.
  const paymentMethodsQuery = useActivePaymentMethods(
    currentCompanyId,
    !paymentsReceivePermissionQuery.isLoading && paymentsReceivePermissionQuery.hasPermission,
  );
  const receivePaymentMutation = useReceiveSalesOrderPayment(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
    currentPosTerminalId,
  );
  const refundPaymentMutation = useRefundSalesOrderPayment(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
    currentPosTerminalId,
  );
  const approveRefundMutation = useApproveSalesOrderPaymentRefund(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
    currentPosTerminalId,
  );
  const invalidateRestaurantSeating = useInvalidateRestaurantSeating();
  const [taxCategoryBanner, setTaxCategoryBanner] = useState(null);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY_ID);
  const [orderType, setOrderType] = useState(DEFAULT_FULFILLMENT_TYPE);
  const [selectedRestaurantTableId, setSelectedRestaurantTableId] = useState(null);
  const [discountInput, setDiscountInput] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  // Pending approval reference returned by the backend (display only -- never applied locally).
  const [discountApproval, setDiscountApproval] = useState(null);
  // Real customer association (POS Customer Data task) -- once a draft order exists, the
  // persisted SalesOrder.CustomerId is the single source of truth (see `effectiveCustomer`
  // below); this local state only ever matters BEFORE a draft exists (no order to attach a
  // customer to yet), holding the choice until the first item creates the draft.
  const [pendingCustomer, setPendingCustomer] = useState(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  // Free-text note for the kitchen, typed from the basket. Cleared with every new/reset order.
  const [kitchenNote, setKitchenNote] = useState("");
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [refundDraft, setRefundDraft] = useState(null);
  // Set when a refund submission comes back with Outcome: "ApprovalRequired" -- holds just enough
  // to open the manager-approval dialog and load full details via GET .../approvals/{id}/refund.
  const [pendingRefundApproval, setPendingRefundApproval] = useState(null);
  // Never persisted anywhere beyond this local input state -- cleared immediately after every
  // approve attempt, success or failure.
  const [managerPin, setManagerPin] = useState("");
  const [lifecycleDraft, setLifecycleDraft] = useState(null);
  const [cashMovementDraft, setCashMovementDraft] = useState({
    type: "CashIn",
    amount: "",
    reason: "",
  });
  const [modal, setModal] = useState(null);
  const refundApprovalDetailsQuery = useSalesOrderPaymentRefundApproval(
    currentCompanyId,
    pendingRefundApproval?.approvalRequestId,
    modal === "refundApprovalPending",
  );
  // Persistent 3-phase workspace — never a route change, POSPage/AppLayout
  // never unmount. "payment" replaces the old PaymentModal as a non-modal
  // step; "complete" is the calm success state entered once payment finishes.
  const [phase, setPhase] = useState("order");
  const [retrievingOrderId, setRetrievingOrderId] = useState(null);
  const [toast, setToast] = useState("");
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);
  const [selectedModifierVariant, setSelectedModifierVariant] = useState(null);
  const [modifierSelections, setModifierSelections] = useState({});
  const [countedCashInput, setCountedCashInput] = useState("");
  const [closingNoteInput, setClosingNoteInput] = useState("");
  const [lastClosedShift, setLastClosedShift] = useState(null);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [quantityKeypadTarget, setQuantityKeypadTarget] = useState(null);
  const searchInputRef = useRef(null);
  const productGridRef = useRef(null);
  const draftOrder = draftDetailsQuery.data || null;
  const draftLines = draftOrder?.lines ?? [];
  const isConfirmedOrder = draftOrder?.status === "Confirmed";
  const isClosedOrder = draftOrder?.status === "Closed";
  const isCancelledOrder = draftOrder?.status === "Cancelled";
  const canEditDraft = !draftOrder || draftOrder.status === "Draft";
  // Narrower than canEditDraft on purpose (POS Authorization Hardening, priority 2): this gates
  // ONLY the line-item edit controls (remove/quantity, OrderLines.jsx), matching exactly what
  // backend UpdateDraftSalesOrderHandler requires (SalesOrders.EditDraft). Order-type/table
  // selection and other canEditDraft-gated actions are deliberately left alone -- they are a
  // different action surface and must not be blocked by this permission per the task's scope.
  const canEditDraftLines = canEditDraft && editDraftPermissionQuery.hasPermission;
  const effectiveOrderType = draftOrder?.fulfillmentType || orderType;
  const effectiveRestaurantTableId =
    draftOrder?.restaurantTableId ||
    (orderType === "DineIn" ? selectedRestaurantTableId : null);
  // Once a draft exists, the server-persisted customer is authoritative (never local-only state
  // -- Phase 5/13 of the POS Customer Data task). Before that, whatever the cashier picked is
  // shown from `pendingCustomer` and gets included the moment the draft is actually created.
  const effectiveCustomer = draftOrder ? (draftOrder.customer ?? null) : pendingCustomer;
  const seatingQuery = useRestaurantSeating(
    currentCompanyId,
    currentBranchId,
    orderType === "DineIn" &&
      !restaurantPermissionQuery.isLoading &&
      restaurantPermissionQuery.hasPermission,
  );
  const isDraftMutationPending =
    createDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    confirmSalesOrderMutation.isPending;
  const kitchenTickets = draftOrder?.kitchenTickets || [];
  const readyKitchenTicketCount = kitchenTickets.filter(
    (ticket) => ticket.status === "Ready",
  ).length;
  const kitchenReady =
    kitchenTickets.length === 0 || readyKitchenTicketCount === kitchenTickets.length;
  const preparationStarted = kitchenTickets.some((ticket) =>
    ["Preparing", "Ready"].includes(ticket.status),
  );
  const hasCancelledKitchenTicket = kitchenTickets.some(
    (ticket) => ticket.status === "Cancelled",
  );
  const selectedRestaurantTable = useMemo(
    () =>
      seatingQuery.data
        ?.flatMap((floor) =>
          floor.tables.map((table) => ({
            ...table,
            floorName: floor.name,
          })),
        )
        .find((table) => table.restaurantTableId === effectiveRestaurantTableId) ||
      null,
    [effectiveRestaurantTableId, seatingQuery.data],
  );
  const canConfirmOrder =
    Boolean(draftOrder) &&
    draftOrder?.status === "Draft" &&
    draftLines.length > 0 &&
    !isDraftMutationPending &&
    !confirmPermissionQuery.isLoading &&
    confirmPermissionQuery.hasPermission &&
    (orderType !== "DineIn" || Boolean(effectiveRestaurantTableId));
  const catalogItems = useMemo(
    () => sellableCatalogQuery.data?.items ?? [],
    [sellableCatalogQuery.data],
  );
  const catalogCurrencyCode = sellableCatalogQuery.data?.currencyCode || "SAR";
  const catalogCategories = useMemo(() => {
    const seen = new Map();

    catalogItems.forEach((item) => {
      const id = item.categoryId || UNCATEGORIZED_CATEGORY_ID;
      if (!seen.has(id)) {
        seen.set(id, item.categoryName || "غير مصنف");
      }
    });

    return [
      { id: ALL_CATEGORY_ID, label: "الكل", icon: Layers3 },
      ...Array.from(seen, ([id, label]) => ({ id, label, icon: Package })),
    ];
  }, [catalogItems]);
  const catalogProducts = useMemo(() => {
    const grouped = new Map();

    catalogItems.forEach((item) => {
      const existing = grouped.get(item.productId);
      const variant = {
        ...item,
        id: item.productVariantId,
        name:
          item.variantName && item.variantName !== item.productName
            ? `${item.productName} - ${item.variantName}`
            : item.productName,
        price: Number(item.unitPrice),
        sku: item.sku,
        art: item.productName.trim().slice(0, 1) || "#",
        stock: Number.MAX_SAFE_INTEGER,
        currencyCode: catalogCurrencyCode,
      };

      if (existing) {
        existing.variants.push(variant);
        existing.startingPrice = Math.min(existing.startingPrice, variant.price);
        return;
      }

      grouped.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        productDescription: item.productDescription,
        imageUrl: item.productImageUrl || null,
        categoryId: item.categoryId || UNCATEGORIZED_CATEGORY_ID,
        categoryName: item.categoryName || "غير مصنف",
        startingPrice: variant.price,
        variants: [variant],
      });
    });

    return Array.from(grouped.values());
  }, [catalogCurrencyCode, catalogItems]);

  const filteredProducts = useMemo(
    () =>
      catalogProducts.filter(
        (product) =>
          (category === ALL_CATEGORY_ID || product.categoryId === category) &&
          `${product.productName} ${product.productDescription || ""} ${product.variants
            .map((variant) => `${variant.variantName} ${variant.sku || ""}`)
            .join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [catalogProducts, category, query],
  );
  const subtotal = draftOrder?.subtotalAmount ?? 0;
  const discountValue = draftOrder?.discountAmount ?? 0;
  const vat = draftOrder?.taxAmount ?? 0;
  const total = draftOrder?.payableAmount ?? 0;
  const paymentMethods = paymentMethodsQuery.data ?? [];
  const selectedPaymentMethod =
    paymentMethods.find(
      (method) => method.paymentMethodId === selectedPaymentMethodId,
    ) ||
    paymentMethods[0] ||
    null;
  // draftOrder (GET .../sales-orders/{id}) is the single authoritative
  // source for every payment aggregate — it already carries remainingAmount/
  // netPaidAmount/refundedAmount/isFullyPaid/payments and is kept fresh on
  // every draft mutation via setQueryData. A separate GET .../payments call
  // used to be read here too, but it only fetched once (the moment a draft
  // first existed) and was never refetched as the basket changed, so it went
  // stale the instant a second item was added — that shadowed-by-`??`
  // staleness was the root cause of "Exact Amount" using an old total.
  const settlementCurrencyCode = draftOrder?.currencyCode || catalogCurrencyCode;
  const settlementMinorUnitDigits = draftOrder?.currencyMinorUnitDigits || 2;
  const remainingAmount = draftOrder?.remainingAmount ?? total;
  const netPaidAmount = draftOrder?.netPaidAmount ?? 0;
  const isFullyPaid = Boolean(draftOrder?.isFullyPaid);
  const paymentAmount = parseMoneyInput(
    paymentAmountInput,
    settlementMinorUnitDigits,
  );
  // Cash is the only method allowed to exceed the remaining balance on
  // screen — the excess is tendered/change, a display-only concept the
  // backend has no notion of. Card/manual methods keep the exact original
  // hard block: they may never be submitted above what's owed.
  const isCashSelected = selectedPaymentMethod?.kind === "Cash";
  const changeDueAmount =
    isCashSelected && paymentAmount.amount !== null && paymentAmount.amount > remainingAmount
      ? paymentAmount.amount - remainingAmount
      : 0;
  const amountToRecord =
    paymentAmount.amount !== null ? Math.min(paymentAmount.amount, remainingAmount) : null;
  // The Payment step can now be entered while the order is still Draft (see
  // goToPayment) — Confirm happens just-in-time inside receiveCurrentPayment
  // itself, so this can't require isConfirmedOrder outright or the Receive
  // action would be permanently disabled for that path. `canConfirmOrder`
  // already carries every readiness check Confirm itself needs (has lines,
  // not mid-edit, Confirm permission, DineIn table satisfied).
  const canReceivePayment =
    (isConfirmedOrder || (draftOrder?.status === "Draft" && canConfirmOrder)) &&
    !isFullyPaid &&
    remainingAmount > 0 &&
    Boolean(selectedPaymentMethod) &&
    paymentsReceivePermissionQuery.hasPermission &&
    !paymentMethodsQuery.isLoading &&
    !receivePaymentMutation.isPending &&
    !confirmSalesOrderMutation.isPending &&
    !paymentAmount.error &&
    paymentAmount.amount !== null &&
    (isCashSelected || paymentAmount.amount <= remainingAmount);
  const shouldShowPaymentPanel = isConfirmedOrder || isClosedOrder || isCancelledOrder;
  // Refund Approval Integration: gating on Payments.Refund alone would hard-disable Refund for a
  // Cashier who is meant to be able to REQUEST one (the backend decides direct-execute / approval-
  // required / denied). Payments.View is the baseline "may look at this order's payments at all"
  // capability; the backend response is what's authoritative from here, not this frontend check.
  const canRefundPayments = isConfirmedOrder && paymentsViewPermissionQuery.hasPermission;
  const closeBlockers = [];

  if (!isConfirmedOrder) {
    closeBlockers.push("Order must be Confirmed.");
  }

  if (!isFullyPaid) {
    closeBlockers.push(
      `Payment remaining ${formatMoney(
        remainingAmount,
        settlementCurrencyCode,
        settlementMinorUnitDigits,
      )}`,
    );
  }

  if (!kitchenReady) {
    closeBlockers.push(
      `Kitchen ready ${readyKitchenTicketCount}/${kitchenTickets.length}`,
    );
  }

  if (!closePermissionQuery.hasPermission) {
    closeBlockers.push("SalesOrders.Close permission is required.");
  }

  const canCloseOrder =
    isConfirmedOrder &&
    isFullyPaid &&
    kitchenReady &&
    closePermissionQuery.hasPermission &&
    !closeSalesOrderMutation.isPending;
  const canRequestCancel =
    Boolean(draftOrder) &&
    !isClosedOrder &&
    !isCancelledOrder &&
    (draftOrder.status === "Draft" || (isConfirmedOrder && !preparationStarted)) &&
    netPaidAmount === 0 &&
    cancelPermissionQuery.hasPermission &&
    !cancelSalesOrderMutation.isPending;
  const canRequestPreparedVoid =
    isConfirmedOrder &&
    preparationStarted &&
    !hasCancelledKitchenTicket &&
    netPaidAmount === 0 &&
    voidPreparedPermissionQuery.hasPermission &&
    !voidPreparedSalesOrderMutation.isPending;
  const lifecycleBlocker =
    netPaidAmount > 0
      ? "Refund the payment before cancelling this order."
      : hasCancelledKitchenTicket
        ? "Order kitchen state changed. Refresh before lifecycle action."
        : "";
  const shiftCurrencyCode = openShiftQuery.data?.currencyCode || catalogCurrencyCode;
  const shiftMinorUnitDigits =
    openShiftQuery.data?.currencyMinorUnitDigits ||
    draftOrder?.currencyMinorUnitDigits ||
    2;
  const expectedCashAmount = openShiftQuery.data?.expectedCashAmount ?? 0;
  const cashMovements = openShiftQuery.data?.cashMovements || [];
  const recentCashMovements = [...cashMovements]
    .sort((a, b) => new Date(b.createdAtUtc) - new Date(a.createdAtUtc))
    .slice(0, 6);
  const cashMovementAmount = parseMoneyInput(
    cashMovementDraft.amount,
    shiftMinorUnitDigits,
  );
  const countedCash = parseNonNegativeMoneyInput(
    countedCashInput,
    shiftMinorUnitDigits,
  );
  const variancePreview =
    countedCash.amount === null ? 0 : countedCash.amount - expectedCashAmount;
  const canCloseShift =
    hasOpenShift &&
    closeShiftPermissionQuery.hasPermission &&
    !closeShiftMutation.isPending &&
    !countedCash.error &&
    countedCash.amount !== null &&
    closingNoteInput.trim().length <= 500;
  const canSubmitCashMovement =
    hasOpenShift &&
    cashDrawerPermissionQuery.hasPermission &&
    !cashMovementMutation.isPending &&
    !cashMovementAmount.error &&
    cashMovementAmount.amount !== null &&
    cashMovementDraft.reason.trim().length > 0;
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const mapDraftLinesToRequest = (lines = draftLines) =>
    lines.map((line) => ({
      productVariantId: line.productVariantId,
      quantity: Number(line.quantity),
      modifierOptionIds: line.modifiers.map((modifier) => modifier.modifierOptionId),
    }));
  const getDraftDiscountInput = () =>
    draftOrder?.discount
      ? {
          type: draftOrder.discount.type,
          value: Number(draftOrder.discount.requestedValue),
          reason: draftOrder.discount.reason,
        }
      : null;
  const buildDraftPayload = (
    lines,
    discount = getDraftDiscountInput(),
    fulfillmentType = effectiveOrderType,
    restaurantTableId = effectiveRestaurantTableId,
    customerId = effectiveCustomer?.customerId ?? null,
  ) => ({
    fulfillmentType,
    restaurantTableId: fulfillmentType === "DineIn" ? restaurantTableId : null,
    customerId,
    lines,
    discount,
  });
  // The create-draft response only echoes back `customerId` (no name/phone -- see
  // CreateDraftSalesOrderResponse), so a customer chosen before the draft existed is patched
  // into the freshly-cached draft here rather than waiting for a follow-up GET to show it.
  const finalizeCreatedDraft = (created) => {
    setDraftSession({ scope: draftScope, salesOrderId: created.salesOrderId });
    if (pendingCustomer) {
      queryClient.setQueryData(
        draftSalesOrderQueryKeys.details(currentCompanyId, currentBranchId, created.salesOrderId),
        (old) => (old ? { ...old, customerId: pendingCustomer.customerId, customer: pendingCustomer } : old),
      );
      setPendingCustomer(null);
    }
  };
  // Selecting/clearing a customer always writes through to the real SalesOrder (Phase 5/6/7 of
  // the POS Customer Data task) -- never local-only state. Before a draft exists there is nothing
  // to persist to yet, so the choice is remembered in `pendingCustomer` and sent the moment the
  // first item creates the draft (see buildDraftPayload's customerId default).
  const assignCustomerToOrder = async (nextCustomer) => {
    if (!draftOrder) {
      setPendingCustomer(nextCustomer);
      return;
    }

    if (!canEditDraft) {
      notify("Only a draft order's customer can be changed.");
      return;
    }

    await updateDraftMutation.mutateAsync({
      ...buildDraftPayload(
        mapDraftLinesToRequest(),
        getDraftDiscountInput(),
        undefined,
        undefined,
        nextCustomer?.customerId ?? null,
      ),
      expectedDraftVersion: draftOrder.draftVersion,
    });

    queryClient.setQueryData(
      draftSalesOrderQueryKeys.details(currentCompanyId, currentBranchId, draftOrder.salesOrderId),
      (old) =>
        old ? { ...old, customerId: nextCustomer?.customerId ?? null, customer: nextCustomer ?? null } : old,
    );
  };
  const handleDraftError = (error, lines) => {
    if (error?.code === "SalesOrder.DraftVersionConflict") {
      draftDetailsQuery.refetch();
      notify("Sales order changed. Cart was refreshed.");
      return;
    }

    if (error?.code === "Tax.CompanySettingsNotConfigured") {
      taxSettingsQuery.refetch();
      notify("Tax settings must be configured before selling. Complete tax setup.");
      return;
    }

    if (error?.code === "Tax.ProductTaxCategoryNotConfigured") {
      const names = Array.from(
        new Set(
          (lines || [])
            .map(
              (line) =>
                catalogItems.find((item) => item.productVariantId === line.productVariantId)
                  ?.productName,
            )
            .filter(Boolean),
        ),
      );
      setTaxCategoryBanner(names.length ? names : ["This product"]);
      notify("This product needs a tax category before it can be sold.");
      return;
    }

    notify(error?.message || "Unable to update draft order.");
  };
  const replaceDraftLines = async (lines, discount = getDraftDiscountInput()) => {
    if (!canEditDraft || !currentCompanyId || !currentBranchId || !lines.length) {
      return;
    }

    if (orderType === "DineIn" && !effectiveRestaurantTableId) {
      notify("Select a table before adding dine-in items.");
      return;
    }

    try {
      if (!draftOrder) {
        const created = await createDraftMutation.mutateAsync(
          buildDraftPayload(lines, discount),
        );
        finalizeCreatedDraft(created);
        return;
      }

      await updateDraftMutation.mutateAsync({
        ...buildDraftPayload(lines, discount),
        expectedDraftVersion: draftOrder.draftVersion,
      });
    } catch (error) {
      handleDraftError(error, lines);
    }
  };
  const commitDraftLines = async (requestLines, baseDraft) => {
    if (!currentCompanyId || !currentBranchId) return null;

    if (orderType === "DineIn" && !effectiveRestaurantTableId) {
      notify("Select a table before adding dine-in items.");
      return null;
    }

    // A discount can never apply to a $0 order — the backend correctly
    // rejects that (`SalesOrder.DiscountNotApplicable`). Committing to zero
    // lines is now a normal, allowed state (see useDraftLineEditor), so
    // drop any carried-forward discount for that specific case rather than
    // let a stale discount block the empty-basket commit itself.
    const payload = buildDraftPayload(
      requestLines,
      requestLines.length ? getDraftDiscountInput() : null,
    );

    if (!baseDraft) {
      const created = await createDraftMutation.mutateAsync(payload);
      finalizeCreatedDraft(created);
      return created;
    }

    return await updateDraftMutation.mutateAsync({
      ...payload,
      expectedDraftVersion: baseDraft.draftVersion,
    });
  };
  const refetchDraftForLineEditor = async () => {
    const result = await draftDetailsQuery.refetch();
    return result.data ?? null;
  };
  const lineEditor = useDraftLineEditor({
    draftOrder,
    canEditDraft,
    mapDraftLinesToRequest,
    commitDraftLines,
    refetchDraft: refetchDraftForLineEditor,
    onCommitError: handleDraftError,
  });
  const displayDraftLines = lineEditor.getDisplayLines();
  // Selected-line is pure UI state for keyboard cart navigation — never the
  // backend order state. Rather than reconciling stale ids via an effect,
  // it's derived fresh every render: if the line it points at is gone
  // (removed, order changed, new order started), it simply reads as
  // unselected until the cashier picks a line again.
  const effectiveSelectedLineId = displayDraftLines.some(
    (line) => line.salesOrderLineId === selectedLineId,
  )
    ? selectedLineId
    : null;
  const updateDraftContext = async (nextOrderType, nextRestaurantTableId) => {
    if (!draftOrder || !draftLines.length || !canEditDraft) return;

    if (nextOrderType === "DineIn" && !nextRestaurantTableId) {
      notify("Select a table to switch this draft to dine-in.");
      return;
    }

    try {
      await updateDraftMutation.mutateAsync({
        ...buildDraftPayload(
          mapDraftLinesToRequest(),
          getDraftDiscountInput(),
          nextOrderType,
          nextOrderType === "DineIn" ? nextRestaurantTableId : null,
        ),
        expectedDraftVersion: draftOrder.draftVersion,
      });
    } catch (error) {
      handleDraftError(error);
    }
  };
  const handleOrderTypeChange = (nextOrderType) => {
    if (!canEditDraft || nextOrderType === orderType) return;

    setOrderType(nextOrderType);

    if (nextOrderType !== "DineIn") {
      setSelectedRestaurantTableId(null);
      updateDraftContext(nextOrderType, null);
      return;
    }

    updateDraftContext(nextOrderType, selectedRestaurantTableId);
  };
  const handleTableSelect = (table) => {
    if (!canEditDraft || table.isOccupied) return;

    setOrderType("DineIn");
    setSelectedRestaurantTableId(table.restaurantTableId);
    updateDraftContext("DineIn", table.restaurantTableId);
  };
  const confirmCurrentOrder = async () => {
    if (!draftSalesOrderId || !draftOrder || !draftLines.length) return;

    if (lineEditor.hasPendingEdits()) {
      notify("Finish updating the cart before confirming.");
      return;
    }

    if (!confirmPermissionQuery.hasPermission) {
      notify("SalesOrders.Confirm permission is required.");
      return;
    }

    if (orderType === "DineIn" && !effectiveRestaurantTableId) {
      notify("Select a table before confirming dine-in order.");
      return;
    }

    try {
      await confirmSalesOrderMutation.mutateAsync();
      setSelectedVariantProduct(null);
      setSelectedModifierVariant(null);
      setModifierSelections({});
      await draftDetailsQuery.refetch();
      invalidateRestaurantSeating(currentCompanyId, currentBranchId);
      notify("Sales order confirmed.");
    } catch (error) {
      if (
        error?.code === "SalesOrder.DraftVersionConflict" ||
        error?.code === "SalesOrder.NotReadyForConfirmation"
      ) {
        draftDetailsQuery.refetch();
        notify("Order changed. Review the latest server state before confirming.");
        return;
      }

      handleDraftError(error);
    }
  };
  // Draft + non-DineIn: the primary action moves straight to the Payment
  // step without confirming anything yet — a pure local phase change, no
  // request. Draft + DineIn keeps using confirmCurrentOrder directly instead
  // (see OrderPrimaryAction/getOrderPrimaryAction): that flow deliberately
  // confirms now and pays later ("Pay Later — continue service" is a real,
  // separate action), so it must not be folded into this deferred-confirm
  // path. Confirm itself happens just-in-time inside receiveCurrentPayment.
  const goToPayment = () => {
    if (!canConfirmOrder) return;

    if (lineEditor.hasPendingEdits()) {
      notify("Finish updating the cart before proceeding to payment.");
      return;
    }

    setPhase("payment");
  };
  const refreshPaymentState = () => {
    draftDetailsQuery.refetch();
    openShiftQuery.refetch();
  };
  const handlePaymentError = (error) => {
    const staleCodes = [
      "Payment.SalesOrderNotSettlementReady",
      "Payment.AlreadyFullyPaid",
      "Payment.AmountExceedsRemaining",
      "PaymentRefund.SalesOrderNotRefundable",
      "PaymentRefund.AlreadyFullyRefunded",
      "PaymentRefund.AmountExceedsRefundable",
      "SalesOrderPayment.NotAvailable",
      "PosShift.NotOpen",
      "PosShift.InsufficientExpectedCash",
      "SalesOrder.NotClosable",
      "SalesOrder.PaymentIncomplete",
      "SalesOrder.KitchenIncomplete",
      "SalesOrder.NotAvailable",
    ];

    if (staleCodes.includes(error?.code)) {
      refreshPaymentState();
    }

    notify(error?.message || "Payment request failed.");
  };
  const handleCloseError = (error) => {
    const staleCodes = [
      "SalesOrder.NotClosable",
      "SalesOrder.PaymentIncomplete",
      "SalesOrder.KitchenIncomplete",
      "SalesOrder.NotAvailable",
    ];

    if (staleCodes.includes(error?.code)) {
      refreshPaymentState();
      invalidateRestaurantSeating(currentCompanyId, currentBranchId);
    }

    notify(error?.message || "Unable to close sales order.");
  };
  const handleLifecycleError = (error) => {
    const staleCodes = [
      "SalesOrder.NotAvailable",
      "SalesOrder.NotCancellable",
      "SalesOrder.NotVoidable",
      "SalesOrder.RefundRequired",
      "SalesOrder.PreparationAlreadyStarted",
      "SalesOrder.PreparationNotStarted",
      "SalesOrder.CancellationStateInconsistent",
      "SalesOrder.VoidStateInconsistent",
      "SalesOrder.InvalidSettlementState",
    ];

    if (staleCodes.includes(error?.code)) {
      refreshPaymentState();
      invalidateRestaurantSeating(currentCompanyId, currentBranchId);
    }

    notify(error?.message || "Unable to update sales order lifecycle.");
  };
  const closeCurrentOrder = async () => {
    if (!draftSalesOrderId || !draftOrder) return;

    if (!closePermissionQuery.hasPermission) {
      notify("SalesOrders.Close permission is required.");
      return;
    }

    try {
      await closeSalesOrderMutation.mutateAsync();
      setModal(null);
      await draftDetailsQuery.refetch();
      await openShiftQuery.refetch();
      invalidateRestaurantSeating(currentCompanyId, currentBranchId);
      notify("Sales order closed.");
    } catch (error) {
      handleCloseError(error);
    }
  };
  const openLifecycleModal = (action) => {
    setLifecycleDraft({ action, reason: "" });
    setModal(action === "preparedVoid" ? "preparedVoidOrder" : "cancelOrder");
  };
  const runLifecycleAction = async () => {
    if (!lifecycleDraft || !draftSalesOrderId) return;

    const reason = lifecycleDraft.reason.trim();
    if (!reason) {
      notify("Cancellation reason is required.");
      return;
    }

    try {
      if (lifecycleDraft.action === "preparedVoid") {
        await voidPreparedSalesOrderMutation.mutateAsync({ reason });
        notify("Prepared order voided.");
      } else {
        await cancelSalesOrderMutation.mutateAsync({ reason });
        notify("Sales order cancelled.");
      }

      setLifecycleDraft(null);
      setModal(null);
      await draftDetailsQuery.refetch();
      invalidateRestaurantSeating(currentCompanyId, currentBranchId);
    } catch (error) {
      handleLifecycleError(error);
    }
  };
  const handleCashMovementError = (error) => {
    const staleCodes = [
      "PosShift.NotAvailable",
      "PosShift.NotOpen",
      "PosShift.InsufficientExpectedCash",
      "PosCashMovement.InvalidType",
      "PosCashMovement.InvalidAmount",
      "PosCashMovement.AmountPrecisionInvalid",
      "PosCashMovement.InvalidInput",
      "PosCashMovement.IdempotencyKeyConflict",
    ];

    if (staleCodes.includes(error?.code)) {
      openShiftQuery.refetch();
    }

    notify(error?.message || "Unable to create cash movement.");
  };
  const submitCashMovement = async () => {
    if (!openShiftId) {
      notify("Open POS shift is required.");
      return;
    }

    if (!cashDrawerPermissionQuery.hasPermission) {
      notify("Pos.AdjustCashDrawer permission is required.");
      return;
    }

    if (cashMovementAmount.error || cashMovementAmount.amount === null) {
      notify(cashMovementAmount.error || "Enter a valid cash movement amount.");
      return;
    }

    if (!cashMovementDraft.reason.trim()) {
      notify("Cash movement reason is required.");
      return;
    }

    try {
      await cashMovementMutation.mutateAsync({
        type: cashMovementDraft.type,
        amount: cashMovementAmount.amount,
        reason: cashMovementDraft.reason,
      });
      setCashMovementDraft({
        type: cashMovementDraft.type,
        amount: "",
        reason: "",
      });
      await openShiftQuery.refetch();
      notify(`${getCashMovementLabel(cashMovementDraft.type)} recorded.`);
    } catch (error) {
      handleCashMovementError(error);
    }
  };
  const handleCloseShiftError = (error) => {
    const staleCodes = [
      "PosShift.NotAvailable",
      "PosShift.AlreadyClosed",
      "PosShift.InvalidCountedCash",
      "PosShift.CountedCashPrecisionInvalid",
      "PosShift.InvalidInput",
    ];

    if (staleCodes.includes(error?.code)) {
      openShiftQuery.refetch();
    }

    notify(error?.message || "Unable to close POS shift.");
  };
  const closeCurrentShift = async () => {
    if (!openShiftId) {
      notify("Open POS shift is required.");
      return;
    }

    if (!closeShiftPermissionQuery.hasPermission) {
      notify("Pos.CloseShift permission is required.");
      return;
    }

    if (countedCash.error || countedCash.amount === null) {
      notify(countedCash.error || "Enter counted cash.");
      return;
    }

    if (closingNoteInput.trim().length > 500) {
      notify("Closing note must be 500 characters or fewer.");
      return;
    }

    try {
      const result = await closeShiftMutation.mutateAsync({
        countedCashAmount: countedCash.amount,
        closingNote: closingNoteInput.trim() || null,
      });
      setLastClosedShift(result);
      setCountedCashInput("");
      setClosingNoteInput("");
      setCashMovementDraft({ type: "CashIn", amount: "", reason: "" });
      startNewOrder();
      await openShiftQuery.refetch();
      notify("POS shift closed.");
    } catch (error) {
      handleCloseShiftError(error);
    }
  };
  const receiveCurrentPayment = async () => {
    if (!selectedPaymentMethod || !draftSalesOrderId || !draftOrder) return;

    if (!paymentsReceivePermissionQuery.hasPermission) {
      notify("Payments.Receive permission is required.");
      return;
    }

    if (paymentAmount.error || paymentAmount.amount === null) {
      notify(paymentAmount.error || "Enter a valid payment amount.");
      return;
    }

    if (!isCashSelected && paymentAmount.amount > remainingAmount) {
      notify("Payment amount exceeds the remaining balance.");
      return;
    }

    // Entering the Payment step no longer confirms the order (see
    // goToPayment) — this is the just-in-time Confirm, fired only when the
    // cashier actually completes payment. Idempotent server-side
    // (ConfirmSalesOrderHandler no-ops on an already-Confirmed order), so a
    // retry of this whole action can't double-confirm; the payment call
    // right after keeps its own existing idempotency-key protection.
    // Pricing/tax/discount are unaffected by Confirm, so the total/remaining
    // already computed for this render stay correct — no re-derivation
    // needed after this resolves.
    if (draftOrder.status === "Draft") {
      if (lineEditor.hasPendingEdits()) {
        notify("Finish updating the cart before completing payment.");
        return;
      }

      try {
        await confirmSalesOrderMutation.mutateAsync();
        await draftDetailsQuery.refetch();
        invalidateRestaurantSeating(currentCompanyId, currentBranchId);
      } catch (error) {
        if (
          error?.code === "SalesOrder.DraftVersionConflict" ||
          error?.code === "SalesOrder.NotReadyForConfirmation"
        ) {
          draftDetailsQuery.refetch();
          notify("Order changed. Review the latest server state before completing payment.");
          return;
        }

        handleDraftError(error);
        return;
      }
    }

    try {
      const result = await receivePaymentMutation.mutateAsync({
        paymentMethodId: selectedPaymentMethod.paymentMethodId,
        amount: amountToRecord,
        posShiftId: openShiftId,
      });
      setPaymentAmountInput("");
      notify("Payment received.");
      refreshPaymentState();
      // Mirrors the old PaymentModal's isFullyPaid branch, just promoted to
      // a real phase — driven by the mutation's own authoritative response
      // rather than a reactive effect on derived state.
      if (result.isFullyPaid) {
        setPhase("complete");
      }
    } catch (error) {
      handlePaymentError(error);
    }
  };
  const openRefundModal = (payment) => {
    setRefundDraft({
      payment,
      amount: String(payment.refundableAmount || ""),
      reason: "",
      confirmation: false,
    });
    setModal("refundPayment");
  };
  const refundCurrentPayment = async () => {
    if (!refundDraft?.payment || !draftSalesOrderId) return;

    // Payments.Refund is intentionally NOT checked here anymore (Refund Approval Integration):
    // a Cashier without it may still legitimately REQUEST a refund, and the backend -- never this
    // frontend check -- decides whether that means direct execution, approval-required, or denied.
    if (!refundDraft.confirmation) {
      notify("Confirm the refund before processing.");
      return;
    }

    const refundAmount = parseMoneyInput(
      refundDraft.amount,
      refundDraft.payment.currencyMinorUnitDigits,
    );

    if (refundAmount.error || refundAmount.amount === null) {
      notify(refundAmount.error || "Enter a valid refund amount.");
      return;
    }

    if (refundAmount.amount > refundDraft.payment.refundableAmount) {
      notify("Refund amount exceeds the refundable amount.");
      return;
    }

    if (!refundDraft.reason.trim()) {
      notify("Refund reason is required.");
      return;
    }

    try {
      const result = await refundPaymentMutation.mutateAsync({
        salesOrderPaymentId: refundDraft.payment.salesOrderPaymentId,
        payload: {
          amount: refundAmount.amount,
          posShiftId: openShiftId,
          reason: refundDraft.reason,
        },
      });

      setRefundDraft(null);

      if (result.outcome === "ApprovalRequired") {
        // Never pretend this succeeded and never mark anything refunded locally -- nothing has
        // happened to the payment yet. Open the manager-approval dialog with what we already know;
        // it loads the authoritative details itself via GET .../approvals/{id}/refund.
        setPendingRefundApproval({
          approvalRequestId: result.approval.approvalRequestId,
          status: result.approval.status,
          expiresAtUtc: result.approval.expiresAtUtc,
          amount: result.approval.amount,
          currencyCode: result.approval.currencyCode,
        });
        setModal("refundApprovalPending");
        notify(
          t("pos.refundApproval.requestCreated", {
            id: result.approval.approvalRequestId.slice(-8),
          }),
        );
        refreshPaymentState();
        return;
      }

      setModal(null);
      notify("Refund processed.");
      refreshPaymentState();
    } catch (error) {
      handlePaymentError(error);
    }
  };
  const approveRefundRequest = async () => {
    if (!pendingRefundApproval?.approvalRequestId) return;

    if (!managerPin.trim()) {
      notify(t("pos.refundApproval.errors.pinRequired"));
      return;
    }

    try {
      await approveRefundMutation.mutateAsync({
        approvalRequestId: pendingRefundApproval.approvalRequestId,
        pin: managerPin,
      });
      setManagerPin("");
      setPendingRefundApproval(null);
      setModal(null);
      notify(t("pos.refundApproval.approvedMessage"));
      refreshPaymentState();
    } catch (error) {
      // Never leave a PIN attempt sitting in the input after a failed try.
      setManagerPin("");
      handleRefundApprovalError(error);
    }
  };
  const handleRefundApprovalError = (error) => {
    const messageByCode = {
      "ManagerPin.Invalid": t("pos.refundApproval.errors.invalidPin"),
      "ManagerPin.Locked": t("pos.refundApproval.errors.pinLocked"),
      "ManagerPin.NotSet": t("pos.refundApproval.errors.pinNotSet"),
      "ManagerPin.Required": t("pos.refundApproval.errors.pinRequired"),
      "Branch.NotAccessible": t("pos.refundApproval.errors.branchNotAccessible"),
      "Authorization.PermissionDenied": t("pos.refundApproval.errors.permissionDenied"),
      "Entitlement.NotEnabled": t("pos.refundApproval.errors.entitlementNotEnabled"),
      "Approval.SelfApprovalNotAllowed": t("pos.refundApproval.errors.selfApproval"),
      "Approval.Expired": t("pos.refundApproval.errors.expired"),
      "Approval.NotPending": t("pos.refundApproval.errors.notPending"),
      "Approval.NotAvailable": t("pos.refundApproval.errors.notAvailable"),
      "Approval.RefundSnapshotMissing": t("pos.refundApproval.errors.notAvailable"),
      "PaymentRefund.AmountExceedsRefundable": t("pos.refundApproval.errors.staleAmount"),
      "PaymentRefund.AlreadyFullyRefunded": t("pos.refundApproval.errors.staleAmount"),
      "PaymentRefund.SalesOrderNotRefundable": t("pos.refundApproval.errors.staleAmount"),
      "PosShift.InsufficientExpectedCash": t("pos.refundApproval.errors.cashValidationFailed"),
      "PosShift.NotOpen": t("pos.refundApproval.errors.cashValidationFailed"),
      "PosShift.CurrencyMismatch": t("pos.refundApproval.errors.cashValidationFailed"),
      "PosShift.RequiredForCashRefund": t("pos.refundApproval.errors.cashValidationFailed"),
      "PosShift.NotAvailable": t("pos.refundApproval.errors.cashValidationFailed"),
    };

    notify(messageByCode[error?.code] || error?.message || t("pos.refundApproval.errors.generic"));

    // A stale/terminal request state -- refresh both the payment/order state and the approval
    // details shown in the dialog so the cashier/manager see what's actually true now, rather than
    // silently retrying against data that's already wrong.
    const staleCodes = [
      "Approval.Expired",
      "Approval.NotPending",
      "Approval.NotAvailable",
      "PaymentRefund.AmountExceedsRefundable",
      "PaymentRefund.AlreadyFullyRefunded",
      "PaymentRefund.SalesOrderNotRefundable",
    ];
    if (staleCodes.includes(error?.code)) {
      refreshPaymentState();
      refundApprovalDetailsQuery.refetch();
    }
  };
  const startNewOrder = () => {
    setDraftSession({ scope: "", salesOrderId: null });
    setOrderType(DEFAULT_FULFILLMENT_TYPE);
    setSelectedRestaurantTableId(null);
    setDiscountInput("");
    setDiscountReason("");
    setDiscountApproval(null);
    setPaymentAmountInput("");
    setSelectedPaymentMethodId("");
    setKitchenNote("");
    setRefundDraft(null);
    setLifecycleDraft(null);
    setPendingCustomer(null);
    setSelectedVariantProduct(null);
    setSelectedModifierVariant(null);
    setModifierSelections({});
    setModal(null);
    setSelectedLineId(null);
    setPhase("order");
  };

  // Retrieval only ever switches which order the POS session is pointed at —
  // it never mutates, clones, or reopens the order being left behind. If the
  // cashier is mid-way through building a real (non-empty) Draft, confirm
  // first so it's never silently abandoned; anything else (nothing active
  // yet, or a Confirmed order that already persisted its own state) is safe
  // to switch away from without asking.
  const retrieveOrder = async (selectedOrderId) => {
    if (retrievingOrderId || !currentCompanyId || !currentBranchId) return;

    if (!salesOrdersViewPermissionQuery.hasPermission) {
      notify("SalesOrders.View permission is required.");
      return;
    }

    const hasMeaningfulDraft =
      draftOrder && draftOrder.status === "Draft" && draftLines.length > 0;

    if (hasMeaningfulDraft) {
      const confirmed = window.confirm(
        "Open another order? Your current draft will remain saved and can be retrieved again.",
      );
      if (!confirmed) return;
    }

    setRetrievingOrderId(selectedOrderId);

    try {
      const details = await getSalesOrderDetails(
        currentCompanyId,
        currentBranchId,
        selectedOrderId,
      );

      queryClient.setQueryData(
        draftSalesOrderQueryKeys.details(currentCompanyId, currentBranchId, selectedOrderId),
        details,
      );

      setDraftSession({ scope: draftScope, salesOrderId: selectedOrderId });
      setOrderType(details.fulfillmentType || DEFAULT_FULFILLMENT_TYPE);
      setSelectedRestaurantTableId(details.restaurantTableId || null);
      setDiscountInput("");
      setDiscountReason("");
      setDiscountApproval(null);
      setPaymentAmountInput("");
      setSelectedPaymentMethodId("");
      setKitchenNote("");
      setRefundDraft(null);
      setLifecycleDraft(null);
      setPendingCustomer(null);
      setSelectedVariantProduct(null);
      setSelectedModifierVariant(null);
      setModifierSelections({});
      setSelectedLineId(null);
      setModal(null);
      setPhase("order");
      notify(`Order opened — ${details.status}.`);

      // Product Grid is the natural workspace for a Draft. A Confirmed order
      // has no editable grid items to land on (every card is disabled), so
      // fall back to the search field — always present and interactive —
      // rather than leaving focus on <body> or fighting PosModal's own
      // restore-to-opener behavior by doing nothing.
      window.requestAnimationFrame(() => {
        const gridItems = getFocusableGridItems(productGridRef.current, ROVING_ITEM_SELECTOR);
        if (gridItems.length) {
          gridItems[0].focus();
        } else {
          searchInputRef.current?.focus();
        }
      });
    } catch (error) {
      notify(error?.message || "Unable to open order.");
    } finally {
      setRetrievingOrderId(null);
    }
  };

  const addSellableVariant = async (variant, modifierOptionIds = []) => {
    if (!canEditDraft) return;

    setSelectedVariantProduct(null);
    setSelectedModifierVariant(null);
    setModifierSelections({});
    setModal(null);
    const modifierKey = modifierOptionIds.slice().sort().join("|");

    // Routed through lineEditor's own serialized queue (shared with
    // quantity/remove commits) instead of firing straight away: with the
    // product grid no longer disabled while a mutation is in flight, two
    // rapid taps could otherwise both build their request from the same
    // stale draft version and race — the second one always losing its line
    // to a version conflict. The queue guarantees each add is built from
    // whatever the previous commit actually resolved to.
    await lineEditor.enqueue((latestDraft) => {
      const requestLines = mapDraftLinesToRequest(latestDraft?.lines ?? []);
      const existing = requestLines.find(
        (line) =>
          line.productVariantId === variant.productVariantId &&
          line.modifierOptionIds.slice().sort().join("|") === modifierKey,
      );

      if (existing) {
        existing.quantity = Number(existing.quantity) + 1;
      } else {
        requestLines.push({
          productVariantId: variant.productVariantId,
          quantity: 1,
          modifierOptionIds,
        });
      }

      return requestLines;
    });

    // Every add-to-draft path (immediate add, variant-only, variant+
    // modifiers) funnels through here. When a Variant/Modifier dialog was
    // involved, its focused option is now gone and focus is left sitting on
    // <body> with no obvious way back in without the mouse — recover into
    // the Product Grid. When nothing was involved (single variant, no
    // modifiers: the product card itself never lost focus), leave it alone
    // rather than yanking focus to the first card regardless of which one
    // was actually clicked.
    const items = getFocusableGridItems(productGridRef.current, ROVING_ITEM_SELECTOR);
    if (!items.includes(document.activeElement)) {
      items[0]?.focus();
    }
  };
  const handleBarcodeScan = async (scan) => {
    if (!canEditDraft || !currentCompanyId || !currentBranchId) return;

    try {
      const { item } = await resolveBarcodeMutation.mutateAsync(scan.value);
      // Resolved directly to the same shape the product grid renders -- add one unit straight
      // to the basket (Section C), skipping the modifier-selection dialog selectVariantForDraft
      // would open for a manual click: a scan is a single unambiguous action, not the start of a
      // guided picker flow.
      await addSellableVariant(item, []);
    } catch (error) {
      if (error?.code === "Catalog.ProductVariantNotSellable") {
        notify(error.message || "This product is not currently available for sale.");
      } else if (error?.code === "Catalog.BarcodeNotFound") {
        notify(`No product found for "${scan.value}".`);
      } else {
        notify(error?.message || "Unable to resolve scanned barcode.");
      }
    }
  };

  useKeyboardWedgeScanner({
    enabled: canEditDraft && !modal,
    onScan: handleBarcodeScan,
  });

  const selectVariantForDraft = (variant) => {
    if (!canEditDraft) return;

    if (variant.modifierGroups?.length) {
      setSelectedModifierVariant(variant);
      setModifierSelections({});
      setModal("modifiers");
      return;
    }

    addSellableVariant(variant);
  };
  const addItem = (product) => {
    if (!canEditDraft) return;

    if (product.variants.length === 1) {
      selectVariantForDraft(product.variants[0]);
      return;
    }

    setSelectedVariantProduct(product);
    setModal("variant");
  };
  const changeQty = (salesOrderLineId, amount) => {
    lineEditor.changeQuantity(salesOrderLineId, amount);
  };
  const removeDraftLine = (salesOrderLineId) => {
    lineEditor.removeLine(salesOrderLineId);
  };
  const submitDiscountRequest = async (value) => {
    if (requestDiscountMutation.isPending) return;

    const reason = discountReason.trim();
    if (!reason) {
      notify(t("pos.discount.invalidReason"));
      return;
    }

    try {
      // Only { discountType, value, reason } is sent -- never lines/customer/table/amounts.
      const result = await requestDiscountMutation.mutateAsync({
        discountType: "Percentage",
        value,
        reason,
      });

      setDiscountReason("");

      if (result.outcome === "ApprovalRequired" && result.approval) {
        // Not applied: the draft is refetched by the mutation hook, so totals stay server-truth.
        setDiscountApproval({ salesOrderId: draftOrder.salesOrderId, ...result.approval });
        return;
      }

      setDiscountApproval(null);
      notify(t("pos.discount.appliedMessage"));
      setModal(null);
    } catch (error) {
      const key = DISCOUNT_ERROR_KEYS[error?.code];
      notify(key ? t(key) : error?.message || t("pos.discount.errors.generic"));
    }
  };
  const applyDraftDiscount = () => {
    if (!canEditDraft) return;

    if (!draftOrder || !draftLines.length) {
      notify("Create a draft before applying a discount.");
      return;
    }

    const value = Number(discountInput);
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      notify("Enter a percentage discount between 1 and 100.");
      return;
    }

    // Users WITHOUT SalesOrders.ApplyDiscount go through the narrow discount endpoint instead of
    // sending an unauthorized full-draft update. The backend stays authoritative on the outcome.
    if (!discountPermissionQuery.hasPermission) {
      submitDiscountRequest(value);
      return;
    }

    replaceDraftLines(mapDraftLinesToRequest(), {
      type: "Percentage",
      value,
      reason: "POS manual discount",
    });
    setModal(null);
  };
  const toggleModifierOption = (group, optionId) => {
    setModifierSelections((current) => {
      const selected = current[group.modifierGroupId] || [];
      const exists = selected.includes(optionId);
      const next = exists
        ? selected.filter((id) => id !== optionId)
        : group.maxSelections === 1
          ? [optionId]
          : [...selected, optionId].slice(0, group.maxSelections);

      return { ...current, [group.modifierGroupId]: next };
    });
  };
  const selectedModifierOptionIds = selectedModifierVariant
    ? selectedModifierVariant.modifierGroups.flatMap(
        (group) => modifierSelections[group.modifierGroupId] || [],
      )
    : [];
  const modifierSelectionIsValid =
    !selectedModifierVariant ||
    selectedModifierVariant.modifierGroups.every((group) => {
      const count = (modifierSelections[group.modifierGroupId] || []).length;
      return count >= group.minSelections && count <= group.maxSelections;
    });

  const selectAdjacentLine = (delta) => {
    if (!displayDraftLines.length) return;

    const currentIndex = displayDraftLines.findIndex(
      (line) => line.salesOrderLineId === effectiveSelectedLineId,
    );
    const nextIndex =
      currentIndex < 0
        ? delta > 0
          ? 0
          : displayDraftLines.length - 1
        : Math.max(0, Math.min(displayDraftLines.length - 1, currentIndex + delta));

    setSelectedLineId(displayDraftLines[nextIndex].salesOrderLineId);
  };

  // Keeps every shortcut closure pointing at the latest render's values
  // without the bindings array itself needing to change identity (and the
  // scope re-registering) on every render. Written from a layout effect
  // (fires before paint, so it's populated before any keypress is possible)
  // rather than during render, since React (and this repo's stricter refs
  // lint rule) treats writing a ref's .current mid-render as unsafe even
  // though it doesn't trigger reactivity. `setModal` is only stored here for
  // later use inside onTrigger closures, never called from the effect body
  // itself, so this can't cascade into a render loop.
  const pageShortcutStateRef = useRef(null);
  useLayoutEffect(() => {
    pageShortcutStateRef.current = {
      startNewOrder,
      handleOrderTypeChange,
      goToPayment,
      changeQty,
      removeDraftLine,
      selectAdjacentLine,
      setModal,
      setPhase,
      isClosedOrder,
      isCancelledOrder,
      isConfirmedOrder,
      isFullyPaid,
      kitchenReady,
      canCloseOrder,
      canConfirmOrder,
      hasOpenShift,
      effectiveSelectedLineId,
      canEditDraft,
    };
  });

  // POS Page scope — a normal cashier flow keyboard-first. Registered once
  // (stable empty deps): every onTrigger reads pageShortcutStateRef.current
  // for its live values instead of closing over them directly, so nothing
  // reactive is referenced in this useMemo body at all and it never has a
  // stale-dependency warning to produce. Suppressed entirely whenever a
  // Modal scope is active (PosModal registers its own Escape binding;
  // PaymentModal/modifier dialog register their own extra bindings on top
  // of that), so none of these can fire out from under an open dialog. See
  // ShortcutProvider's dispatcher for the scope-priority mechanics.
  const posPageBindings = useMemo(
    () => [
      { binding: { code: "F2" }, onTrigger: () => pageShortcutStateRef.current.startNewOrder() },
      {
        binding: { code: "F3" },
        onTrigger: () => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        },
      },
      {
        binding: { code: "F1" },
        onTrigger: () => {
          const items = getFocusableGridItems(productGridRef.current, ROVING_ITEM_SELECTOR);
          if (!items.length) return;
          // Land back on whatever's already focused if it's still a valid
          // visible product (e.g. cashier tabbed away and came back);
          // otherwise start at the first one.
          const current = items.includes(document.activeElement) ? document.activeElement : items[0];
          current.focus();
        },
      },
      {
        binding: { code: "F4" },
        onTrigger: () => pageShortcutStateRef.current.handleOrderTypeChange("Takeaway"),
      },
      {
        binding: { code: "F4", shiftKey: true },
        onTrigger: () => pageShortcutStateRef.current.handleOrderTypeChange("DineIn"),
      },
      {
        binding: { code: "F6" },
        onTrigger: () => pageShortcutStateRef.current.setModal("retrieve"),
      },
      {
        binding: { code: "F8" },
        onTrigger: () => {
          const state = pageShortcutStateRef.current;
          const primaryAction = getOrderPrimaryAction({
            isClosedOrder: state.isClosedOrder,
            isCancelledOrder: state.isCancelledOrder,
            isConfirmedOrder: state.isConfirmedOrder,
            isFullyPaid: state.isFullyPaid,
            kitchenReady: state.kitchenReady,
            canCloseOrder: state.canCloseOrder,
            canConfirmOrder: state.canConfirmOrder,
            hasOpenShift: state.hasOpenShift,
            startNewOrder: state.startNewOrder,
            onOpenPayment: () => state.setPhase("payment"),
            onOpenCloseOrder: () => state.setModal("closeOrder"),
            goToPayment: state.goToPayment,
          });
          if (!primaryAction.disabled) primaryAction.run();
        },
      },
      {
        binding: { code: "F9" },
        onTrigger: () => {
          const state = pageShortcutStateRef.current;
          if (state.isConfirmedOrder && !state.isFullyPaid) state.setPhase("payment");
        },
      },
      {
        binding: { code: "Equal", shiftKey: true },
        onTrigger: () => {
          const state = pageShortcutStateRef.current;
          if (state.effectiveSelectedLineId && state.canEditDraft) {
            state.changeQty(state.effectiveSelectedLineId, 1);
          }
        },
      },
      {
        binding: { code: "NumpadAdd" },
        onTrigger: () => {
          const state = pageShortcutStateRef.current;
          if (state.effectiveSelectedLineId && state.canEditDraft) {
            state.changeQty(state.effectiveSelectedLineId, 1);
          }
        },
      },
      {
        binding: { code: "Minus" },
        onTrigger: () => {
          const state = pageShortcutStateRef.current;
          if (state.effectiveSelectedLineId && state.canEditDraft) {
            state.changeQty(state.effectiveSelectedLineId, -1);
          }
        },
      },
      {
        binding: { code: "NumpadSubtract" },
        onTrigger: () => {
          const state = pageShortcutStateRef.current;
          if (state.effectiveSelectedLineId && state.canEditDraft) {
            state.changeQty(state.effectiveSelectedLineId, -1);
          }
        },
      },
      {
        binding: { code: "Delete" },
        onTrigger: () => {
          const state = pageShortcutStateRef.current;
          if (state.effectiveSelectedLineId && state.canEditDraft) {
            state.removeDraftLine(state.effectiveSelectedLineId);
          }
        },
      },
      {
        binding: { code: "ArrowUp" },
        onTrigger: () => pageShortcutStateRef.current.selectAdjacentLine(-1),
      },
      {
        binding: { code: "ArrowDown" },
        onTrigger: () => pageShortcutStateRef.current.selectAdjacentLine(1),
      },
    ],
    [],
  );
  useShortcutScope({
    id: "pos-page",
    priority: SCOPE_PRIORITY[SHORTCUT_SCOPES.PAGE],
    bindings: posPageBindings,
  });

  return (
    <AppLayout activePath={ROUTES.POS}>
      <main className="min-w-0 flex-1">
        <PosOperationalGate>
          <div className="mx-auto w-full max-w-[2200px] space-y-3" dir="rtl">
          <header className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-surface)] md:flex-row md:items-center">
            <button
              type="button"
              onClick={() => setModal("closeShift")}
              disabled={!hasOpenShift}
              title="إغلاق الوردية"
              className="group flex shrink-0 items-center gap-3 rounded-xl border border-line bg-inset px-3 py-2 text-start transition hover:border-danger/40 hover:bg-danger-soft disabled:cursor-default disabled:hover:border-line disabled:hover:bg-inset"
            >
              <span>
                <span className="block text-[10px] text-subtle">الكاشير</span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <UserRound size={14} className="text-accent" /> {currentCashierName || "..."}
                </span>
              </span>
              {hasOpenShift && <Power size={15} className="text-subtle transition group-hover:text-danger" />}
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-inset px-3 py-2.5 transition focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/20">
              <Search size={16} className="shrink-0 text-subtle" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.code === "Escape") {
                    event.preventDefault();
                    if (query) {
                      setQuery("");
                    } else {
                      event.currentTarget.blur();
                    }
                    return;
                  }

                  // The only arrow that leaves the input: ArrowDown hands
                  // focus to the first visible product result. ArrowLeft/
                  // ArrowRight (and ArrowUp, which has nothing useful to
                  // do in a single-line input) are left completely alone
                  // so normal caret/text editing keeps working.
                  if (event.code !== "ArrowDown") return;

                  const items = getFocusableGridItems(productGridRef.current, ROVING_ITEM_SELECTOR);
                  if (!items.length) return;

                  event.preventDefault();
                  items[0].focus();
                }}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
                placeholder="ابحث بالباركود أو الاسم أو SKU..."
              />
              <ShortcutHint action="pos.focusProductSearch" />
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.POS_SHIFT_HISTORY)}
              className="flex items-center gap-2 rounded-xl border border-line bg-inset px-3 py-2 text-xs font-bold text-ink transition hover:border-accent-line hover:bg-accent-soft"
            >
              <History size={14} />
              Transactions
            </button>
          </header>

          {phase === "order" && (
          <Fragment>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_500px]">
            <CatalogPanel
              navigate={navigate}
              catalogCategories={catalogCategories}
              category={category}
              setCategory={setCategory}
              filteredProducts={filteredProducts}
              sellableCatalogQuery={sellableCatalogQuery}
              catalogCurrencyCode={catalogCurrencyCode}
              taxCategoryBanner={taxCategoryBanner}
              setTaxCategoryBanner={setTaxCategoryBanner}
              catalogPermissionQuery={catalogPermissionQuery}
              catalogManagePermissionQuery={catalogManagePermissionQuery}
              pricingManagePermissionQuery={pricingManagePermissionQuery}
              taxSettingsQuery={taxSettingsQuery}
              taxSetupRequired={taxSetupRequired}
              canEditDraft={canEditDraft}
              addItem={addItem}
              query={query}
              productGridRef={productGridRef}
            />

            <OrderSidebar
              navigate={navigate}
              draftLines={displayDraftLines}
              customer={effectiveCustomer}
              onClearCustomer={() => assignCustomerToOrder(null).catch((error) => handleDraftError(error))}
              onOpenCustomer={() => setModal("customer")}
              canViewCustomers={customersViewPermissionQuery.hasPermission}
              draftOrder={draftOrder}
              isCancelledOrder={isCancelledOrder}
              isConfirmedOrder={isConfirmedOrder}
              isClosedOrder={isClosedOrder}
              orderType={orderType}
              canEditDraft={canEditDraft}
              canEditDraftLines={canEditDraftLines}
              isDraftMutationPending={isDraftMutationPending}
              handleOrderTypeChange={handleOrderTypeChange}
              selectedRestaurantTable={selectedRestaurantTable}
              restaurantPermissionQuery={restaurantPermissionQuery}
              seatingQuery={seatingQuery}
              effectiveRestaurantTableId={effectiveRestaurantTableId}
              handleTableSelect={handleTableSelect}
              currentCompanyId={currentCompanyId}
              currentBranchId={currentBranchId}
              invalidateRestaurantSeating={invalidateRestaurantSeating}
              catalogCurrencyCode={catalogCurrencyCode}
              changeQty={changeQty}
              removeDraftLine={removeDraftLine}
              isLinePending={lineEditor.isLinePending}
              selectedLineId={effectiveSelectedLineId}
              onSelectLine={setSelectedLineId}
              onEditQuantity={(lineId, currentQuantity) => {
                setQuantityKeypadTarget({ lineId, initialValue: currentQuantity });
                setModal("editQuantity");
              }}
              onOpenDiscount={() => setModal("discount")}
              paymentMethods={paymentMethods}
              selectedPaymentMethod={selectedPaymentMethod}
              onSelectPaymentMethod={setSelectedPaymentMethodId}
              kitchenNote={kitchenNote}
              onKitchenNoteChange={setKitchenNote}
              subtotal={subtotal}
              discountValue={discountValue}
              vat={vat}
              total={total}
              shouldShowPaymentPanel={shouldShowPaymentPanel}
              netPaidAmount={netPaidAmount}
              settlementCurrencyCode={settlementCurrencyCode}
              settlementMinorUnitDigits={settlementMinorUnitDigits}
              remainingAmount={remainingAmount}
              isFullyPaid={isFullyPaid}
              preparationStarted={preparationStarted}
              canRequestPreparedVoid={canRequestPreparedVoid}
              canRequestCancel={canRequestCancel}
              openLifecycleModal={openLifecycleModal}
              lifecycleBlocker={lifecycleBlocker}
              cancelPermissionQuery={cancelPermissionQuery}
              voidPreparedPermissionQuery={voidPreparedPermissionQuery}
              onOpenRetrieve={
                salesOrdersViewPermissionQuery.hasPermission ? () => setModal("retrieve") : undefined
              }
              paymentsViewPermissionQuery={paymentsViewPermissionQuery}
              canRefundPayments={canRefundPayments}
              openRefundModal={openRefundModal}
              kitchenReady={kitchenReady}
              startNewOrder={startNewOrder}
              onOpenPayment={() => setPhase("payment")}
              readyKitchenTicketCount={readyKitchenTicketCount}
              kitchenTickets={kitchenTickets}
              closeBlockers={closeBlockers}
              canCloseOrder={canCloseOrder}
              onOpenCloseOrder={() => setModal("closeOrder")}
              hasOpenShift={hasOpenShift}
              canConfirmOrder={canConfirmOrder}
              confirmCurrentOrder={confirmCurrentOrder}
              goToPayment={goToPayment}
              onOpenShiftReport={() => setModal("shiftReport")}
            />
          </div>
          </Fragment>
          )}

          {phase === "payment" && draftOrder && (
            <PaymentStep
              draftOrder={draftOrder}
              draftLines={displayDraftLines}
              catalogCurrencyCode={catalogCurrencyCode}
              customer={effectiveCustomer}
              subtotal={subtotal}
              discountValue={discountValue}
              vat={vat}
              total={total}
              netPaidAmount={netPaidAmount}
              settlementCurrencyCode={settlementCurrencyCode}
              settlementMinorUnitDigits={settlementMinorUnitDigits}
              remainingAmount={remainingAmount}
              isCashSelected={isCashSelected}
              changeDueAmount={changeDueAmount}
              paymentsReceivePermissionQuery={paymentsReceivePermissionQuery}
              paymentMethodsQuery={paymentMethodsQuery}
              paymentMethods={paymentMethods}
              showAddPaymentMethod={showAddPaymentMethod}
              setShowAddPaymentMethod={setShowAddPaymentMethod}
              selectedPaymentMethod={selectedPaymentMethod}
              setSelectedPaymentMethodId={setSelectedPaymentMethodId}
              paymentAmountInput={paymentAmountInput}
              setPaymentAmountInput={setPaymentAmountInput}
              paymentAmount={paymentAmount}
              canReceivePayment={canReceivePayment}
              receiveCurrentPayment={receiveCurrentPayment}
              receivePaymentMutation={receivePaymentMutation}
              paymentsViewPermissionQuery={paymentsViewPermissionQuery}
              canRefundPayments={canRefundPayments}
              openRefundModal={openRefundModal}
              isLinePending={lineEditor.isLinePending}
              navigate={navigate}
              onBack={() => {
                setPhase("order");
                setShowAddPaymentMethod(false);
                setPaymentAmountInput("");
                setSelectedPaymentMethodId("");
              }}
            />
          )}

          {phase === "complete" && draftOrder && (
            <CompleteStep
              draftOrder={draftOrder}
              total={total}
              settlementCurrencyCode={settlementCurrencyCode}
              settlementMinorUnitDigits={settlementMinorUnitDigits}
              kitchenTickets={kitchenTickets}
              readyKitchenTicketCount={readyKitchenTicketCount}
              kitchenReady={kitchenReady}
              closePermissionQuery={closePermissionQuery}
              onOpenCloseOrder={() => setModal("closeOrder")}
              startNewOrder={startNewOrder}
              onBack={() => setPhase("order")}
            />
          )}
          </div>
        </PosOperationalGate>

        {toast && (
          <div className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-xl border border-blue-400/25 bg-[#10182a] px-4 py-3 text-xs font-bold text-blue-100 shadow-xl">
            {toast}
          </div>
        )}

        <OrderDialogs
          modal={modal}
          setModal={setModal}
          selectedVariantProduct={selectedVariantProduct}
          setSelectedVariantProduct={setSelectedVariantProduct}
          selectVariantForDraft={selectVariantForDraft}
          catalogCurrencyCode={catalogCurrencyCode}
          selectedModifierVariant={selectedModifierVariant}
          setSelectedModifierVariant={setSelectedModifierVariant}
          modifierSelections={modifierSelections}
          setModifierSelections={setModifierSelections}
          toggleModifierOption={toggleModifierOption}
          selectedModifierOptionIds={selectedModifierOptionIds}
          modifierSelectionIsValid={modifierSelectionIsValid}
          canEditDraft={canEditDraft}
          isDraftMutationPending={isDraftMutationPending}
          addSellableVariant={addSellableVariant}
          discountInput={discountInput}
          setDiscountInput={setDiscountInput}
          discountPermissionQuery={discountPermissionQuery}
          applyDraftDiscount={applyDraftDiscount}
          discountReason={discountReason}
          setDiscountReason={setDiscountReason}
          discountApproval={
            discountApproval && discountApproval.salesOrderId === draftOrder?.salesOrderId
              ? discountApproval
              : null
          }
          isDiscountRequestPending={requestDiscountMutation.isPending}
          onRefreshDraft={() => draftDetailsQuery.refetch()}
          isRefreshingDraft={draftDetailsQuery.isFetching}
          refundDraft={refundDraft}
          setRefundDraft={setRefundDraft}
          paymentsRefundPermissionQuery={paymentsRefundPermissionQuery}
          refundPaymentMutation={refundPaymentMutation}
          refundCurrentPayment={refundCurrentPayment}
          pendingRefundApproval={pendingRefundApproval}
          setPendingRefundApproval={setPendingRefundApproval}
          refundApprovalDetailsQuery={refundApprovalDetailsQuery}
          managerPin={managerPin}
          setManagerPin={setManagerPin}
          approveRefundMutation={approveRefundMutation}
          approveRefundRequest={approveRefundRequest}
          draftOrder={draftOrder}
          total={total}
          settlementCurrencyCode={settlementCurrencyCode}
          settlementMinorUnitDigits={settlementMinorUnitDigits}
          effectiveOrderType={effectiveOrderType}
          selectedRestaurantTable={selectedRestaurantTable}
          kitchenTickets={kitchenTickets}
          readyKitchenTicketCount={readyKitchenTicketCount}
          canCloseOrder={canCloseOrder}
          closeCurrentOrder={closeCurrentOrder}
          lifecycleDraft={lifecycleDraft}
          setLifecycleDraft={setLifecycleDraft}
          netPaidAmount={netPaidAmount}
          preparationStarted={preparationStarted}
          canRequestPreparedVoid={canRequestPreparedVoid}
          canRequestCancel={canRequestCancel}
          runLifecycleAction={runLifecycleAction}
        />

        {modal === "retrieve" && (
          <OrderRetrievalModal
            currentCompanyId={currentCompanyId}
            currentBranchId={currentBranchId}
            onClose={() => setModal(null)}
            onSelectOrder={retrieveOrder}
            activatingOrderId={retrievingOrderId}
          />
        )}

        {modal === "shiftReport" && openShiftQuery.data && (
          <ShiftReportDialog
            shift={openShiftQuery.data}
            companyId={currentCompanyId}
            branchId={currentBranchId}
            cashierName={currentCashierName}
            onClose={() => setModal(null)}
          />
        )}

        <ShiftDialogs
          modal={modal}
          setModal={setModal}
          cashMovementDraft={cashMovementDraft}
          setCashMovementDraft={setCashMovementDraft}
          expectedCashAmount={expectedCashAmount}
          shiftCurrencyCode={shiftCurrencyCode}
          shiftMinorUnitDigits={shiftMinorUnitDigits}
          openShiftId={openShiftId}
          cashDrawerPermissionQuery={cashDrawerPermissionQuery}
          cashMovementAmount={cashMovementAmount}
          canSubmitCashMovement={canSubmitCashMovement}
          submitCashMovement={submitCashMovement}
          recentCashMovements={recentCashMovements}
          openShiftQuery={openShiftQuery}
          currentPosTerminalId={currentPosTerminalId}
          variancePreview={variancePreview}
          countedCashInput={countedCashInput}
          setCountedCashInput={setCountedCashInput}
          countedCash={countedCash}
          closingNoteInput={closingNoteInput}
          setClosingNoteInput={setClosingNoteInput}
          hasOpenShift={hasOpenShift}
          closeShiftPermissionQuery={closeShiftPermissionQuery}
          lastClosedShift={lastClosedShift}
          closeCurrentShift={closeCurrentShift}
          canCloseShift={canCloseShift}
          closeShiftMutation={closeShiftMutation}
        />

        <PosMiscDialogs
          modal={modal}
          setModal={setModal}
          currentCompanyId={currentCompanyId}
          canViewCustomers={customersViewPermissionQuery.hasPermission}
          canManageCustomers={customersManagePermissionQuery.hasPermission}
          onSelectCustomer={assignCustomerToOrder}
        />

        {modal === "editQuantity" && quantityKeypadTarget && (
          <NumericKeypadModal
            title="تعديل الكمية"
            initialValue={String(quantityKeypadTarget.initialValue)}
            allowDecimal={false}
            confirmLabel="تحديث"
            onCancel={() => {
              setModal(null);
              setQuantityKeypadTarget(null);
            }}
            onConfirm={(value) => {
              const nextQuantity = Number(value);
              if (Number.isFinite(nextQuantity)) {
                const delta = nextQuantity - Number(quantityKeypadTarget.initialValue);
                if (delta !== 0) {
                  changeQty(quantityKeypadTarget.lineId, delta);
                }
              }
              setModal(null);
              setQuantityKeypadTarget(null);
            }}
          />
        )}
      </main>
    </AppLayout>
  );
}
