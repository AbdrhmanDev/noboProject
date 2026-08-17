import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  History,
  Layers3,
  Monitor,
  Package,
  Search,
  Truck,
  UserRound,
  Wifi,
} from "lucide-react";
import { ROUTES } from "../../utils/routes";
import AppLayout from "../../components/AppLayout";
import { formatMoney } from "../../shared/utils/formatters";
import { useAuth } from "../../features/auth/hooks/useAuth";
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
import {
  useConfirmSalesOrder,
  useCreateDraftSalesOrder,
  useCloseSalesOrder,
  useCancelSalesOrder,
  useDraftSalesOrderDetails,
  useVoidPreparedSalesOrder,
  useUpdateDraftSalesOrder,
} from "../../features/sales-orders/hooks/useDraftSalesOrder";
import { useDraftLineEditor } from "../../features/pos/hooks/useDraftLineEditor";
import {
  useActivePaymentMethods,
  useReceiveSalesOrderPayment,
  useRefundSalesOrderPayment,
  useSalesOrderPayments,
} from "../../features/payments/hooks/usePayments";
import {
  useInvalidateRestaurantSeating,
  useRestaurantSeating,
} from "../../features/restaurant/hooks/useRestaurantSeating";
import { ALL_CATEGORY_ID, CatalogPanel, UNCATEGORIZED_CATEGORY_ID } from "../../features/pos/components/catalog/CatalogPanel";
import { OrderSidebar } from "../../features/pos/components/order/OrderSidebar";
import { OrderDialogs } from "../../features/pos/components/order/OrderDialogs";
import { PaymentModal } from "../../features/pos/components/payment/PaymentModal";
import { ShiftDialogs } from "../../features/pos/components/shift/ShiftDialogs";
import { PosSecondaryPanels } from "../../features/pos/components/PosSecondaryPanels";
import { PosMiscDialogs } from "../../features/pos/components/PosMiscDialogs";
import {
  formatPaymentDate,
  getCashMovementLabel,
  parseMoneyInput,
  parseNonNegativeMoneyInput,
} from "../../features/pos/utils/posFormatters";

const SALES_ORDERS_CREATE_PERMISSION = "SalesOrders.Create";
const SALES_ORDERS_APPLY_DISCOUNT_PERMISSION = "SalesOrders.ApplyDiscount";
const SALES_ORDERS_CONFIRM_PERMISSION = "SalesOrders.Confirm";
const SALES_ORDERS_CLOSE_PERMISSION = "SalesOrders.Close";
const SALES_ORDERS_CANCEL_PERMISSION = "SalesOrders.Cancel";
const SALES_ORDERS_VOID_PREPARED_PERMISSION = "SalesOrders.VoidPrepared";
const RESTAURANT_VIEW_PERMISSION = "Restaurant.View";
const POS_ADJUST_CASH_DRAWER_PERMISSION = "Pos.AdjustCashDrawer";
const POS_CLOSE_SHIFT_PERMISSION = "Pos.CloseShift";
const PAYMENTS_VIEW_PERMISSION = "Payments.View";
const PAYMENTS_RECEIVE_PERMISSION = "Payments.Receive";
const PAYMENTS_REFUND_PERMISSION = "Payments.Refund";
const CATALOG_MANAGE_PERMISSION = "Catalog.Manage";
const PRICING_MANAGE_PERMISSION = "Pricing.Manage";
const DEFAULT_FULFILLMENT_TYPE = "Takeaway";

