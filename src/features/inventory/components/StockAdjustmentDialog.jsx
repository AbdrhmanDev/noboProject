import { useMemo, useState } from "react";
import { ArrowRight, CircleCheck } from "lucide-react";
import { useActiveUnitsOfMeasure } from "../../catalog/hooks/useCatalog";
import {
  useInventoryLocationStock,
  usePostManualStockAdjustment,
} from "../hooks/useInventory";
import { parseNonZeroQuantity } from "../utils/inventoryQuantity";
import { InventoryModal } from "./InventoryModal";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

export function StockAdjustmentDialog({
  companyId,
  branchId,
  locations,
  items,
  initialLocationId,
  initialInventoryItemId,
  onClose,
  onSuccess,
}) {
  const [locationId, setLocationId] = useState(initialLocationId || "");
  const [inventoryItemId, setInventoryItemId] = useState(initialInventoryItemId || "");
  const [quantityInput, setQuantityInput] = useState("");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState("form");
  const [formError, setFormError] = useState("");

  const unitsOfMeasureQuery = useActiveUnitsOfMeasure();
  const stockQuery = useInventoryLocationStock(
    companyId,
    branchId,
    locationId,
    Boolean(locationId),
  );
  const adjustMutation = usePostManualStockAdjustment(companyId, branchId, locationId);

  const uomAllowsFractional = useMemo(() => {
    const map = new Map((unitsOfMeasureQuery.data || []).map((uom) => [uom.id, uom]));
    return (unitOfMeasureId) => map.get(unitOfMeasureId)?.allowsFractionalQuantity ?? true;
  }, [unitsOfMeasureQuery.data]);

  const selectedItem = items.find((item) => item.inventoryItemId === inventoryItemId) || null;
  const selectedLocation = locations.find((location) => location.inventoryLocationId === locationId) || null;
  const currentStockEntry =
    stockQuery.data?.items.find((item) => item.inventoryItemId === inventoryItemId) || null;

  const parsedQuantity = selectedItem
    ? parseNonZeroQuantity(quantityInput, uomAllowsFractional(selectedItem.baseUnitOfMeasure.id))
    : { amount: null, error: "" };

  const goToConfirm = () => {
    if (!locationId) {
      setFormError("Select an inventory location.");
      return;
    }

    if (!inventoryItemId) {
      setFormError("Select an inventory item.");
      return;
    }

    if (quantityInput.trim() && parsedQuantity.error) {
      setFormError(parsedQuantity.error);
      return;
    }

    if (parsedQuantity.amount === null) {
      setFormError(parsedQuantity.error || "Enter a valid adjustment quantity.");
      return;
    }

    if (reason.trim().length > 500) {
      setFormError("Reason must be 500 characters or fewer.");
      return;
    }

    setFormError("");
    setStep("confirm");
  };

  const submitAdjustment = async () => {
    if (parsedQuantity.amount === null) return;

    try {
      await adjustMutation.mutateAsync({
        reason: reason.trim() || null,
        lines: [{ inventoryItemId, quantityDelta: parsedQuantity.amount }],
      });
      onSuccess("Stock adjustment recorded.");
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error));
      setStep("form");
    }
  };

  const currentQuantity = currentStockEntry ? Number(currentStockEntry.quantityOnHand) : 0;
  const expectedQuantity =
    parsedQuantity.amount !== null ? currentQuantity + parsedQuantity.amount : currentQuantity;

  return (
    <InventoryModal title="Adjust Stock" onClose={onClose}>
      {formError && (
        <div className="mb-3 rounded-xl border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {formError}
        </div>
      )}

      {step === "form" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            goToConfirm();
          }}
          className="space-y-3"
        >
          <label className="block text-sm font-semibold text-muted">
            Inventory location
            <select
              value={locationId}
              onChange={(event) => {
                setLocationId(event.target.value);
                setFormError("");
              }}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
            >
              <option value="">Select location...</option>
              {locations.map((location) => (
                <option key={location.inventoryLocationId} value={location.inventoryLocationId}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-muted">
            Inventory item
            <select
              value={inventoryItemId}
              onChange={(event) => {
                setInventoryItemId(event.target.value);
                setFormError("");
              }}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
            >
              <option value="">Select item...</option>
              {items.map((item) => (
                <option key={item.inventoryItemId} value={item.inventoryItemId}>
                  {item.name} ({item.baseUnitOfMeasure.symbol})
                </option>
              ))}
            </select>
          </label>

          {locationId && inventoryItemId && (
            <div className="rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted">
              {stockQuery.isLoading ? (
                "Loading current stock..."
              ) : currentStockEntry ? (
                <>
                  Current stock:{" "}
                  <span className="font-bold text-ink">
                    {currentStockEntry.quantityOnHand} {currentStockEntry.baseUnitOfMeasure.symbol}
                  </span>
                </>
              ) : (
                "Not yet tracked at this location (treated as 0)."
              )}
            </div>
          )}

          <label className="block text-sm font-semibold text-muted">
            Quantity delta (+/-)
            <input
              type="text"
              inputMode="decimal"
              value={quantityInput}
              onChange={(event) => {
                setQuantityInput(event.target.value);
                setFormError("");
              }}
              placeholder="e.g. 10 or -3"
              className="mt-1 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent-line"
            />
            <span className="mt-1 block text-xs font-normal text-subtle">
              Positive adds stock, negative removes stock.
            </span>
          </label>

          <label className="block text-sm font-semibold text-muted">
            Reason (optional)
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              className="mt-1 h-20 w-full rounded-xl border border-line bg-canvas p-3 text-sm text-ink outline-none focus:border-accent-line"
            />
          </label>

          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-white transition hover:brightness-110"
          >
            Review adjustment
            <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2 rounded-xl border border-line bg-raised p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-subtle">Item</span>
              <span className="font-bold text-ink">{selectedItem?.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-subtle">Location</span>
              <span className="font-bold text-ink">{selectedLocation?.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-subtle">Current stock</span>
              <span className="font-bold text-ink">
                {currentStockEntry
                  ? `${currentStockEntry.quantityOnHand} ${currentStockEntry.baseUnitOfMeasure.symbol}`
                  : `Not tracked yet (0 ${selectedItem?.baseUnitOfMeasure.symbol || ""})`}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-subtle">Adjustment</span>
              <span
                className={`font-bold ${parsedQuantity.amount > 0 ? "text-success" : "text-danger"}`}
              >
                {parsedQuantity.amount > 0 ? "+" : ""}
                {parsedQuantity.amount} {selectedItem?.baseUnitOfMeasure.symbol}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-2">
              <span className="text-subtle">Expected result</span>
              <span className="font-bold text-accent">
                {expectedQuantity} {selectedItem?.baseUnitOfMeasure.symbol}
              </span>
            </div>
            {reason.trim() && (
              <div className="border-t border-line pt-2">
                <span className="text-subtle">Reason</span>
                <p className="mt-1 text-muted">{reason.trim()}</p>
              </div>
            )}
            <p className="text-xs text-subtle">
              Expected result is informational only; the server balance is authoritative.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("form")}
              disabled={adjustMutation.isPending}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-line bg-raised text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={submitAdjustment}
              disabled={adjustMutation.isPending}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-success text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CircleCheck size={16} />
              {adjustMutation.isPending ? "Saving..." : "Confirm adjustment"}
            </button>
          </div>
        </div>
      )}
    </InventoryModal>
  );
}
