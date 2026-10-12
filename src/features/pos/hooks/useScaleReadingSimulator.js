import { useCallback, useState } from "react";

// Variable-Weight Products Phase F.2: development-only simulator state for the POS weight-entry
// dialog. This is pure React state -- it never attaches a keyboard/DOM listener and never
// dispatches a synthetic keyboard event, so it cannot interact with (or be mistaken for)
// useKeyboardWedgeScanner's real burst-detection listener in any way. Callers must gate rendering
// of any UI built on this hook behind env.features.scaleSimulatorEnabled themselves -- this hook
// has no opinion of its own about whether the simulator should be visible.
//
// "Simulated source labels and behaviors only" -- this never claims to exercise a real device
// protocol; it only lets a developer manually script a ScaleReading (see scaleReading.types.ts)
// to drive the same UI a real adapter would eventually feed.
export function useScaleReadingSimulator() {
  const [sourceType, setSourceType] = useState("KeyboardEmulation");
  const [sampleValue, setSampleValue] = useState("1.350");
  const [sampleUnit, setSampleUnit] = useState("KG");
  const [status, setStatus] = useState("Disconnected");
  const [reading, setReading] = useState(null);

  const emit = useCallback(
    (nextStatus) => {
      setStatus(nextStatus);

      if (nextStatus === "Disconnected") {
        setReading({
          sourceId: "simulator",
          sourceType,
          status: "Disconnected",
          value: null,
          unit: null,
          readAtUtc: new Date().toISOString(),
        });
        return;
      }

      if (nextStatus === "Malformed") {
        setReading({
          sourceId: "simulator",
          sourceType,
          status: "Malformed",
          value: null,
          unit: null,
          readAtUtc: new Date().toISOString(),
          notes: "Simulated unparseable reading.",
        });
        return;
      }

      if (nextStatus === "Stale") {
        // A reading from well outside any reasonable freshness window, so
        // isFreshScaleReading rejects it regardless of its own Status -- lets the dialog's
        // staleness check be exercised independently of the "Stale" status value itself.
        setReading({
          sourceId: "simulator",
          sourceType,
          status: "Stable",
          value: Number(sampleValue) || null,
          unit: sampleUnit,
          readAtUtc: new Date(Date.now() - 60_000).toISOString(),
        });
        return;
      }

      // Stable or Unstable: an otherwise-plausible reading carrying whatever sample value/unit
      // is currently configured.
      setReading({
        sourceId: "simulator",
        sourceType,
        status: nextStatus,
        value: Number(sampleValue) || null,
        unit: sampleUnit,
        readAtUtc: new Date().toISOString(),
      });
    },
    [sampleUnit, sampleValue, sourceType],
  );

  return {
    sourceType,
    setSourceType,
    sampleValue,
    setSampleValue,
    sampleUnit,
    setSampleUnit,
    status,
    reading,
    simulateStable: useCallback(() => emit("Stable"), [emit]),
    simulateUnstable: useCallback(() => emit("Unstable"), [emit]),
    simulateDisconnected: useCallback(() => emit("Disconnected"), [emit]),
    simulateMalformed: useCallback(() => emit("Malformed"), [emit]),
    simulateStale: useCallback(() => emit("Stale"), [emit]),
  };
}