export default function POSPage() {
  const navigate = useNavigate();
  const { status } = useAuth();
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
  const paymentMethodsQuery = useActivePaymentMethods(
    currentCompanyId,
    Boolean(draftSalesOrderId) &&
      !paymentsReceivePermissionQuery.isLoading &&
      paymentsReceivePermissionQuery.hasPermission,
  );
  const paymentHistoryQuery = useSalesOrderPayments(
    currentCompanyId,
    currentBranchId,
    draftSalesOrderId,
    Boolean(draftSalesOrderId) &&
      !paymentsViewPermissionQuery.isLoading &&
      paymentsViewPermissionQuery.hasPermission,
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
  const invalidateRestaurantSeating = useInvalidateRestaurantSeating();
  const [taxCategoryBanner, setTaxCategoryBanner] = useState(null);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY_ID);
  const [orderType, setOrderType] = useState(DEFAULT_FULFILLMENT_TYPE);
  const [selectedRestaurantTableId, setSelectedRestaurantTableId] = useState(null);
  const [discountInput, setDiscountInput] = useState("");
  const [customer, setCustomer] = useState(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [refundDraft, setRefundDraft] = useState(null);
  const [lifecycleDraft, setLifecycleDraft] = useState(null);
  const [cashMovementDraft, setCashMovementDraft] = useState({
    type: "CashIn",
    amount: "",
    reason: "",
  });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);
  const [selectedModifierVariant, setSelectedModifierVariant] = useState(null);
  const [modifierSelections, setModifierSelections] = useState({});
  const [countedCashInput, setCountedCashInput] = useState("");
  const [closingNoteInput, setClosingNoteInput] = useState("");
  const [lastClosedShift, setLastClosedShift] = useState(null);
  const [aiDismissed, setAiDismissed] = useState([]);
  const draftOrder = draftDetailsQuery.data || null;
  const draftLines = draftOrder?.lines ?? [];
  const isConfirmedOrder = draftOrder?.status === "Confirmed";
  const isClosedOrder = draftOrder?.status === "Closed";
  const isCancelledOrder = draftOrder?.status === "Cancelled";
  const canEditDraft = !draftOrder || draftOrder.status === "Draft";
  const effectiveOrderType = draftOrder?.fulfillmentType || orderType;
  const effectiveRestaurantTableId =
    draftOrder?.restaurantTableId ||
    (orderType === "DineIn" ? selectedRestaurantTableId : null);
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
  const paymentState = paymentHistoryQuery.data;
  const settlementCurrencyCode =
    paymentState?.currencyCode || draftOrder?.currencyCode || catalogCurrencyCode;
  const settlementMinorUnitDigits =
    paymentState?.currencyMinorUnitDigits ||
    draftOrder?.currencyMinorUnitDigits ||
    2;
  const remainingAmount =
    paymentState?.remainingAmount ?? draftOrder?.remainingAmount ?? total;
  const netPaidAmount = paymentState?.netPaidAmount ?? draftOrder?.netPaidAmount ?? 0;
  const isFullyPaid = Boolean(paymentState?.isFullyPaid ?? draftOrder?.isFullyPaid);
  const paymentAmount = parseMoneyInput(
    paymentAmountInput,
    settlementMinorUnitDigits,
  );
  const canReceivePayment =
    isConfirmedOrder &&
    !isFullyPaid &&
    remainingAmount > 0 &&
    Boolean(selectedPaymentMethod) &&
    paymentsReceivePermissionQuery.hasPermission &&
    !paymentMethodsQuery.isLoading &&
    !receivePaymentMutation.isPending &&
    !paymentAmount.error &&
    paymentAmount.amount !== null &&
    paymentAmount.amount <= remainingAmount;
  const shouldShowPaymentPanel = isConfirmedOrder || isClosedOrder || isCancelledOrder;
  const canRefundPayments = isConfirmedOrder && paymentsRefundPermissionQuery.hasPermission;
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
  ) => ({
    fulfillmentType,
    restaurantTableId: fulfillmentType === "DineIn" ? restaurantTableId : null,
    lines,
    discount,
  });
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
        setDraftSession({ scope: draftScope, salesOrderId: created.salesOrderId });
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
  const notifyDraftRequiresLine = () => {
    notify("This is the last item. Cancel the order instead of removing it.");
  };
  const commitDraftLines = async (requestLines, baseDraft) => {
    if (!currentCompanyId || !currentBranchId) return null;

    if (orderType === "DineIn" && !effectiveRestaurantTableId) {
      notify("Select a table before adding dine-in items.");
      return null;
    }

    const payload = buildDraftPayload(requestLines, getDraftDiscountInput());

    if (!baseDraft) {
      const created = await createDraftMutation.mutateAsync(payload);
      setDraftSession({ scope: draftScope, salesOrderId: created.salesOrderId });
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
    onRequiresAtLeastOneLine: notifyDraftRequiresLine,
    onCommitError: handleDraftError,
  });
  const displayDraftLines = lineEditor.getDisplayLines();
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
      setModal(orderType === "DineIn" ? null : "payment");
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
  const refreshPaymentState = () => {
    paymentHistoryQuery.refetch();
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
      await paymentHistoryQuery.refetch();
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
      await paymentHistoryQuery.refetch();
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
    if (!selectedPaymentMethod || !draftSalesOrderId) return;

    if (!paymentsReceivePermissionQuery.hasPermission) {
      notify("Payments.Receive permission is required.");
      return;
    }

    if (paymentAmount.error || paymentAmount.amount === null) {
      notify(paymentAmount.error || "Enter a valid payment amount.");
      return;
    }

    if (paymentAmount.amount > remainingAmount) {
      notify("Payment amount exceeds the remaining balance.");
      return;
    }

    try {
      await receivePaymentMutation.mutateAsync({
        paymentMethodId: selectedPaymentMethod.paymentMethodId,
        amount: paymentAmount.amount,
        posShiftId: openShiftId,
      });
      setPaymentAmountInput("");
      notify("Payment received.");
      refreshPaymentState();
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

    if (!paymentsRefundPermissionQuery.hasPermission) {
      notify("Payments.Refund permission is required.");
      return;
    }

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
      await refundPaymentMutation.mutateAsync({
        salesOrderPaymentId: refundDraft.payment.salesOrderPaymentId,
        payload: {
          amount: refundAmount.amount,
          posShiftId: openShiftId,
          reason: refundDraft.reason,
        },
      });
      setRefundDraft(null);
      setModal(null);
      notify("Refund processed.");
      refreshPaymentState();
    } catch (error) {
      handlePaymentError(error);
    }
  };
  const startNewOrder = () => {
    setDraftSession({ scope: "", salesOrderId: null });
    setOrderType(DEFAULT_FULFILLMENT_TYPE);
    setSelectedRestaurantTableId(null);
    setDiscountInput("");
    setPaymentAmountInput("");
    setSelectedPaymentMethodId("");
    setRefundDraft(null);
    setLifecycleDraft(null);
    setCustomer(null);
    setSelectedVariantProduct(null);
    setSelectedModifierVariant(null);
    setModifierSelections({});
    setModal(null);
  };

  const addSellableVariant = async (variant, modifierOptionIds = []) => {
    if (!canEditDraft) return;

    setSelectedVariantProduct(null);
    setSelectedModifierVariant(null);
    setModifierSelections({});
    setModal(null);
    const requestLines = mapDraftLinesToRequest();
    const modifierKey = modifierOptionIds.slice().sort().join("|");
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

    await replaceDraftLines(requestLines);
  };
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
  const holdOrder = () => {
    notify("Draft hold is not integrated yet.");
  };
  const applyDraftDiscount = () => {
    if (!canEditDraft) return;

    if (!draftOrder || !draftLines.length) {
      notify("Create a draft before applying a discount.");
      return;
    }

    if (!discountPermissionQuery.hasPermission) {
      notify("Sales order discount permission is required.");
      return;
    }

    const value = Number(discountInput);
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      notify("Enter a percentage discount between 1 and 100.");
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
  const insights = [
    {
      id: "water",
      title: "المياه ستنفد خلال 3 أيام.",
      detail: "مخزون فرع الرياض: 18 وحدة مقابل معدل بيع 6 وحدات يوميًا.",
      action: "إنشاء طلب شراء",
      icon: AlertTriangle,
    },
    {
      id: "sales",
      title: "مبيعات الشيبس انخفضت 18%.",
      detail: "مقارنة بمتوسط آخر 4 أسابيع، بثقة 91%.",
      action: "اقتراح عرض",
      icon: Bot,
    },
    {
      id: "branch",
      title: "فرع جدة يحتاج 40 وحدة من المنتج X.",
      detail: "الطلب المتوقع يتجاوز المخزون المتاح نهاية الأسبوع.",
      action: "إنشاء تحويل",
      icon: Truck,
    },
  ];

  return (
    <AppLayout activePath={ROUTES.POS}>
      <main className="min-w-0 flex-1 p-3 sm:p-4 xl:p-5">
        <PosOperationalGate>
          <div className="mx-auto max-w-[1680px] space-y-4" dir="rtl">
          <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0c1424]/85 p-3 shadow-lg shadow-black/15 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-3 py-2">
                <div className="text-[10px] text-slate-400">
                  POS MAIN / SMART CHECKOUT
                </div>
                <div className="text-xs font-bold text-white">
                  الرياض الرئيسي · POS-01
                </div>
              </div>
              <div className="rounded-xl border border-white/10 px-3 py-2">
                <div className="text-[10px] text-slate-400">الكاشير</div>
                <div className="flex items-center gap-1 text-xs font-bold">
                  <UserRound size={13} className="text-blue-300" /> أحمد محمد
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModal(hasOpenShift ? "closeShift" : "openShift")}
                className={`rounded-xl border px-3 py-2 text-xs font-bold ${hasOpenShift ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : "border-amber-400/25 bg-amber-500/10 text-amber-200"}`}
              >
                <span className="ml-1 inline-block h-2 w-2 rounded-full bg-current" />
                {hasOpenShift
                  ? `Open shift - ${formatPaymentDate(openShiftQuery.data?.openedAtUtc)}`
                  : "Open shift"}
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.POS_SHIFT_HISTORY)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-200 hover:border-blue-400/40 hover:bg-blue-500/10"
              >
                <History size={14} />
                Shift History
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.POS_TERMINALS_ADMIN)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-200 hover:border-blue-400/40 hover:bg-blue-500/10"
              >
                <Monitor size={14} />
                Terminals
              </button>
            </div>
            <div className="flex flex-1 items-center gap-2 lg:max-w-xl">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 focus-within:border-blue-400/60">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-500"
                  placeholder="ابحث بالباركود أو الاسم أو SKU..."
                />
                <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">
                  F2
                </kbd>
              </div>
              <div className="hidden items-center gap-1 rounded-lg border border-emerald-400/15 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-300 sm:flex">
                <Wifi size={15} /> Online
              </div>
            </div>
          </header>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
            <CatalogPanel
              navigate={navigate}
              notify={notify}
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
              isDraftMutationPending={isDraftMutationPending}
              addItem={addItem}
              onOpenPromotions={() => setModal("promotions")}
              query={query}
            />

            <OrderSidebar
              navigate={navigate}
              draftLines={displayDraftLines}
              customer={customer}
              setCustomer={setCustomer}
              onOpenCustomer={() => setModal("customer")}
              draftOrder={draftOrder}
              isCancelledOrder={isCancelledOrder}
              isConfirmedOrder={isConfirmedOrder}
              isClosedOrder={isClosedOrder}
              orderType={orderType}
              canEditDraft={canEditDraft}
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
              onOpenDiscount={() => setModal("discount")}
              subtotal={subtotal}
              discountValue={discountValue}
              vat={vat}
              total={total}
              shouldShowPaymentPanel={shouldShowPaymentPanel}
              paymentState={paymentState}
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
              holdOrder={holdOrder}
              onOpenRetrieve={() => setModal("retrieve")}
              onOpenCashMovement={() => setModal("cashMovement")}
              paymentsViewPermissionQuery={paymentsViewPermissionQuery}
              paymentHistoryQuery={paymentHistoryQuery}
              canRefundPayments={canRefundPayments}
              openRefundModal={openRefundModal}
              kitchenReady={kitchenReady}
              startNewOrder={startNewOrder}
              onOpenPayment={() => setModal("payment")}
              readyKitchenTicketCount={readyKitchenTicketCount}
              kitchenTickets={kitchenTickets}
              closeBlockers={closeBlockers}
              canCloseOrder={canCloseOrder}
              onOpenCloseOrder={() => setModal("closeOrder")}
              hasOpenShift={hasOpenShift}
              canConfirmOrder={canConfirmOrder}
              confirmCurrentOrder={confirmCurrentOrder}
            />
          </div>

          <PosSecondaryPanels
            setModal={setModal}
            expectedCashAmount={expectedCashAmount}
            shiftCurrencyCode={shiftCurrencyCode}
            shiftMinorUnitDigits={shiftMinorUnitDigits}
            openShiftQuery={openShiftQuery}
            openShiftId={openShiftId}
            cashDrawerPermissionQuery={cashDrawerPermissionQuery}
            notify={notify}
            insights={insights}
            aiDismissed={aiDismissed}
            setAiDismissed={setAiDismissed}
          />
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
          refundDraft={refundDraft}
          setRefundDraft={setRefundDraft}
          paymentsRefundPermissionQuery={paymentsRefundPermissionQuery}
          refundPaymentMutation={refundPaymentMutation}
          refundCurrentPayment={refundCurrentPayment}
          draftOrder={draftOrder}
          total={total}
          settlementCurrencyCode={settlementCurrencyCode}
          settlementMinorUnitDigits={settlementMinorUnitDigits}
          paymentState={paymentState}
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

        {modal === "payment" && draftOrder && (
          <PaymentModal
            draftOrder={draftOrder}
            total={total}
            netPaidAmount={netPaidAmount}
            settlementCurrencyCode={settlementCurrencyCode}
            settlementMinorUnitDigits={settlementMinorUnitDigits}
            remainingAmount={remainingAmount}
            isFullyPaid={isFullyPaid}
            kitchenTickets={kitchenTickets}
            readyKitchenTicketCount={readyKitchenTicketCount}
            kitchenReady={kitchenReady}
            closePermissionQuery={closePermissionQuery}
            onClose={() => {
              setModal(null);
              setShowAddPaymentMethod(false);
              setPaymentAmountInput("");
              setSelectedPaymentMethodId("");
            }}
            onOpenCloseOrder={() => setModal("closeOrder")}
            startNewOrder={startNewOrder}
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
            paymentState={paymentState}
            canRefundPayments={canRefundPayments}
            openRefundModal={openRefundModal}
            navigate={navigate}
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

        <PosMiscDialogs modal={modal} setModal={setModal} setCustomer={setCustomer} notify={notify} />
      </main>
    </AppLayout>
  );
}
