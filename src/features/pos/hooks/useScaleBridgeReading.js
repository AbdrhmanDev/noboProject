import { useEffect, useRef, useState } from "react";
import { env } from "../../../app/config/env";
import { getScaleBridgeLatestReading } from "../api/scaleBridgeApi";

// Variable-Weight Products Phase F.4: polls the Edge Agent's real local scale bridge (Phase F.3)
// ONLY while `active` is true (the weight-entry dialog is open) -- never elsewhere in the POS,
// and the polling loop is torn down the instant `active` goes false or the component unmounts.
// A conservative 1-second interval: frequent enough that a cashier watching the dialog sees an
// update promptly, far from aggressive enough to be a real load concern for a single local GET.
const POLL_INTERVAL_MS = 1000;

// bridgeState shapes:
//   { kind: "disabled" }                                  -- integration off (flag/deployment mode)
//   { kind: "connecting" }                                -- first poll of this active cycle not back yet
//   { kind: "unavailable", reason }                        -- network/timeout/malformed error
//   { kind: "noReader" }                                   -- bridge reachable, no reader configured
//   { kind: "reading", reading }                           -- bridge reachable, reader configured
// `reading` (when kind is "reading") is the raw ScaleReading from the bridge, or null if the
// reader hasn't produced one yet -- callers apply isUsableScaleReading/isFreshScaleReading/
// convertScaleReadingValue themselves (Phase F.2), exactly as the simulator path already does,
// so there is only ever ONE validation system for a reading regardless of its source. Note: on
// reopening the dialog, the very last reading from the previous open may flash briefly before the
// first new poll lands (well under a second locally) -- harmless, since its own `readAtUtc` is
// what the freshness check judges, not when this hook happened to re-render it.
export function useScaleBridgeReading(active) {
  const enabled = env.features.scaleBridgeEnabled;
  // null means "no poll result yet this active cycle" -- rendered as "connecting" below. Every
  // actual state transition is set from inside the async poll() callback, never synchronously in
  // the effect body itself.
  const [pollState, setPollState] = useState(null);
  const generationRef = useRef(0);

  useEffect(() => {
    if (!active || !enabled) {
      generationRef.current += 1;
      return undefined;
    }

    let cancelled = false;
    let inFlight = false;
    generationRef.current += 1;
    const generation = generationRef.current;

    const poll = async () => {
      // Never overlap requests -- if the previous poll hasn't returned yet (a slow/unresponsive
      // bridge), skip this tick rather than piling up concurrent fetches.
      if (inFlight || cancelled) return;
      inFlight = true;

      const result = await getScaleBridgeLatestReading();

      // Ignore a result from a poll loop that's no longer the current one (a stale closure from
      // a previous `active` cycle resolving late) -- `generation` guards against ever applying
      // an obsolete response on top of a newer cycle's state.
      if (cancelled || generation !== generationRef.current) {
        inFlight = false;
        return;
      }

      if (!result.ok) {
        // A failed request invalidates whatever reading was previously shown -- never left as a
        // stale-but-still-displayed "last known good" value.
        setPollState({ kind: "unavailable", reason: result.reason });
      } else if (!result.data.readerConfigured) {
        setPollState({ kind: "noReader" });
      } else {
        setPollState({ kind: "reading", reading: result.data.reading });
      }

      inFlight = false;
    };

    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [active, enabled]);

  if (!active || !enabled) return { kind: "disabled" };
  if (pollState === null) return { kind: "connecting" };
  return pollState;
}
