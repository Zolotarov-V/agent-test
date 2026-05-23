import { authFetch } from "./api"
import { parseJsonResponse, withRetry } from "./http"

export async function fetchApiKeys() {
  return withRetry(async () => {
    const res = await authFetch("/api-keys/")
    return parseJsonResponse(res)
  })
}

export async function saveApiKeys({ gemini_api_key, serper_api_key, github_token } = {}) {
  const body = {}
  if (gemini_api_key !== undefined) body.gemini_api_key = gemini_api_key
  if (serper_api_key !== undefined) body.serper_api_key = serper_api_key
  if (github_token !== undefined) body.github_token = github_token

  return withRetry(async () => {
    const res = await authFetch("/api-keys/", {
      method: "PUT",
      body: JSON.stringify(body),
    })
    return parseJsonResponse(res)
  })
}
