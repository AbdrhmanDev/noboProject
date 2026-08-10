export type ApiValidationErrors = Record<string, string[]>;

export type ApiError = {
  status?: number;
  code?: string;
  message: string;
  validationErrors?: ApiValidationErrors;
  raw?: unknown;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function normalizeValidationErrors(value: unknown): ApiValidationErrors | undefined {
  if (!isRecord(value)) return undefined;

  const normalized: ApiValidationErrors = {};

  for (const [key, entry] of Object.entries(value)) {
    if (Array.isArray(entry)) {
      normalized[key] = entry.map(String);
    } else if (typeof entry === "string") {
      normalized[key] = [entry];
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function getString(data: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }

  return undefined;
}

function getProblemError(data: UnknownRecord, key: "code" | "message"): string | undefined {
  const errors = data.errors;
  if (!Array.isArray(errors)) return undefined;

  for (const entry of errors) {
    if (isRecord(entry)) {
      const value = entry[key];
      if (typeof value === "string" && value.trim().length > 0) return value;
    }
  }

  return undefined;
}

export function normalizeApiError(error: unknown): ApiError {
  if (isRecord(error) && isRecord(error.response)) {
    const response = error.response;
    const data = response.data;
    const status = typeof response.status === "number" ? response.status : undefined;

    if (isRecord(data)) {
      return {
        status,
        code: getString(data, ["code", "errorCode", "type"]) || getProblemError(data, "code"),
        message:
          getProblemError(data, "message") ||
          getString(data, ["message", "detail", "title", "error"]) ||
          "Request failed.",
        validationErrors: normalizeValidationErrors(data.errors),
        raw: data,
      };
    }

    return {
      status,
      message: typeof data === "string" && data ? data : "Request failed.",
      raw: data,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || "Unexpected error.",
      raw: error,
    };
  }

  return {
    message: "Unexpected error.",
    raw: error,
  };
}
