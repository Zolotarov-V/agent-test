import { API_URL, resolveApiUrl } from "./config"
import { formatApiError } from "./errors"

export { API_URL }

const API_KEYS_STORAGE_KEY = "api_keys"
const USER_INFO_KEY = "user_info"

export function setUserInfo({ username = "", email = "" }) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify({ username, email }))
}

export function getUserInfo() {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY)
    return raw ? JSON.parse(raw) : { username: "", email: "" }
  } catch {
    return { username: "", email: "" }
  }
}

export function setTokens(data) {
  if (data.access) {
    localStorage.setItem("access", data.access)
  }
  if (data.refresh) {
    localStorage.setItem("refresh", data.refresh)
  }
}

export function setApiKeysMeta(apiKeys) {
  if (!apiKeys) return
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(apiKeys))
}

export function defaultApiKeysMeta() {
  return {
    gemini_configured: false,
    gemini_key_hint: "",
    serper_configured: false,
    serper_key_hint: "",
    github_configured: false,
    github_status: "not_configured",
    github_key_hint: "",
  }
}

export function getApiKeysMeta() {
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultApiKeysMeta()
  } catch {
    return defaultApiKeysMeta()
  }
}

export function getAccessToken() {
  const token = localStorage.getItem("access")
  if (!token) return null
  const trimmed = token.trim()
  if (trimmed.startsWith("{") || trimmed.includes("refresh")) {
    logout()
    return null
  }
  return trimmed
}

export function getRefreshToken() {
  const token = localStorage.getItem("refresh")
  return token ? token.trim() : null
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

export function logout() {
  localStorage.removeItem("access")
  localStorage.removeItem("refresh")
  localStorage.removeItem(API_KEYS_STORAGE_KEY)
  localStorage.removeItem(USER_INFO_KEY)
}

let refreshPromise = null

async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    throw new Error("Session expired. Please sign in again.")
  }

  const res = await fetch(resolveApiUrl("/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    logout()
    throw new Error(formatApiError(data) || "Session expired. Please sign in again.")
  }

  setTokens(data)
  return data.access
}

async function fetchWithAuth(url, options = {}) {
  const token = getAccessToken()
  const requestUrl = resolveApiUrl(url)

  return fetch(requestUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
}

export async function authFetch(url, options = {}) {
  let res = await fetchWithAuth(url, options)

  if (res.status !== 401) {
    return res
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  await refreshPromise

  return fetchWithAuth(url, options)
}

export function applyAuthPayload(data) {
  setTokens(data)
  if (data.api_keys) {
    setApiKeysMeta(data.api_keys)
  }
}
