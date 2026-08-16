import { useCallback, useEffect, useRef, useState } from "react";

const QUANTITY_COALESCE_DELAY_MS = 280;

/**
 * Owns cart-line quantity/remove edits for the current draft order.
 *
 * The backend's update-draft endpoint fully rebuilds the line set from
 * whatever array it is given (no per-line delta/id semantics) and enforces
 * optimistic concurrency via `expectedDraftVersion`. Firing one request per
 * click both feels slow (every + waits on a round-trip) and is race-prone
 * (two overlapping requests built from the same stale version conflict).
 *
 * This hook fixes both: quantity changes are applied to the UI immediately,
 * rapid clicks on the same line are coalesced into a single request after a
 * short pause, and every actual network commit (quantity or remove) is
 * serialized through one queue that always reads the latest known draft
 * version — so a remove can never race a queued quantity change, and vice
 * versa. On a version conflict the draft is refetched once and the same
 * commit is retried before surfacing an error.
 */
export function useDraftLineEditor({
  draftOrder,
  canEditDraft,
  mapDraftLinesToRequest,
  commitDraftLines,
  refetchDraft,
  onRequiresAtLeastOneLine,
  onCommitError,
}) {
  const [, setRenderTick] = useState(0);
  const rerender = useCallback(() => setRenderTick((tick) => tick + 1), []);

  const draftRef = useRef(draftOrder);
  const desiredQuantitiesRef = useRef({});
  const removedLineIdsRef = useRef(new Set());
  const timersRef = useRef({});
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    draftRef.current = draftOrder;
    const lines = draftOrder?.lines ?? [];
    let changed = false;

    Object.keys(desiredQuantitiesRef.current).forEach((lineId) => {
      const line = lines.find((candidate) => candidate.salesOrderLineId === lineId);
      if (!line || Number(line.quantity) === Number(desiredQuantitiesRef.current[lineId])) {
        delete desiredQuantitiesRef.current[lineId];
        changed = true;
      }
    });

    Array.from(removedLineIdsRef.current).forEach((lineId) => {
      if (!lines.some((line) => line.salesOrderLineId === lineId)) {
        removedLineIdsRef.current.delete(lineId);
        changed = true;
      }
    });

    if (changed) rerender();
  }, [draftOrder, rerender]);

  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    },
    [],
  );

  const getDisplayLines = useCallback(() => {
    const lines = draftOrder?.lines ?? [];
    return lines
      .filter((line) => !removedLineIdsRef.current.has(line.salesOrderLineId))
      .map((line) => {
        const desired = desiredQuantitiesRef.current[line.salesOrderLineId];
        return desired === undefined ? line : { ...line, quantity: desired };
      });
  }, [draftOrder]);

  const isLinePending = useCallback(
    (salesOrderLineId) =>
      desiredQuantitiesRef.current[salesOrderLineId] !== undefined ||
      removedLineIdsRef.current.has(salesOrderLineId) ||
      Boolean(timersRef.current[salesOrderLineId]),
    [],
  );

  const hasPendingEdits = useCallback(
    () =>
      Object.keys(desiredQuantitiesRef.current).length > 0 ||
      removedLineIdsRef.current.size > 0 ||
      Object.keys(timersRef.current).length > 0,
    [],
  );

  const enqueue = useCallback(
    (buildRequestLines, rollback) => {
      const run = async () => {
        const requestLines = buildRequestLines();
        if (!requestLines) return;

        try {
          const fresh = await commitDraftLines(requestLines, draftRef.current);
          if (fresh) draftRef.current = fresh;
        } catch (error) {
          if (error?.code === "SalesOrder.DraftVersionConflict") {
            try {
              const refreshed = await refetchDraft?.();
              if (refreshed) draftRef.current = refreshed;

              const retryLines = buildRequestLines();
              if (!retryLines) return;

              const fresh = await commitDraftLines(retryLines, draftRef.current);
              if (fresh) draftRef.current = fresh;
              return;
            } catch (retryError) {
              rollback?.();
              onCommitError?.(retryError, requestLines);
              return;
            }
          }

          rollback?.();
          onCommitError?.(error, requestLines);
        }
      };

      queueRef.current = queueRef.current.then(run, run);
      return queueRef.current;
    },
    [commitDraftLines, onCommitError, refetchDraft],
  );

  const buildRequestLinesForQuantity = useCallback(
    (salesOrderLineId) => {
      const baseLines = draftRef.current?.lines ?? [];
      const index = baseLines.findIndex((line) => line.salesOrderLineId === salesOrderLineId);
      if (index < 0) return null;

      const requestLines = mapDraftLinesToRequest(baseLines);
      const desiredQuantity =
        desiredQuantitiesRef.current[salesOrderLineId] ?? Number(baseLines[index].quantity);

      if (desiredQuantity <= 0) {
        requestLines.splice(index, 1);
        if (!requestLines.length) {
          onRequiresAtLeastOneLine?.();
          return null;
        }
        return requestLines;
      }

      requestLines[index] = { ...requestLines[index], quantity: desiredQuantity };
      return requestLines;
    },
    [mapDraftLinesToRequest, onRequiresAtLeastOneLine],
  );

  const changeQuantity = useCallback(
    (salesOrderLineId, delta) => {
      if (!canEditDraft) return;

      const baseLines = draftRef.current?.lines ?? [];
      const line = baseLines.find((candidate) => candidate.salesOrderLineId === salesOrderLineId);
      if (!line) return;

      const base = desiredQuantitiesRef.current[salesOrderLineId] ?? Number(line.quantity);
      const next = Math.max(base + delta, 0);
      desiredQuantitiesRef.current[salesOrderLineId] = next;
      rerender();

      if (timersRef.current[salesOrderLineId]) {
        clearTimeout(timersRef.current[salesOrderLineId]);
      }

      timersRef.current[salesOrderLineId] = setTimeout(() => {
        delete timersRef.current[salesOrderLineId];
        rerender();
        enqueue(
          () => buildRequestLinesForQuantity(salesOrderLineId),
          () => {
            delete desiredQuantitiesRef.current[salesOrderLineId];
            rerender();
          },
        );
      }, QUANTITY_COALESCE_DELAY_MS);
    },
    [buildRequestLinesForQuantity, canEditDraft, enqueue, rerender],
  );

  const removeLine = useCallback(
    (salesOrderLineId) => {
      if (!canEditDraft) return;

      if (timersRef.current[salesOrderLineId]) {
        clearTimeout(timersRef.current[salesOrderLineId]);
        delete timersRef.current[salesOrderLineId];
      }

      delete desiredQuantitiesRef.current[salesOrderLineId];
      removedLineIdsRef.current.add(salesOrderLineId);
      rerender();

      enqueue(
        () => {
          const baseLines = draftRef.current?.lines ?? [];
          const index = baseLines.findIndex(
            (line) => line.salesOrderLineId === salesOrderLineId,
          );
          if (index < 0) return null;

          const requestLines = mapDraftLinesToRequest(baseLines);
          requestLines.splice(index, 1);

          if (!requestLines.length) {
            removedLineIdsRef.current.delete(salesOrderLineId);
            rerender();
            onRequiresAtLeastOneLine?.();
            return null;
          }

          return requestLines;
        },
        () => {
          removedLineIdsRef.current.delete(salesOrderLineId);
          rerender();
        },
      );
    },
    [canEditDraft, enqueue, mapDraftLinesToRequest, onRequiresAtLeastOneLine, rerender],
  );

  return { getDisplayLines, changeQuantity, removeLine, isLinePending, hasPendingEdits };
}
