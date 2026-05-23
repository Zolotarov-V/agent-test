const PRODUCTION_API_HOST =
  "https://agent-test-idwz.onrender.com"

/**
 * Normalize API base to exactly one `/api` suffix (never `/api/api`).
 * Empty or "/api" → relative `/api` (same-origin; pair with Vercel `/api` proxy).
 */
export function normalizeApiBaseUrl(raw) {
  const trimmed = (raw ?? "").trim()

  if (trimmed === "" || trimmed === "/api" || trimmed === "/api/") {
    return "/api"
  }

  if (trimmed.startsWith("/")) {
    const path = trimmed.replace(/\/+$/, "") || "/api"
    return path.replace(/(\/api)+$/i, "/api")
  }

  let base = trimmed.replace(/\/+$/, "")
  base = base.replace(/(\/api)+$/i, "")
  return `${base}/api`
}

function defaultApiEnvValue() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  if (import.meta.env.DEV) {
    return "http://127.0.0.1:8000"
  }
  return ""
}

export const API_URL = normalizeApiBaseUrl(defaultApiEnvValue())

/** Absolute URL for a path segment (for logging and diagnostics). */
export function resolveApiUrl(path) {
  const segment = path.startsWith("/") ? path : `/${path}`
  if (API_URL.startsWith("http://") || API_URL.startsWith("https://")) {
    return `${API_URL.replace(/\/+$/, "")}${segment}`
  }
  return `${API_URL.replace(/\/+$/, "")}${segment}`
}
