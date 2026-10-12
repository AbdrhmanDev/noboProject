import { env } from "../../../app/config/env";
import type { ScaleReading, ScaleReadingStatus } from "../types/scaleReading.types";

// Variable-Weight Products Phase F.4: a deliberately separate, minimal client for the Edge
// Agent's local scale bridge (Phase F.3) -- NOT the shared `httpClient` axios instance, which
// attaches the backend's own Bearer token and cookies (see shared/api/httpClient.ts). The bridge
// is a different local process on a different origin/port; it must never receive the backend
// session, and nothing here ever sends credentials or an Authorization header.

const REQUEST_TIMEOUT_MS = 1500;

export type ScaleBridgeFailureReason =
  // The bridge integration itself is off (env.features.scaleBridgeEnabled is false, or this
  // isn't a SelfHosted deployment) -- not a runtime failure, just "not applicable here".
  | "disabled"
  // Could not reach the bridge at all (not running, CORS rejection, DNS/connection failure).
  | "network"
  // The bridge didn't answer within REQUEST_TIMEOUT_MS.
  | "timeout"
  // The bridge answered, but the body wasn't valid JSON or didn't match the expected shape --
  // never trusted just because it came from localhost.
  | "malformed";

export type ScaleBridgeResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: ScaleBridgeFailureReason };

type RawScaleReading = {
  sourceId?: unknown;
  sourceType?: unknown;
  status?: unknown;
  value?: unknown;
  unit?: unknown;
  readAtUtc?: unknown;
  notes?: unknown;
};

const VALID_STATUSES: ScaleReadingStatus[] = ["Stable", "Unstable", "Stale", "Malformed", "Disconnected"];

// Strict shape validation of whatever the bridge returned -- every field is checked for both
// presence and type before anything is trusted as a real ScaleReading. Returns null (never
// throws) for anything that doesn't match exactly; callers must treat null the same as "no
// usable reading", not attempt a partial/best-effort interpretation.
function parseScaleReading(raw: unknown): ScaleReading | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawScaleReading;

  if (typeof candidate.sourceId !== "string") return null;
  if (typeof candidate.sourceType !== "string") return null;
  if (typeof candidate.status !== "string" || !VALID_STATUSES.includes(candidate.status as ScaleReadingStatus)) return null;
  if (candidate.value !== null && typeof candidate.value !== "number") return null;
  if (candidate.unit !== null && candidate.unit !== undefined && typeof candidate.unit !== "string") return null;
  if (typeof candidate.readAtUtc !== "string" || Number.isNaN(Date.parse(candidate.readAtUtc))) return null;
  if (candidate.notes !== undefined && candidate.notes !== null && typeof candidate.notes !== "string") return null;

  return {
    sourceId: candidate.sourceId,
    sourceType: candidate.sourceType,
    status: candidate.status as ScaleReadingStatus,
    value: (candidate.value as number | null) ?? null,
    unit: (candidate.unit as string | null | undefined) ?? null,
    readAtUtc: candidate.readAtUtc,
    notes: (candidate.notes as string | null | undefined) ?? null,
  };
}

async function fetchJson(path: string): Promise<ScaleBridgeResult<unknown>> {
  if (!env.features.scaleBridgeEnabled) return { ok: false, reason: "disabled" };

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.scaleBridge.baseUrl}${path}`, {
      method: "GET",
      // Never the backend session, never any cookie the bridge has no business seeing.
      credentials: "omit",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) return { ok: false, reason: "network" };

    try {
      const data = await response.json();
      return { ok: true, data };
    } catch {
      return { ok: false, reason: "malformed" };
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function getScaleBridgeHealth(): Promise<ScaleBridgeResult<{ status: string }>> {
  const result = await fetchJson("/health");
  if (!result.ok) return result;

  const data = result.data as { status?: unknown };
  if (typeof data?.status !== "string") return { ok: false, reason: "malformed" };

  return { ok: true, data: { status: data.status } };
}

export async function getScaleBridgeStatus(): Promise<
  ScaleBridgeResult<{ readerConfigured: boolean; sourceType: string | null }>
> {
  const result = await fetchJson("/api/scale/v1/status");
  if (!result.ok) return result;

  const data = result.data as { readerConfigured?: unknown; sourceType?: unknown };
  if (typeof data?.readerConfigured !== "boolean") return { ok: false, reason: "malformed" };
  if (data.sourceType !== null && data.sourceType !== undefined && typeof data.sourceType !== "string") {
    return { ok: false, reason: "malformed" };
  }

  return { ok: true, data: { readerConfigured: data.readerConfigured, sourceType: (data.sourceType as string | null) ?? null } };
}

export async function getScaleBridgeLatestReading(): Promise<
  ScaleBridgeResult<{ readerConfigured: boolean; reading: ScaleReading | null }>
> {
  const result = await fetchJson("/api/scale/v1/latest");
  if (!result.ok) return result;

  const data = result.data as { readerConfigured?: unknown; reading?: unknown };
  if (typeof data?.readerConfigured !== "boolean") return { ok: false, reason: "malformed" };

  if (data.reading === null || data.reading === undefined) {
    return { ok: true, data: { readerConfigured: data.readerConfigured, reading: null } };
  }

  const reading = parseScaleReading(data.reading);
  if (reading === null) return { ok: false, reason: "malformed" };

  return { ok: true, data: { readerConfigured: data.readerConfigured, reading } };
}
