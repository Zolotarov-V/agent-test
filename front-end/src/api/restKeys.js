import { authFetch } from "./api"
import { parseJsonResponse, withRetry } from "./http"

export async function fetchRestKeys() {
  return withRetry(async () => {
    const res = await authFetch("/rest-keys/")
    return parseJsonResponse(res)
  })
}

export async function createRestKey(name) {
  return withRetry(async () => {
    const res = await authFetch("/rest-keys/", {
      method: "POST",
      body: JSON.stringify({ name: name.trim() }),
    })
    return parseJsonResponse(res)
  })
}

export async function revokeRestKey(id) {
  return withRetry(async () => {
    const res = await authFetch(`/rest-keys/${id}/`, { method: "DELETE" })
    if (res.status === 204) return null
    return parseJsonResponse(res)
  })
}
