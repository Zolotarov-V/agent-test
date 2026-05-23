import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getUserInfo, logout, setUserInfo } from "../api/api"
import { saveApiKeys } from "../api/apiKeys"
import { API_URL } from "../api/config"
import { testGitHubConnection } from "../api/github"
import { createRestKey, fetchRestKeys, revokeRestKey } from "../api/restKeys"
import { AppNav } from "../components/AppNav"
import { ProfileMenu } from "../components/ProfileMenu"
import { useAuth } from "../hooks/useAuth"

const GITHUB_STATUS_LABEL = {
  connected: "Connected",
  invalid: "Invalid token",
  not_configured: "Not configured",
}

function formatDate(iso) {
  if (!iso) return "Never"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function StatusBadge({ status }) {
  const colors = {
    connected: "#6ee7b7",
    invalid: "#fca5a5",
    not_configured: "rgba(255,255,255,0.55)",
  }
  return (
    <span style={{ fontSize: 11, color: colors[status] || colors.not_configured, fontWeight: 600 }}>
      {GITHUB_STATUS_LABEL[status] || status}
    </span>
  )
}

export function ApiKeysSettings() {
  const navigate = useNavigate()
  const { apiKeys, loadApiKeys, updateGeminiKey } = useAuth()

  const stored = getUserInfo()
  const [username, setUsername] = useState(stored.username || "")
  const [email, setEmail] = useState(stored.email || "")
  const [userSaved, setUserSaved] = useState(false)

  const [geminiKey, setGeminiKey] = useState("")
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [keyLoading, setKeyLoading] = useState(false)
  const [keySuccess, setKeySuccess] = useState("")
  const [keyError, setKeyError] = useState("")

  const [serperKey, setSerperKey] = useState("")
  const [showSerperKey, setShowSerperKey] = useState(false)
  const [serperLoading, setSerperLoading] = useState(false)
  const [serperSuccess, setSerperSuccess] = useState("")
  const [serperError, setSerperError] = useState("")

  const [githubToken, setGithubToken] = useState("")
  const [showGithubToken, setShowGithubToken] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubTestLoading, setGithubTestLoading] = useState(false)
  const [githubError, setGithubError] = useState("")
  const [githubSuccess, setGithubSuccess] = useState("")

  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [restKeys, setRestKeys] = useState([])
  const [restKeyName, setRestKeyName] = useState("")
  const [restKeyLoading, setRestKeyLoading] = useState(false)
  const [restKeyError, setRestKeyError] = useState("")
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null)
  const [copiedKey, setCopiedKey] = useState(false)

  const loadRestKeys = useCallback(async () => {
    const keys = await fetchRestKeys()
    setRestKeys(Array.isArray(keys) ? keys : [])
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoadingMeta(true)
        setLoadError("")
        await loadApiKeys()
        await loadRestKeys()
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load settings")
      } finally {
        if (!cancelled) setLoadingMeta(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [loadApiKeys, loadRestKeys])

  async function handleCreateRestKey() {
    const name = restKeyName.trim()
    if (!name) return
    setRestKeyLoading(true)
    setRestKeyError("")
    setNewlyCreatedKey(null)
    setCopiedKey(false)
    try {
      const created = await createRestKey(name)
      setNewlyCreatedKey(created)
      setRestKeyName("")
      await loadRestKeys()
    } catch (err) {
      setRestKeyError(err.message || "Failed to create API key")
    } finally {
      setRestKeyLoading(false)
    }
  }

  async function handleRevokeRestKey(id, name) {
    if (!window.confirm(`Revoke API key "${name}"? This cannot be undone.`)) return
    setRestKeyError("")
    try {
      await revokeRestKey(id)
      if (newlyCreatedKey?.id === id) setNewlyCreatedKey(null)
      await loadRestKeys()
    } catch (err) {
      setRestKeyError(err.message || "Failed to revoke API key")
    }
  }

  async function handleCopyNewKey() {
    if (!newlyCreatedKey?.key) return
    try {
      await navigator.clipboard.writeText(newlyCreatedKey.key)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } catch {
      setRestKeyError("Could not copy to clipboard")
    }
  }

  function handleSaveUser() {
    setUserInfo({ username, email })
    setUserSaved(true)
    setTimeout(() => setUserSaved(false), 2000)
  }

  async function handleSaveGeminiKey() {
    if (!geminiKey.trim()) return
    setKeyLoading(true)
    setKeyError("")
    setKeySuccess("")
    try {
      await updateGeminiKey(geminiKey.trim())
      setGeminiKey("")
      setKeySuccess("API key saved!")
    } catch (err) {
      setKeyError(err.message || "Failed to save key")
    } finally {
      setKeyLoading(false)
    }
  }

  async function handleSaveSerperKey() {
    const value = serperKey.trim()
    setSerperLoading(true)
    setSerperError("")
    setSerperSuccess("")
    try {
      await saveApiKeys({ serper_api_key: value })
      setSerperKey("")
      setSerperSuccess(value ? "Serper API key saved!" : "Serper API key removed.")
      await loadApiKeys()
    } catch (err) {
      setSerperError(err.message || "Failed to save Serper key")
    } finally {
      setSerperLoading(false)
    }
  }

  async function handleSaveGithubToken() {
    setGithubLoading(true)
    setGithubError("")
    setGithubSuccess("")
    try {
      const meta = await saveApiKeys({ github_token: githubToken.trim() })
      if (meta.github_status === "connected") {
        setGithubSuccess("GitHub token saved and verified.")
      } else if (githubToken.trim()) {
        setGithubSuccess("Token saved. Use Test Connection to verify.")
      } else {
        setGithubSuccess("GitHub token removed.")
      }
      setGithubToken("")
      await loadApiKeys()
    } catch (err) {
      setGithubError(err.message || "Failed to save GitHub token")
    } finally {
      setGithubLoading(false)
    }
  }

  async function handleTestGithub() {
    setGithubTestLoading(true)
    setGithubError("")
    setGithubSuccess("")
    try {
      const result = await testGitHubConnection()
      setGithubSuccess(result.message || "Connection successful.")
      await loadApiKeys()
    } catch (err) {
      setGithubError(err.message || "Connection test failed")
      await loadApiKeys()
    } finally {
      setGithubTestLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  if (loadingMeta) {
    return (
      <div style={styles.root}>
        <div style={styles.topBar}>
          <div style={styles.logoBadge}>
            Agentic<span style={{ color: "#b3f0ff" }}>Studio</span>
          </div>
          <AppNav />
        </div>
        <div style={styles.loadingWrap} role="status" aria-live="polite">
          <div style={styles.spinner} />
          <span>Loading settings…</span>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: "#b3f0ff" }}>Studio</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AppNav />
          <ProfileMenu />
        </div>
      </div>

      <div style={styles.scroll}>
        <div style={styles.card}>
          {loadError && <div style={styles.errorMsg}>{loadError}</div>}

          <section aria-labelledby="user-data-heading">
            <h2 id="user-data-heading" style={styles.sectionTitle}>User data</h2>

            <div style={styles.section}>
              <label style={styles.label} htmlFor="settings-username">Username</label>
              <input
                id="settings-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                style={styles.input}
                autoComplete="username"
              />
            </div>

            <div style={styles.section}>
              <label style={styles.label} htmlFor="settings-email">Email</label>
              <input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={styles.input}
                autoComplete="email"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveUser}
              disabled={!username.trim()}
              style={{
                ...styles.saveBtn,
                opacity: username.trim() ? 1 : 0.5,
                cursor: username.trim() ? "pointer" : "not-allowed",
              }}
            >
              {userSaved ? "Saved ✓" : "Save user data"}
            </button>
          </section>

          <hr style={styles.divider} />

          <section aria-labelledby="api-keys-heading">
            <h2 id="api-keys-heading" style={styles.sectionTitle}>API Keys</h2>

            <div style={styles.section}>
              <label style={styles.label} htmlFor="gemini-key">
                Gemini API Key
                {apiKeys.gemini_configured && (
                  <span style={styles.badgeConfigured}>
                    Configured {apiKeys.gemini_key_hint ? `(${apiKeys.gemini_key_hint})` : ""}
                  </span>
                )}
              </label>
              <div style={styles.inputRow}>
                <input
                  id="gemini-key"
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveGeminiKey()}
                  placeholder={apiKeys.gemini_configured ? "Enter new key to replace…" : "AIza…"}
                  style={styles.input}
                  disabled={keyLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  style={styles.toggleBtn}
                  onClick={() => setShowGeminiKey((v) => !v)}
                  aria-label={showGeminiKey ? "Hide API key" : "Show API key"}
                >
                  {showGeminiKey ? "Hide" : "Show"}
                </button>
              </div>
              <p style={styles.hint}>
                Get your key at{" "}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={styles.link}>
                  aistudio.google.com
                </a>
              </p>
            </div>

            {keyError && <div style={styles.errorMsg} role="alert">{keyError}</div>}
            {keySuccess && <div style={styles.successMsg} role="status">{keySuccess}</div>}

            <button
              type="button"
              onClick={handleSaveGeminiKey}
              disabled={!geminiKey.trim() || keyLoading}
              style={{
                ...styles.saveBtn,
                opacity: !geminiKey.trim() || keyLoading ? 0.5 : 1,
                cursor: !geminiKey.trim() || keyLoading ? "not-allowed" : "pointer",
              }}
            >
              {keyLoading ? "Saving…" : "Save API key"}
            </button>
          </section>

          <hr style={styles.divider} />

          <section aria-labelledby="serper-heading">
            <h2 id="serper-heading" style={styles.sectionTitle}>Serper (Web Search)</h2>

            <div style={styles.section}>
              <label style={styles.label} htmlFor="serper-key">
                Serper API Key
                {apiKeys.serper_configured && (
                  <span style={styles.badgeConfigured}>
                    Configured {apiKeys.serper_key_hint ? `(${apiKeys.serper_key_hint})` : ""}
                  </span>
                )}
              </label>
              <div style={styles.inputRow}>
                <input
                  id="serper-key"
                  type={showSerperKey ? "text" : "password"}
                  value={serperKey}
                  onChange={(e) => setSerperKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveSerperKey()}
                  placeholder={apiKeys.serper_configured ? "Enter new key to replace…" : "Paste Serper API key"}
                  style={styles.input}
                  disabled={serperLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  style={styles.toggleBtn}
                  onClick={() => setShowSerperKey((v) => !v)}
                  aria-label={showSerperKey ? "Hide Serper key" : "Show Serper key"}
                >
                  {showSerperKey ? "Hide" : "Show"}
                </button>
              </div>
              <p style={styles.hint}>
                Required for the <strong>web_search</strong> tool. Get a key at{" "}
                <a href="https://serper.dev" target="_blank" rel="noreferrer" style={styles.link}>
                  serper.dev
                </a>
                . Leave empty and save to remove.
              </p>
            </div>

            {serperError && <div style={styles.errorMsg} role="alert">{serperError}</div>}
            {serperSuccess && <div style={styles.successMsg} role="status">{serperSuccess}</div>}

            <button
              type="button"
              onClick={handleSaveSerperKey}
              disabled={serperLoading}
              style={{
                ...styles.saveBtn,
                opacity: serperLoading ? 0.5 : 1,
                cursor: serperLoading ? "not-allowed" : "pointer",
              }}
            >
              {serperLoading ? "Saving…" : "Save Serper key"}
            </button>
          </section>

          <hr style={styles.divider} />

          <section aria-labelledby="github-heading">
            <h2 id="github-heading" style={styles.sectionTitle}>GitHub Integration</h2>

            <div style={styles.section}>
              <label style={styles.label} htmlFor="github-token">
                GitHub Personal Access Token
                <StatusBadge status={apiKeys.github_status || "not_configured"} />
              </label>
              {apiKeys.github_configured && apiKeys.github_key_hint && (
                <p style={styles.hint}>Stored token: {apiKeys.github_key_hint}</p>
              )}
              <div style={styles.inputRow}>
                <input
                  id="github-token"
                  type={showGithubToken ? "text" : "password"}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder={apiKeys.github_configured ? "Enter new token to replace…" : "ghp_… or github_pat_…"}
                  style={styles.input}
                  disabled={githubLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  style={styles.toggleBtn}
                  onClick={() => setShowGithubToken((v) => !v)}
                  aria-label={showGithubToken ? "Hide token" : "Show token"}
                >
                  {showGithubToken ? "Hide" : "Show"}
                </button>
              </div>
              <p style={styles.hint}>
                Token is encrypted at rest and never shown after saving. Create tokens at{" "}
                <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={styles.link}>
                  github.com/settings/tokens
                </a>
              </p>
            </div>

            {githubError && <div style={styles.errorMsg} role="alert">{githubError}</div>}
            {githubSuccess && <div style={styles.successMsg} role="status">{githubSuccess}</div>}

            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={handleSaveGithubToken}
                disabled={githubLoading}
                style={styles.saveBtn}
              >
                {githubLoading ? "Saving…" : "Save token"}
              </button>
              <button
                type="button"
                onClick={handleTestGithub}
                disabled={githubTestLoading || !apiKeys.github_configured}
                style={styles.secondaryBtn}
              >
                {githubTestLoading ? "Testing…" : "Test Connection"}
              </button>
            </div>
          </section>

          <hr style={styles.divider} />

          <section aria-labelledby="rest-api-keys-heading">
            <h2 id="rest-api-keys-heading" style={styles.sectionTitle}>REST API Access</h2>
            <p style={styles.hint}>
              Create keys to call the API from scripts or integrations. Use the header{" "}
              <code style={styles.inlineCode}>Authorization: Api-Key &lt;your-key&gt;</code> on any
              authenticated endpoint (e.g. list agents, start runs).
            </p>
            <p style={styles.hint}>
              Base URL: <code style={styles.inlineCode}>{API_URL}</code>
            </p>

            {restKeys.length > 0 && (
              <ul style={styles.keyList}>
                {restKeys.map((item) => (
                  <li key={item.id} style={styles.keyListItem}>
                    <div style={styles.keyListMain}>
                      <span style={styles.keyListName}>{item.name}</span>
                      <span style={styles.keyListPrefix}>{item.prefix}…</span>
                    </div>
                    <div style={styles.keyListMeta}>
                      <span>Created {formatDate(item.created_at)}</span>
                      <span>Last used {formatDate(item.last_used_at)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeRestKey(item.id, item.name)}
                      style={styles.revokeBtn}
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {restKeys.length === 0 && (
              <p style={styles.hint}>No active API keys yet.</p>
            )}

            <div style={styles.section}>
              <label style={styles.label} htmlFor="rest-key-name">Key name</label>
              <input
                id="rest-key-name"
                type="text"
                value={restKeyName}
                onChange={(e) => setRestKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateRestKey()}
                placeholder="e.g. CI pipeline, local script"
                style={styles.input}
                disabled={restKeyLoading}
                maxLength={100}
                autoComplete="off"
              />
            </div>

            {restKeyError && <div style={styles.errorMsg} role="alert">{restKeyError}</div>}

            {newlyCreatedKey?.key && (
              <div style={styles.newKeyBox} role="status">
                <p style={styles.newKeyTitle}>Copy your new API key now — it will not be shown again.</p>
                <div style={styles.inputRow}>
                  <input
                    type="text"
                    readOnly
                    value={newlyCreatedKey.key}
                    style={styles.input}
                    aria-label="New API key"
                  />
                  <button type="button" onClick={handleCopyNewKey} style={styles.toggleBtn}>
                    {copiedKey ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateRestKey}
              disabled={!restKeyName.trim() || restKeyLoading}
              style={{
                ...styles.saveBtn,
                opacity: !restKeyName.trim() || restKeyLoading ? 0.5 : 1,
                cursor: !restKeyName.trim() || restKeyLoading ? "not-allowed" : "pointer",
              }}
            >
              {restKeyLoading ? "Creating…" : "Create API key"}
            </button>
          </section>

          <hr style={styles.divider} />

          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "linear-gradient(160deg, #5ececa 0%, #3a9fbf 40%, #1a6080 100%)",
    color: "#fff",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: 12,
    gap: 10,
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    flexShrink: 0,
    flexWrap: "wrap",
    gap: 8,
  },
  logoBadge: {
    fontWeight: 700,
    fontSize: 15,
    color: "#fff",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: "7px 16px",
  },
  loadingWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    fontSize: 14,
    opacity: 0.85,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(255,255,255,0.2)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "settings-spin 0.8s linear infinite",
  },
  scroll: { flex: 1, overflowY: "auto", padding: "0 4px 16px" },
  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    borderRadius: 16,
    border: "2px solid rgba(80,180,255,0.6)",
    boxShadow: "0 0 30px rgba(80,180,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
    padding: 24,
    maxWidth: 560,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  sectionTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 12px" },
  section: { marginBottom: 16 },
  label: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: 8,
  },
  badgeConfigured: { fontSize: 11, color: "#6ee7b7", fontWeight: 600, textTransform: "none" },
  inputRow: { display: "flex", gap: 8, alignItems: "stretch" },
  input: {
    flex: 1,
    minWidth: 0,
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  toggleBtn: {
    flexShrink: 0,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  hint: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 6, lineHeight: 1.5 },
  inlineCode: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 10,
    background: "rgba(0,0,0,0.25)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  keyList: { listStyle: "none", margin: "0 0 16px", padding: 0, display: "flex", flexDirection: "column", gap: 10 },
  keyListItem: {
    background: "rgba(0,0,0,0.15)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "12px 14px",
  },
  keyListMain: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 },
  keyListName: { fontWeight: 700, fontSize: 14 },
  keyListPrefix: { fontFamily: "ui-monospace, monospace", fontSize: 12, opacity: 0.85 },
  keyListMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 10,
  },
  revokeBtn: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,120,120,0.45)",
    background: "transparent",
    color: "#ffb4b4",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  newKeyBox: {
    background: "rgba(100,220,150,0.15)",
    border: "1px solid rgba(100,220,150,0.35)",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 12,
  },
  newKeyTitle: { fontSize: 12, color: "#6ee7b7", margin: "0 0 10px", fontWeight: 600 },
  link: { color: "#b3f0ff" },
  errorMsg: {
    background: "rgba(255,100,100,0.2)",
    border: "1px solid rgba(255,100,100,0.4)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#ffaaaa",
    marginBottom: 12,
  },
  successMsg: {
    background: "rgba(100,220,150,0.2)",
    border: "1px solid rgba(100,220,150,0.4)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#6ee7b7",
    marginBottom: 12,
  },
  saveBtn: {
    width: "100%",
    marginTop: 4,
    padding: 13,
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    background: "rgba(255,255,255,0.25)",
    border: "1px solid rgba(255,255,255,0.2)",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: 13,
    borderRadius: 12,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  buttonRow: { display: "flex", flexDirection: "column", gap: 10 },
  divider: { border: "none", borderTop: "1px solid rgba(255,255,255,0.2)", margin: "24px 0" },
  logoutBtn: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,120,120,0.4)",
    background: "transparent",
    color: "#ffb4b4",
    cursor: "pointer",
    fontWeight: 600,
  },
}
