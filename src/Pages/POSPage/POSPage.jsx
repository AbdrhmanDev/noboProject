import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Barcode,
  Bot,
  Box,
  Check,
  Package,
  CircleDollarSign,
  CreditCard,
  Crown,
  Database,
  Gift,
  Minus,
  Layers3,
  PauseCircle,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  UserRound,
  WalletCards,
  Wifi,
  X,
} from "lucide-react";
import { ROUTES } from "../../utils/routes";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { formatMoney } from "../../shared/utils/formatters";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { PosOperationalGate } from "../../features/pos/components/PosOperationalGate";
import { usePos } from "../../features/pos/context/PosContext";
import { useOpenPosShift } from "../../features/pos/hooks/useOpenPosShift";
import { useSellableCatalog } from "../../features/pos/hooks/useSellableCatalog";
import {
  useConfirmSalesOrder,
  useCreateDraftSalesOrder,
  useDraftSalesOrderDetails,
  useUpdateDraftSalesOrder,
} from "../../features/sales-orders/hooks/useDraftSalesOrder";
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

const ALL_CATEGORY_ID = "__all__";
const UNCATEGORIZED_CATEGORY_ID = "__uncategorized__";
const SALES_ORDERS_CREATE_PERMISSION = "SalesOrders.Create";
const SALES_ORDERS_APPLY_DISCOUNT_PERMISSION = "SalesOrders.ApplyDiscount";
const SALES_ORDERS_CONFIRM_PERMISSION = "SalesOrders.Confirm";
const RESTAURANT_VIEW_PERMISSION = "Restaurant.View";
const PAYMENTS_VIEW_PERMISSION = "Payments.View";
const PAYMENTS_RECEIVE_PERMISSION = "Payments.Receive";
const PAYMENTS_REFUND_PERMISSION = "Payments.Refund";
const DEFAULT_FULFILLMENT_TYPE = "Takeaway";
const ORDER_TYPES = ["Takeaway", "DineIn", "Delivery"];

function getPaymentMethodIcon(kind) {
  if (kind === "Cash") return Banknote;
  if (kind === "Card") return CreditCard;
  return WalletCards;
}

function getPaymentMethodColor(kind) {
  if (kind === "Cash") return "text-emerald-300";
  if (kind === "Card") return "text-blue-300";
  if (kind === "BankTransfer") return "text-violet-300";
  return "text-amber-300";
}

function getDecimalScale(value) {
  const normalized = String(value || "").trim();
  if (!normalized.includes(".")) return 0;
  return normalized.split(".")[1]?.length || 0;
}

function isPositiveDecimalInput(value) {
  return /^\d+(\.\d+)?$/.test(String(value || "").trim());
}

function parseMoneyInput(value, minorUnitDigits) {
  const normalized = String(value || "").trim();

  if (!isPositiveDecimalInput(normalized)) {
    return { amount: null, error: "Enter a valid positive amount." };
  }

  if (getDecimalScale(normalized) > minorUnitDigits) {
    return {
      amount: null,
      error: `Amount supports up to ${minorUnitDigits} decimal places.`,
    };
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { amount: null, error: "Amount must be greater than zero." };
  }

  return { amount, error: "" };
}

function formatPaymentDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
function IconButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled = false,
}) {
  const tones = {
    default:
      "border-white/10 bg-white/[0.035] hover:border-blue-400/45 hover:bg-blue-500/10",
    danger:
      "border-rose-500/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
    pink: "border-pink-400/25 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function Metric({ label, value, detail, tone = "blue" }) {
  const colors = {
    blue: "text-blue-300",
    green: "text-emerald-300",
    gold: "text-amber-300",
    pink: "text-pink-300",
  };
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-black ${colors[tone]}`}>{value}</div>
      {detail && (
        <div className="mt-1 text-[10px] text-slate-500">{detail}</div>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#030713]/75 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#10182a] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function POSPage() {
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
  const restaurantPermissionQuery = useHasPermission(
    currentCompanyId,
    RESTAURANT_VIEW_PERMISSION,
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
  const openShiftId = openShiftQuery.data?.posShiftId || null;
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY_ID);
  const [orderType, setOrderType] = useState(DEFAULT_FULFILLMENT_TYPE);
  const [selectedRestaurantTableId, setSelectedRestaurantTableId] = useState(null);
  const [discountInput, setDiscountInput] = useState("");
  const [customer, setCustomer] = useState(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [refundDraft, setRefundDraft] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);
  const [selectedModifierVariant, setSelectedModifierVariant] = useState(null);
  const [modifierSelections, setModifierSelections] = useState({});
  const [shiftOpen, setShiftOpen] = useState(true);
  const [actualCash, setActualCash] = useState("4625");
  const [aiDismissed, setAiDismissed] = useState([]);
  const draftOrder = draftDetailsQuery.data || null;
  const draftLines = draftOrder?.lines ?? [];
  const isConfirmedOrder = draftOrder?.status === "Confirmed";
  const canEditDraft = !draftOrder || draftOrder.status === "Draft";
  const effectiveOrderType = draftOrder?.fulfillmentType || orderType;
  const effectiveRestaurantTableId =
    draftOrder?.restaurantTableId ||
    (effectiveOrderType === "DineIn" ? selectedRestaurantTableId : null);
  const seatingQuery = useRestaurantSeating(
    currentCompanyId,
    currentBranchId,
    effectiveOrderType === "DineIn" &&
      !restaurantPermissionQuery.isLoading &&
      restaurantPermissionQuery.hasPermission,
  );
  const isDraftMutationPending =
    createDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    confirmSalesOrderMutation.isPending;
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
    (effectiveOrderType !== "DineIn" || Boolean(effectiveRestaurantTableId));
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
  const remainingAmount = paymentState?.remainingAmount ?? total;
  const isFullyPaid = Boolean(paymentState?.isFullyPaid);
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
  const handleDraftError = (error) => {
    if (error?.code === "SalesOrder.DraftVersionConflict") {
      draftDetailsQuery.refetch();
      notify("Sales order changed. Cart was refreshed.");
      return;
    }

    notify(error?.message || "Unable to update draft order.");
  };
  const replaceDraftLines = async (lines, discount = getDraftDiscountInput()) => {
    if (!canEditDraft || !currentCompanyId || !currentBranchId || !lines.length) {
      return;
    }

    if (effectiveOrderType === "DineIn" && !effectiveRestaurantTableId) {
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
      handleDraftError(error);
    }
  };
  const notifyDraftRequiresLine = () => {
    notify("Draft requires at least one line. Cancel will be integrated later.");
  };
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
    if (!canEditDraft || nextOrderType === effectiveOrderType) return;

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

    if (!confirmPermissionQuery.hasPermission) {
      notify("SalesOrders.Confirm permission is required.");
      return;
    }

    if (effectiveOrderType === "DineIn" && !effectiveRestaurantTableId) {
      notify("Select a table before confirming dine-in order.");
      return;
    }

    try {
      await confirmSalesOrderMutation.mutateAsync();
      setSelectedVariantProduct(null);
      setSelectedModifierVariant(null);
      setModifierSelections({});
      setModal(null);
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
    ];

    if (staleCodes.includes(error?.code)) {
      refreshPaymentState();
    }

    notify(error?.message || "Payment request failed.");
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
    if (!canEditDraft) return;

    const requestLines = mapDraftLinesToRequest();
    const index = draftLines.findIndex(
      (line) => line.salesOrderLineId === salesOrderLineId,
    );
    if (index < 0) return;

    const nextQuantity = Number(requestLines[index].quantity) + amount;
    if (nextQuantity <= 0) {
      requestLines.splice(index, 1);
    } else {
      requestLines[index] = { ...requestLines[index], quantity: nextQuantity };
    }

    if (!requestLines.length) {
      notifyDraftRequiresLine();
      return;
    }

    replaceDraftLines(requestLines);
  };
  const removeDraftLine = (salesOrderLineId) => {
    if (!canEditDraft) return;

    const index = draftLines.findIndex(
      (line) => line.salesOrderLineId === salesOrderLineId,
    );
    if (index < 0) return;

    const requestLines = mapDraftLinesToRequest();
    requestLines.splice(index, 1);

    if (!requestLines.length) {
      notifyDraftRequiresLine();
      return;
    }

    replaceDraftLines(requestLines);
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
                onClick={() => setModal(shiftOpen ? "closeShift" : "openShift")}
                className={`rounded-xl border px-3 py-2 text-xs font-bold ${shiftOpen ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : "border-amber-400/25 bg-amber-500/10 text-amber-200"}`}
              >
                <span className="ml-1 inline-block h-2 w-2 rounded-full bg-current" />
                {shiftOpen ? "وردية نشطة · 05:42 س" : "فتح وردية"}
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
            <section className="min-w-0 space-y-4">
              <div className="grid grid-flow-col auto-cols-[82px] gap-2 overflow-x-auto pb-1 scrollbar-none sm:auto-cols-[96px]">
                {catalogCategories.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    className={`flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-xl border px-2 text-[10px] font-semibold transition ${category === id ? "border-blue-400/70 bg-blue-500/15 text-blue-100 shadow-lg shadow-blue-950/30" : "border-white/10 bg-[#0d1728] text-slate-400 hover:border-white/20 hover:bg-white/[0.06]"}`}
                  >
                    <Icon
                      size={18}
                      className={
                        category === id ? "text-blue-300" : "text-slate-500"
                      }
                    />
                    <span className="max-w-full truncate">{label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
                <div>
                  <h1 className="text-base font-black text-white">
                    المنتجات القابلة للبيع{" "}
                    <span className="text-slate-500">
                      ({filteredProducts.length})
                    </span>
                  </h1>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {sellableCatalogQuery.data
                      ? `${sellableCatalogQuery.data.priceListName} · ${catalogCurrencyCode}`
                      : "تحميل الكتالوج التشغيلي للفرع"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <IconButton
                    icon={Barcode}
                    label="مسح باركود"
                    onClick={() => notify("وضع المسح جاهز لاستقبال الباركود.")}
                  />
                  <IconButton
                    icon={Gift}
                    label="العروض النشطة"
                    onClick={() => setModal("promotions")}
                    tone="pink"
                  />
                </div>
              </div>

              {catalogPermissionQuery.isLoading && (
                <LoadingState label="Checking catalog access..." />
              )}
              {catalogPermissionQuery.isError && (
                <ErrorState
                  title="Catalog permissions unavailable"
                  message="Unable to confirm sellable catalog access."
                />
              )}
              {!catalogPermissionQuery.isLoading &&
                !catalogPermissionQuery.isError &&
                !catalogPermissionQuery.hasPermission && (
                  <EmptyState
                    title="No access to sellable catalog"
                    message="Your current role cannot create sales orders for this company."
                  />
                )}
              {sellableCatalogQuery.isLoading && (
                <LoadingState label="Loading sellable catalog..." />
              )}
              {sellableCatalogQuery.isError && (
                <ErrorState
                  title="Sellable catalog unavailable"
                  message="Unable to load sellable products for this branch."
                />
              )}
              {sellableCatalogQuery.data &&
                !sellableCatalogQuery.isLoading &&
                !filteredProducts.length && (
                  <EmptyState
                    title="No sellable products are available for this branch"
                    message="Try another category or search term."
                  />
                )}
              {sellableCatalogQuery.data && filteredProducts.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {filteredProducts.map((product) => {
                    const hasModifiers = product.variants.some(
                      (variant) => variant.modifierGroups?.length,
                    );

                    return (
                      <button
                        type="button"
                        key={product.productId}
                        onClick={() => addItem(product)}
                        disabled={!canEditDraft || isDraftMutationPending}
                        className="group overflow-hidden rounded-xl border border-white/10 bg-[#0d1728] p-2.5 text-right transition hover:-translate-y-0.5 hover:border-blue-400/60 hover:bg-[#111f36] hover:shadow-lg hover:shadow-blue-950/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="relative mb-2 grid aspect-[1.3] place-items-center rounded-lg border border-white/8 bg-white/[0.025]">
                          <Package size={28} className="text-blue-300/80" />
                          <span className="absolute bottom-1.5 right-2 rounded bg-black/25 px-1.5 py-0.5 text-[9px] text-slate-300">
                            {product.categoryName}
                          </span>
                        </div>
                        <div className="line-clamp-2 min-h-8 text-[11px] font-bold leading-4 text-slate-100">
                          {product.productName}
                        </div>
                        <div className="mt-1 min-h-4 truncate text-[10px] text-slate-500">
                          {product.variants.length > 1
                            ? `${product.variants.length} variants`
                            : product.variants[0]?.variantName}
                        </div>
                        <div className="mt-2 flex items-end justify-between gap-2">
                          <span className="text-xs font-black text-white">
                            {formatMoney(
                              product.startingPrice,
                              catalogCurrencyCode,
                              2,
                            )}
                          </span>
                          {hasModifiers && (
                            <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">
                              Modifiers
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="flex min-h-[620px] flex-col rounded-2xl border border-white/10 bg-[#0d1728]/95 p-3 shadow-xl shadow-black/20 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:scrollbar-none">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 text-blue-300">
                    <ShoppingCart size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">سلة المشتريات</h2>
                    <span className="text-[10px] text-slate-500">
                      {draftLines.reduce((sum, item) => sum + Number(item.quantity), 0)} صنف في
                      الفاتورة
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModal("customer")}
                  className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-blue-300 hover:bg-blue-500/10"
                >
                  {customer ? customer.name : "اختيار عميل"}
                </button>
              </div>
              {customer && (
                <div className="mb-2 flex items-center justify-between rounded-xl bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
                  <span className="flex items-center gap-1">
                    <Crown size={13} className="text-amber-300" />
                    {customer.name} · سعر VIP
                  </span>
                  <button type="button" onClick={() => setCustomer(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="mb-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.025] p-2">
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span>Order status</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      isConfirmedOrder
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-blue-500/15 text-blue-300"
                    }`}
                  >
                    {draftOrder?.status || "New"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {ORDER_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      disabled={!canEditDraft || isDraftMutationPending}
                      onClick={() => handleOrderTypeChange(type)}
                      className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        effectiveOrderType === type
                          ? "border-blue-400 bg-blue-500/15 text-blue-100"
                          : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {effectiveOrderType === "DineIn" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span>Table</span>
                      <span className="text-blue-300">
                        {selectedRestaurantTable
                          ? `${selectedRestaurantTable.floorName} · ${selectedRestaurantTable.code}`
                          : "Required"}
                      </span>
                    </div>
                    {restaurantPermissionQuery.isLoading && (
                      <p className="rounded-lg bg-black/10 px-2 py-2 text-[10px] text-slate-500">
                        Checking restaurant access...
                      </p>
                    )}
                    {!restaurantPermissionQuery.isLoading &&
                      !restaurantPermissionQuery.hasPermission && (
                        <p className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-2 text-[10px] text-amber-100">
                          Restaurant.View permission is required.
                        </p>
                      )}
                    {seatingQuery.isLoading && (
                      <p className="rounded-lg bg-black/10 px-2 py-2 text-[10px] text-slate-500">
                        Loading tables...
                      </p>
                    )}
                    {seatingQuery.isError && (
                      <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-2 py-2 text-[10px] text-rose-100">
                        Unable to load restaurant seating.
                      </p>
                    )}
                    {seatingQuery.data?.map((floor) => (
                      <div key={floor.restaurantFloorId}>
                        <div className="mb-1 text-[10px] font-bold text-slate-400">
                          {floor.name}
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {floor.tables.map((table) => (
                            <button
                              key={table.restaurantTableId}
                              type="button"
                              disabled={
                                !canEditDraft ||
                                isDraftMutationPending ||
                                table.isOccupied
                              }
                              onClick={() => handleTableSelect(table)}
                              className={`rounded-lg border px-2 py-1.5 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-45 ${
                                effectiveRestaurantTableId ===
                                table.restaurantTableId
                                  ? "border-emerald-400 bg-emerald-500/15 text-emerald-100"
                                  : "border-white/10 bg-black/10 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              <span className="block truncate font-bold">
                                {table.code}
                              </span>
                              <span className="block truncate text-[9px] text-slate-500">
                                {table.isOccupied
                                  ? `${table.openSalesOrderCount} open`
                                  : table.name || "Available"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="min-h-36 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {!draftLines.length && (
                  <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-white/10 text-center">
                    <div>
                      <ShoppingCart
                        className="mx-auto mb-2 text-slate-600"
                        size={26}
                      />
                      <p className="text-xs text-slate-500">السلة فارغة</p>
                      <p className="mt-1 text-[10px] text-slate-600">
                        اختر المنتجات لإنشاء مسودة بيع حقيقية
                      </p>
                    </div>
                  </div>
                )}
                {draftLines.map((item) => (
                  <div
                    key={item.salesOrderLineId}
                    className="rounded-xl border border-white/7 bg-white/[0.025] p-2.5"
                  >
                    <div className="flex gap-2">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-sm font-black text-blue-300">
                        {item.productName.trim().slice(0, 1) || "#"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-100">
                          {item.productName}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-500">
                          {item.variantName}
                          {item.sku ? ` · ${item.sku}` : ""}
                        </div>
                        {item.modifiers.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.modifiers.map((modifier) => (
                              <span
                                key={`${item.salesOrderLineId}-${modifier.modifierOptionId}`}
                                className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-200"
                              >
                                {modifier.modifierOptionName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDraftLine(item.salesOrderLineId)}
                        disabled={!canEditDraft || isDraftMutationPending}
                        className="text-slate-500 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-white/10">
                        <button
                          type="button"
                          onClick={() => changeQty(item.salesOrderLineId, -1)}
                          disabled={!canEditDraft || isDraftMutationPending}
                          className="grid h-7 w-7 place-items-center text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-9 text-center text-xs font-bold">
                          {Number(item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(item.salesOrderLineId, 1)}
                          disabled={!canEditDraft || isDraftMutationPending}
                          className="grid h-7 w-7 place-items-center text-blue-300 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="text-xs font-bold">
                        {formatMoney(
                          item.lineSubtotalAmount,
                          draftOrder?.currencyCode || catalogCurrencyCode,
                          draftOrder?.currencyMinorUnitDigits || 2,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 max-h-[52vh] overflow-y-auto border-t border-white/10 pt-3 pr-1 scrollbar-none xl:max-h-none">
                <button
                  type="button"
                  onClick={() => setModal("discount")}
                  disabled={!canEditDraft || isDraftMutationPending}
                  className="mb-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-300 hover:border-pink-400/35 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Gift size={14} className="text-pink-300" />
                    خصم وعروض
                  </span>
                  <span className="font-bold text-pink-300">
                    {draftOrder?.discount
                      ? formatMoney(
                          draftOrder.discount.appliedAmount,
                          draftOrder.currencyCode,
                          draftOrder.currencyMinorUnitDigits,
                        )
                      : "إضافة"}
                  </span>
                </button>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>المجموع الفرعي</span>
                    <span>{formatMoney(subtotal, catalogCurrencyCode, 2)}</span>
                  </div>
                  <div className="flex justify-between text-pink-300">
                    <span>الخصم</span>
                    <span>- {formatMoney(discountValue, catalogCurrencyCode, 2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ضريبة القيمة المضافة 15%</span>
                    <span>{formatMoney(vat, catalogCurrencyCode, 2)}</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between border-t border-white/10 pt-2">
                    <span className="font-bold">الإجمالي</span>
                    <span className="text-2xl font-black text-blue-300">
                      {formatMoney(total, catalogCurrencyCode, 2)}
                    </span>
                  </div>
                </div>
                                {isConfirmedOrder && (
                  <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-black/10 p-3">
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <Metric
                        label="Paid"
                        value={formatMoney(
                          paymentState?.netPaidAmount ?? 0,
                          settlementCurrencyCode,
                          settlementMinorUnitDigits,
                        )}
                        tone="green"
                      />
                      <Metric
                        label="Refunded"
                        value={formatMoney(
                          paymentState?.refundedAmount ?? 0,
                          settlementCurrencyCode,
                          settlementMinorUnitDigits,
                        )}
                        tone="pink"
                      />
                      <Metric
                        label="Remaining"
                        value={formatMoney(
                          remainingAmount,
                          settlementCurrencyCode,
                          settlementMinorUnitDigits,
                        )}
                        tone={isFullyPaid ? "green" : "gold"}
                      />
                    </div>
                    {isFullyPaid && (
                      <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100">
                        Fully Paid
                      </div>
                    )}
                    {!paymentsReceivePermissionQuery.hasPermission && (
                      <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        Payments.Receive permission is required.
                      </div>
                    )}
                    {paymentsReceivePermissionQuery.hasPermission && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {paymentMethodsQuery.isLoading && (
                            <div className="col-span-2 rounded-lg bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                              Loading payment methods...
                            </div>
                          )}
                          {!paymentMethodsQuery.isLoading &&
                            paymentMethods.map((method) => {
                              const Icon = getPaymentMethodIcon(method.kind);

                              return (
                                <button
                                  type="button"
                                  key={method.paymentMethodId}
                                  onClick={() =>
                                    setSelectedPaymentMethodId(
                                      method.paymentMethodId,
                                    )
                                  }
                                  className={`rounded-xl border px-3 py-2 text-center transition ${
                                    selectedPaymentMethod?.paymentMethodId ===
                                    method.paymentMethodId
                                      ? "border-blue-400 bg-blue-500/15"
                                      : "border-white/10 bg-white/[0.025] hover:bg-white/10"
                                  }`}
                                >
                                  <Icon
                                    size={16}
                                    className={`mx-auto ${getPaymentMethodColor(
                                      method.kind,
                                    )}`}
                                  />
                                  <span className="mt-1 block truncate text-[10px] font-bold">
                                    {method.name}
                                  </span>
                                  <span className="text-[9px] text-slate-500">
                                    {method.code} · {method.kind}
                                  </span>
                                </button>
                              );
                            })}
                          {!paymentMethodsQuery.isLoading &&
                            paymentMethods.length === 0 && (
                              <div className="col-span-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                                No active payment methods available.
                              </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 p-2">
                          <CircleDollarSign
                            size={16}
                            className="text-emerald-300"
                          />
                          <input
                            type="text"
                            inputMode="decimal"
                            value={paymentAmountInput}
                            onChange={(event) =>
                              setPaymentAmountInput(event.target.value)
                            }
                            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                            placeholder="Payment amount"
                          />
                          <button
                            type="button"
                            disabled={!canReceivePayment}
                            onClick={receiveCurrentPayment}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Receive
                          </button>
                        </div>
                        {paymentAmountInput &&
                          (paymentAmount.error ||
                            paymentAmount.amount > remainingAmount) && (
                            <p className="text-[10px] text-amber-200">
                              {paymentAmount.error ||
                                "Payment amount exceeds remaining balance."}
                            </p>
                          )}
                      </>
                    )}
                    {paymentsViewPermissionQuery.hasPermission && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                          <ReceiptText size={13} />
                          Payments
                        </div>
                        {paymentHistoryQuery.isLoading && (
                          <div className="rounded-lg bg-white/[0.025] px-3 py-2 text-xs text-slate-400">
                            Loading payment history...
                          </div>
                        )}
                        {(paymentState?.payments || []).map((payment) => (
                          <div
                            key={payment.salesOrderPaymentId}
                            className="rounded-lg border border-white/10 bg-white/[0.025] p-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-xs font-bold text-slate-100">
                                  {payment.paymentMethod.name}
                                </div>
                                <div className="mt-0.5 text-[10px] text-slate-500">
                                  {payment.paymentMethod.code} ·{" "}
                                  {payment.paymentMethod.kind} ·{" "}
                                  {formatPaymentDate(payment.receivedAtUtc)}
                                </div>
                              </div>
                              <div className="text-right text-xs font-black text-emerald-300">
                                {formatMoney(
                                  payment.amount,
                                  payment.currencyCode,
                                  payment.currencyMinorUnitDigits,
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                              <span>
                                Refunded{" "}
                                {formatMoney(
                                  payment.refundedAmount,
                                  payment.currencyCode,
                                  payment.currencyMinorUnitDigits,
                                )}
                              </span>
                              <button
                                type="button"
                                disabled={
                                  payment.refundableAmount <= 0 ||
                                  !paymentsRefundPermissionQuery.hasPermission
                                }
                                onClick={() => openRefundModal(payment)}
                                className="rounded-lg border border-rose-400/25 px-2 py-1 font-bold text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Refund
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <IconButton
                    icon={PauseCircle}
                    label="حفظ مؤقت"
                    onClick={holdOrder}
                  />
                  <IconButton
                    icon={RotateCcw}
                    label="استرجاع"
                    onClick={() => setModal("retrieve")}
                  />
                  <IconButton
                    icon={CircleDollarSign}
                    label="حركة نقدية"
                    onClick={() => setModal("cashMovement")}
                  />
                </div>
                {isConfirmedOrder ? (
                  <button
                    type="button"
                    onClick={startNewOrder}
                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-700 text-sm font-black transition hover:bg-slate-600"
                  >
                    <Plus size={18} />
                    New Order
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!shiftOpen || !canConfirmOrder}
                    onClick={confirmCurrentOrder}
                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-[#0A84FF] text-sm font-black shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check size={19} />
                    Confirm Order · {formatMoney(total, catalogCurrencyCode, 2)}
                    <kbd className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
                      F1
                    </kbd>
                  </button>
                )}
              </div>
            </aside>
          </div>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#0c1627] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <WalletCards size={16} className="text-emerald-300" />
                  تحكم الكاشير
                </h3>
                <button
                  type="button"
                  onClick={() => setModal("closeShift")}
                  className="text-[10px] text-blue-300"
                >
                  إدارة الوردية
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Metric
                  label="النقدية المتوقعة"
                  value="4,625"
                  detail="SAR"
                  tone="green"
                />
                <Metric
                  label="النقدية الفعلية"
                  value={actualCash || "0"}
                  detail="SAR"
                  tone="gold"
                />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] p-2 text-[11px]">
                <span className="text-slate-400">فرق الصندوق</span>
                <span className="font-bold text-emerald-300">0.00 SAR</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0c1627] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Gift size={16} className="text-pink-300" />
                  العروض والخصومات
                </h3>
                <button
                  type="button"
                  onClick={() => setModal("promotions")}
                  className="text-[10px] text-pink-300"
                >
                  عرض الكل
                </button>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl border border-pink-400/20 bg-pink-500/10 p-2.5">
                  <div className="text-xs font-bold text-pink-100">
                    خصم عام 10%
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    حتى 31 مايو · كل المنتجات
                  </div>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-2.5">
                  <div className="text-xs font-bold text-amber-100">
                    اشترِ 2 مشروب وخذ 1 مجانًا
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    عرض الفئة · نشط الآن
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0c1627] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Database size={16} className="text-amber-300" />
                  ذكاء المخزون
                </h3>
                <button
                  type="button"
                  onClick={() => notify("تم فتح قائمة إعادة الطلب المقترحة.")}
                  className="text-[10px] text-amber-300"
                >
                  إعادة طلب
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">منتجات تحت حد الطلب</span>
                  <span className="font-bold text-amber-300">18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">قريبة الانتهاء</span>
                  <span className="font-bold text-rose-300">6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">منتجات راكدة</span>
                  <span className="font-bold text-blue-300">12</span>
                </div>
                <div className="mt-3 rounded-xl bg-amber-500/10 p-2 text-[10px] text-amber-100">
                  المياه وصلت إلى حد إعادة الطلب المقترح.
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0c1627] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Printer size={16} className="text-blue-300" />
                  مركز الأجهزة
                </h3>
                <button
                  type="button"
                  onClick={() => notify("تمت مزامنة حالة الأجهزة.")}
                  className="text-[10px] text-blue-300"
                >
                  مزامنة
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  [Printer, "الطابعة"],
                  [Barcode, "الباركود"],
                  [WalletCards, "الدفع"],
                  [Box, "درج النقد"],
                ].map(([Icon, label]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/8 bg-white/[0.025] p-2"
                  >
                    <Icon size={16} className="text-slate-300" />
                    <div className="mt-1 text-[10px]">{label}</div>
                    <div className="mt-0.5 text-[9px] text-emerald-300">
                      ● متصل
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-pink-400/20 bg-gradient-to-l from-pink-500/[0.11] to-[#0c1627] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-pink-100">
                  <Bot size={17} />
                  NOBO AI Retail Copilot
                </h3>
                <p className="mt-1 text-[11px] text-slate-400">
                  يكتشف → يشرح → يقترح. التنفيذ دائمًا بعد تأكيدك.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal("askAi")}
                className="rounded-xl border border-pink-400/30 bg-pink-500/15 px-3 py-2 text-xs font-bold text-pink-100 hover:bg-pink-500/25"
              >
                اسأل NOBO AI
              </button>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {insights
                .filter((item) => !aiDismissed.includes(item.id))
                .map(({ id, title, detail, action, icon: Icon }) => (
                  <div
                    key={id}
                    className="rounded-xl border border-pink-400/15 bg-[#10182a]/80 p-3"
                  >
                    <div className="flex gap-2">
                      <Icon
                        size={17}
                        className="mt-0.5 shrink-0 text-pink-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-pink-50">
                          {title}
                        </div>
                        <p className="mt-1 text-[10px] leading-4 text-slate-400">
                          {detail}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setModal("aiConfirm");
                        }}
                        className="rounded-lg bg-pink-500/20 px-2.5 py-1.5 text-[10px] font-bold text-pink-100"
                      >
                        {action}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAiDismissed((items) => [...items, id])
                        }
                        className="rounded-lg px-2 py-1.5 text-[10px] text-slate-400 hover:bg-white/10"
                      >
                        تجاهل
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
          </div>
        </PosOperationalGate>

        {toast && (
          <div className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-xl border border-blue-400/25 bg-[#10182a] px-4 py-3 text-xs font-bold text-blue-100 shadow-xl">
            {toast}
          </div>
        )}
        {modal === "variant" && selectedVariantProduct && (
          <Modal
            title="Select Variant"
            onClose={() => {
              setSelectedVariantProduct(null);
              setModal(null);
            }}
          >
            <div className="space-y-2">
              {selectedVariantProduct.variants.map((variant) => (
                <button
                  key={variant.productVariantId}
                  type="button"
                  onClick={() => {
                    selectVariantForDraft(variant);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 p-3 text-right transition hover:border-blue-400/50 hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-slate-100">
                      {variant.variantName}
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      {variant.sku}
                      {variant.modifierGroups.length
                        ? ` · ${variant.modifierGroups.length} modifier groups`
                        : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-black text-blue-300">
                    {formatMoney(variant.price, catalogCurrencyCode, 2)}
                  </span>
                </button>
              ))}
            </div>
          </Modal>
        )}
        {modal === "modifiers" && selectedModifierVariant && (
          <Modal
            title="Select Modifiers"
            onClose={() => {
              setSelectedModifierVariant(null);
              setModifierSelections({});
              setModal(null);
            }}
          >
            <div className="space-y-3">
              {selectedModifierVariant.modifierGroups.map((group) => (
                <div
                  key={group.modifierGroupId}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-100">
                      {group.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {group.minSelections}-{group.maxSelections}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {group.options.map((option) => {
                      const checked = (
                        modifierSelections[group.modifierGroupId] || []
                      ).includes(option.modifierOptionId);

                      return (
                        <button
                          key={option.modifierOptionId}
                          type="button"
                          onClick={() =>
                            toggleModifierOption(group, option.modifierOptionId)
                          }
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                            checked
                              ? "border-blue-400/60 bg-blue-500/15 text-blue-100"
                              : "border-white/10 bg-black/10 text-slate-300 hover:border-white/20"
                          }`}
                        >
                          <span>{option.name}</span>
                          <span className="font-bold text-slate-400">
                            {formatMoney(
                              option.amountAdjustment,
                              catalogCurrencyCode,
                              2,
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={
                !canEditDraft || !modifierSelectionIsValid || isDraftMutationPending
              }
              onClick={() => {
                addSellableVariant(
                  selectedModifierVariant,
                  selectedModifierOptionIds,
                );
                setModal(null);
              }}
              className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Draft
            </button>
          </Modal>
        )}
        {modal === "refundPayment" && refundDraft?.payment && (
          <Modal
            title="Refund Payment"
            onClose={() => {
              setRefundDraft(null);
              setModal(null);
            }}
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                <div className="text-xs font-bold text-slate-100">
                  {refundDraft.payment.paymentMethod.name}
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {refundDraft.payment.paymentMethod.code} آ·{" "}
                  {refundDraft.payment.paymentMethod.kind}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Metric
                  label="Original"
                  value={formatMoney(
                    refundDraft.payment.amount,
                    refundDraft.payment.currencyCode,
                    refundDraft.payment.currencyMinorUnitDigits,
                  )}
                  tone="blue"
                />
                <Metric
                  label="Refunded"
                  value={formatMoney(
                    refundDraft.payment.refundedAmount,
                    refundDraft.payment.currencyCode,
                    refundDraft.payment.currencyMinorUnitDigits,
                  )}
                  tone="pink"
                />
                <Metric
                  label="Refundable"
                  value={formatMoney(
                    refundDraft.payment.refundableAmount,
                    refundDraft.payment.currencyCode,
                    refundDraft.payment.currencyMinorUnitDigits,
                  )}
                  tone="gold"
                />
              </div>
              <label className="block text-xs text-slate-400">
                Refund amount
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={refundDraft.amount}
                onChange={(event) =>
                  setRefundDraft((draft) =>
                    draft ? { ...draft, amount: event.target.value } : draft,
                  )
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
              />
              <label className="block text-xs text-slate-400">Reason</label>
              <textarea
                value={refundDraft.reason}
                onChange={(event) =>
                  setRefundDraft((draft) =>
                    draft ? { ...draft, reason: event.target.value } : draft,
                  )
                }
                className="h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none"
              />
              <label className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-100">
                <input
                  type="checkbox"
                  checked={refundDraft.confirmation}
                  onChange={(event) =>
                    setRefundDraft((draft) =>
                      draft
                        ? { ...draft, confirmation: event.target.checked }
                        : draft,
                    )
                  }
                />
                Confirm money refund
              </label>
              <button
                type="button"
                disabled={
                  refundPaymentMutation.isPending ||
                  !paymentsRefundPermissionQuery.hasPermission
                }
                onClick={refundCurrentPayment}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Process Refund
              </button>
            </div>
          </Modal>
        )}
        {modal === "customer" && (
          <Modal title="اختيار عميل" onClose={() => setModal(null)}>
            <div className="space-y-2">
              {[
                "عميل زيارة",
                "شركة النور التجارية",
                "عميل VIP · محمد العتيبي",
              ].map((name, index) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setCustomer({ name, id: `CUST-00${index + 1}` });
                    setModal(null);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 p-3 text-right hover:border-blue-400/50 hover:bg-blue-500/10"
                >
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <UserRound size={15} className="text-blue-300" />
                    {name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    CUST-00{index + 1}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomer({ name: "عميل جديد", id: "CUST-NEW" });
                setModal(null);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold"
            >
              <Plus size={15} />
              إنشاء عميل جديد
            </button>
          </Modal>
        )}
        {modal === "discount" && (
          <Modal title="Draft Discount" onClose={() => setModal(null)}>
            <label className="block text-xs text-slate-400">
              Percentage discount
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
              <input
                type="number"
                min="1"
                max="100"
                value={discountInput}
                onChange={(event) => setDiscountInput(event.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <span className="text-slate-400">%</span>
            </div>
            {!discountPermissionQuery.hasPermission && (
              <p className="mt-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                SalesOrders.ApplyDiscount permission is required.
              </p>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[5, 10, 15].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setDiscountInput(String(value))}
                  className="rounded-xl border border-pink-400/20 bg-pink-500/10 py-2 text-xs text-pink-100"
                >
                  {value}%
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={applyDraftDiscount}
              disabled={
                !canEditDraft ||
                isDraftMutationPending ||
                !discountPermissionQuery.hasPermission
              }
              className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Discount
            </button>
          </Modal>
        )}
        {modal === "retrieve" && (
          <Modal title="Held Drafts" onClose={() => setModal(null)}>
            <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
              Draft retrieval is not integrated yet.
            </p>
          </Modal>
        )}
        {modal === "cashMovement" && (
          <Modal title="حركة نقدية" onClose={() => setModal(null)}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => notify("تم فتح نموذج إضافة نقدية مع سجل تدقيق.")}
                className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-100"
              >
                Paid In
                <br />
                <span className="text-[10px] font-normal text-emerald-300">
                  إضافة نقدية
                </span>
              </button>
              <button
                type="button"
                onClick={() => notify("تم فتح نموذج إخراج نقدية ويتطلب سببًا.")}
                className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-xs font-bold text-amber-100"
              >
                Paid Out
                <br />
                <span className="text-[10px] font-normal text-amber-300">
                  إخراج نقدية
                </span>
              </button>
            </div>
          </Modal>
        )}
        {modal === "promotions" && (
          <Modal title="Promotions Engine" onClose={() => setModal(null)}>
            <div className="space-y-2 text-xs">
              <div className="rounded-xl border border-pink-400/20 bg-pink-500/10 p-3">
                <b>خصم 10% عام</b>
                <p className="mt-1 text-slate-400">
                  نشط · كل المنتجات · ينتهي 31 مايو
                </p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                <b>اشترِ 2 وخذ 1 مجانًا</b>
                <p className="mt-1 text-slate-400">
                  المشروبات · أولوية أقل من خصم العميل
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => notify("تم فتح معالج إنشاء عرض جديد.")}
              className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold"
            >
              إنشاء عرض جديد
            </button>
          </Modal>
        )}
        {modal === "openShift" && (
          <Modal title="فتح وردية جديدة" onClose={() => setModal(null)}>
            <p className="text-xs leading-5 text-slate-400">
              سيتم تسجيل رصيد افتتاحي للكاشير أحمد محمد على POS-01.
            </p>
            <input
              type="number"
              defaultValue="1500"
              className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setShiftOpen(true);
                setModal(null);
                notify("تم فتح الوردية وتسجيل الرصيد الافتتاحي.");
              }}
              className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold"
            >
              تأكيد فتح الوردية
            </button>
          </Modal>
        )}
        {modal === "closeShift" && (
          <Modal title="إغلاق الوردية" onClose={() => setModal(null)}>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="النقدية المتوقعة" value="4,625 SAR" tone="green" />
              <Metric
                label="النقدية الفعلية"
                value={`${actualCash || 0} SAR`}
                tone="gold"
              />
            </div>
            <label className="mt-4 block text-xs text-slate-400">
              النقدية الفعلية بعد العد
            </label>
            <input
              type="number"
              value={actualCash}
              onChange={(event) => setActualCash(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setShiftOpen(false);
                setModal(null);
                notify("تم إغلاق الوردية وحفظ تقرير الصندوق.");
              }}
              className="mt-4 w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold"
            >
              تأكيد إغلاق الوردية
            </button>
          </Modal>
        )}
        {modal === "askAi" && (
          <Modal title="اسأل NOBO AI" onClose={() => setModal(null)}>
            <textarea
              className="h-28 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none"
              placeholder="مثال: اقترح عرضًا على المشروبات الراكدة..."
            />
            <button
              type="button"
              onClick={() => {
                setModal(null);
                notify("تم إرسال سؤالك إلى NOBO AI.");
              }}
              className="mt-3 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold"
            >
              إرسال السؤال
            </button>
          </Modal>
        )}
        {modal === "aiConfirm" && (
          <Modal title="تأكيد الإجراء المقترح" onClose={() => setModal(null)}>
            <div className="rounded-xl border border-pink-400/20 bg-pink-500/10 p-3 text-xs leading-5 text-pink-50">
              <ShieldCheck size={17} className="mb-2 text-pink-300" />
              NOBO AI لا ينفذ أي عملية حساسة تلقائيًا. راجع الإجراء ثم أكده
              ليتم فتح الشاشة المناسبة.
            </div>
            <button
              type="button"
              onClick={() => {
                setModal(null);
                notify("تم تأكيد الاقتراح وفتح الإجراء المرتبط.");
              }}
              className="mt-4 w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold"
            >
              تأكيد ومتابعة
            </button>
          </Modal>
        )}
      </main>
    </AppLayout>
  );
}
