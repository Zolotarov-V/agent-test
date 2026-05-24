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
    connected: "var(--brand-primary)",
    invalid: "#ff6b6b",
    not_configured: "var(--text-tertiary)",
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
            <span style={styles.logoText}>Agentic</span>
            <span style={styles.logoAccent}>Studio</span>
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
          <span style={styles.logoText}>Agentic</span>
          <span style={styles.logoAccent}>Studio</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                opacity: username.trim() ? 1 : 0.4,
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
                opacity: !geminiKey.trim() || keyLoading ? 0.4 : 1,
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
                opacity: serperLoading ? 0.4 : 1,
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
                opacity: !restKeyName.trim() || restKeyLoading ? 0.4 : 1,
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
    background: "var(--surface-base)",
    color: "var(--text-primary)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: 16,
    gap: 12,
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    flexShrink: 0,
    flexWrap: "wrap",
    gap: 12,
  },
  logoBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontWeight: 700,
    fontSize: 16,
    background: "var(--surface-raised)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-md)",
    padding: "10px 20px",
    boxShadow: "var(--shadow-raised)",
  },
  logoText: {
    color: "var(--text-primary)",
  },
  logoAccent: {
    color: "var(--brand-primary)",
  },
  loadingWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid var(--border-default)",
    borderTopColor: "var(--brand-primary)",
    borderRadius: "50%",
    animation: "settings-spin 0.8s linear infinite",
  },
  scroll: { flex: 1, overflowY: "auto", padding: "0 4px 16px" },
  card: {
    background: "var(--surface-raised)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-default)",
    boxShadow: "var(--shadow-raised), var(--shadow-glow)",
    padding: 28,
    maxWidth: 580,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 700, 
    margin: "0 0 16px",
    color: "var(--text-primary)",
    letterSpacing: "-0.3px",
  },
  section: { marginBottom: 18 },
  label: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 10,
    color: "var(--text-secondary)",
  },
  badgeConfigured: { 
    fontSize: 11, 
    color: "var(--brand-primary)", 
    fontWeight: 600, 
    textTransform: "none" 
  },
  inputRow: { display: "flex", gap: 10, alignItems: "stretch" },
  input: {
    flex: 1,
    minWidth: 0,
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "var(--shadow-pressed)",
    transition: "var(--transition-fast)",
  },
  toggleBtn: {
    flexShrink: 0,
    padding: "0 16px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-default)",
    background: "var(--surface-raised)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "var(--transition-fast)",
  },
  hint: { 
    fontSize: 11, 
    color: "var(--text-tertiary)", 
    marginTop: 8, 
    lineHeight: 1.5 
  },
  inlineCode: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 10,
    background: "var(--surface-sunken)",
    padding: "3px 8px",
    borderRadius: 4,
  },
  keyList: { 
    listStyle: "none", 
    margin: "0 0 18px", 
    padding: 0, 
    display: "flex", 
    flexDirection: "column", 
    gap: 12 
  },
  keyListItem: {
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-sm)",
    padding: "14px 16px",
    boxShadow: "var(--shadow-pressed)",
  },
  keyListMain: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "baseline", 
    gap: 10, 
    marginBottom: 8 
  },
  keyListName: { fontWeight: 700, fontSize: 14 },
  keyListPrefix: { 
    fontFamily: "ui-monospace, monospace", 
    fontSize: 12, 
    color: "var(--text-secondary)" 
  },
  keyListMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    fontSize: 10,
    color: "var(--text-tertiary)",
    marginBottom: 12,
  },
  revokeBtn: {
    padding: "8px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(255, 107, 107, 0.35)",
    background: "transparent",
    color: "#ff6b6b",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "var(--transition-fast)",
  },
  newKeyBox: {
    background: "var(--brand-primary-soft)",
    border: "1px solid var(--border-accent)",
    borderRadius: "var(--radius-sm)",
    padding: "14px 16px",
    marginBottom: 14,
  },
  newKeyTitle: { 
    fontSize: 12, 
    color: "var(--brand-primary)", 
    margin: "0 0 12px", 
    fontWeight: 600 
  },
  link: { color: "var(--brand-primary)" },
  errorMsg: {
    background: "rgba(255, 107, 107, 0.1)",
    border: "1px solid rgba(255, 107, 107, 0.25)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: 13,
    color: "#ff6b6b",
    marginBottom: 14,
  },
  successMsg: {
    background: "var(--brand-primary-soft)",
    border: "1px solid var(--border-accent)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: 13,
    color: "var(--brand-primary)",
    marginBottom: 14,
  },
  saveBtn: {
    width: "100%",
    marginTop: 6,
    padding: 14,
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 700,
    background: "var(--surface-elevated)",
    border: "1px solid var(--border-default)",
    cursor: "pointer",
    boxShadow: "var(--shadow-raised)",
    transition: "var(--transition-fast)",
  },
  secondaryBtn: {
    padding: 14,
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 600,
    background: "var(--surface-raised)",
    border: "1px solid var(--border-default)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "var(--transition-fast)",
  },
  buttonRow: { display: "flex", flexDirection: "column", gap: 12 },
  divider: { 
    border: "none", 
    borderTop: "1px solid var(--border-subtle)", 
    margin: "28px 0" 
  },
  logoutBtn: {
    width: "100%",
    padding: 14,
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(255, 107, 107, 0.35)",
    background: "transparent",
    color: "#ff6b6b",
    cursor: "pointer",
    fontWeight: 600,
    transition: "var(--transition-fast)",
  },
}
