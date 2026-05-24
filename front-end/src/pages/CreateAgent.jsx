import { useCallback, useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  createAgent,
  fetchAvailableTools,
  getAgent,
  updateAgent,
} from "../api/agents"
import {
  agentToolsToSelection,
  selectionToAgentTools,
} from "../api/toolsSelection"
import { AppNav } from "../components/AppNav"
import { ProfileMenu } from "../components/ProfileMenu"
import { useAuth } from "../hooks/useAuth"

const INITIAL_CONFIG = {
  name: "",
  role: "",
  backstory: "",
  additional_context: "",
  maxSteps: 10,
  forbiddenTopics: "",
}

function validateConfig(config) {
  const errors = {}

  if (!config.name.trim()) {
    errors.name = "Agent name is required"
  } else if (config.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters"
  }

  if (!config.role.trim()) {
    errors.role = "Role is required"
  }

  if (!config.backstory.trim()) {
    errors.backstory = "Backstory is required"
  } else if (config.backstory.trim().length < 10) {
    errors.backstory = "Backstory must be at least 10 characters"
  }

  return errors
}

const CreateAgent = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editAgentId = searchParams.get("agentId")
  const isEditMode = Boolean(editAgentId)
  const { apiKeys } = useAuth()

  const [config, setConfig] = useState(INITIAL_CONFIG)
  const [maxStepsInput, setMaxStepsInput] = useState("10")
  const [availableTools, setAvailableTools] = useState([])
  const [toolsLoading, setToolsLoading] = useState(true)
  const [toolsError, setToolsError] = useState("")
  const [toolsUsingFallback, setToolsUsingFallback] = useState(false)
  const [selectedTools, setSelectedTools] = useState(new Set())
  const [agentLoading, setAgentLoading] = useState(isEditMode)
  const [agentLoadError, setAgentLoadError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const applyAgentToForm = useCallback((agent, tools) => {
    setConfig({
      name: agent.name || "",
      role: agent.role || "",
      backstory: agent.backstory || "",
      additional_context: agent.additional_context || "",
      maxSteps: agent.max_iterations ?? 10,
      forbiddenTopics: agent.forbidden_topics || "",
    })
    setMaxStepsInput(String(agent.max_iterations ?? 10))
    setSelectedTools(agentToolsToSelection(agent.tools, tools))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTools() {
      try {
        setToolsLoading(true)
        setToolsError("")
        const { tools, fromFallback } = await fetchAvailableTools()
        if (cancelled) return
        setAvailableTools(tools)
        setToolsUsingFallback(fromFallback)

        if (isEditMode && editAgentId) {
          try {
            setAgentLoading(true)
            setAgentLoadError("")
            const agent = await getAgent(editAgentId)
            if (cancelled) return
            applyAgentToForm(agent, tools)
          } catch (err) {
            if (!cancelled) {
              console.error("[constructor] Failed to load agent", err)
              setAgentLoadError(err.message || "Failed to load agent")
            }
          } finally {
            if (!cancelled) setAgentLoading(false)
          }
        } else {
          setSelectedTools(new Set(tools.map((t) => t.id)))
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[constructor] Failed to load tools", err)
          setToolsError(err.message || "Failed to load tools")
        }
      } finally {
        if (!cancelled) setToolsLoading(false)
      }
    }

    loadTools()
    return () => {
      cancelled = true
    }
  }, [applyAgentToForm, editAgentId, isEditMode])

  const allSelected =
    availableTools.length > 0 &&
    selectedTools.size === availableTools.length
  const noneSelected = selectedTools.size === 0
  const allToolsAllowed = noneSelected || allSelected

  function toggleTool(id) {
    if (!id) return
    setSelectedTools((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedTools(new Set())
    } else {
      setSelectedTools(new Set(availableTools.map((t) => t.id)))
    }
  }

  async function handleSave() {
    setSubmitError("")
    setSuccessMessage("")

    if (!apiKeys.gemini_configured) {
      setSubmitError("Add your Gemini API key in Settings before creating agents.")
      return
    }

    const errors = validateConfig(config)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = {
      name: config.name.trim(),
      role: config.role.trim(),
      backstory: config.backstory.trim(),
      additional_context: config.additional_context.trim(),
      max_iterations: config.maxSteps,
      forbidden_topics: config.forbiddenTopics.trim(),
      tools: selectionToAgentTools(selectedTools, availableTools),
    }

    try {
      setLoading(true)

      if (isEditMode && editAgentId) {
        await updateAgent(editAgentId, payload)
        setSuccessMessage("Agent updated. Opening Live view…")
      } else {
        await createAgent(payload)
        setSuccessMessage("Agent saved. Opening Live view…")
        setConfig(INITIAL_CONFIG)
        setMaxStepsInput("10")
        setSelectedTools(new Set(availableTools.map((t) => t.id)))
        setFieldErrors({})
      }

      setTimeout(() => navigate("/live"), 600)
    } catch (err) {
      console.error("[constructor] Save failed", err)
      setSubmitError(err.message || "Failed to save agent")
    } finally {
      setLoading(false)
    }
  }

  const canSave =
    config.name.trim() &&
    config.role.trim() &&
    config.backstory.trim() &&
    !loading &&
    !toolsLoading &&
    !agentLoading

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

      {!apiKeys.gemini_configured && (
        <div style={styles.warnBanner}>
          <span style={styles.warnIcon}>⚠</span>
          Gemini API key required.{" "}
          <span style={styles.warnLink} onClick={() => navigate("/settings")}>
            Open Settings
          </span>
        </div>
      )}

      <div style={styles.scroll}>
        <div style={styles.card}>
          <p style={styles.providerNote}>
            {isEditMode ? "Edit agent" : "Create agent"} — powered by{" "}
            <strong>Google Gemini</strong> only.
          </p>

          {agentLoadError && (
            <div style={styles.submitError} role="alert">{agentLoadError}</div>
          )}

          <div style={styles.section}>
            <label style={styles.label}>Name</label>
            <input
              value={config.name}
              onChange={(e) => {
                setConfig({ ...config, name: e.target.value })
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: undefined }))
                }
              }}
              style={{
                ...styles.input,
                border: fieldErrors.name
                  ? "1px solid rgba(255, 107, 107, 0.5)"
                  : "1px solid var(--border-subtle)",
              }}
              disabled={loading || agentLoading}
              placeholder="Research Assistant"
            />
            {fieldErrors.name && (
              <span style={styles.fieldError}>{fieldErrors.name}</span>
            )}
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Role</label>
            <input
              value={config.role}
              onChange={(e) => {
                setConfig({ ...config, role: e.target.value })
                if (fieldErrors.role) {
                  setFieldErrors((prev) => ({ ...prev, role: undefined }))
                }
              }}
              style={{
                ...styles.input,
                border: fieldErrors.role
                  ? "1px solid rgba(255, 107, 107, 0.5)"
                  : "1px solid var(--border-subtle)",
              }}
              disabled={loading || agentLoading}
              placeholder="Senior Software Engineer"
            />
            {fieldErrors.role && (
              <span style={styles.fieldError}>{fieldErrors.role}</span>
            )}
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Backstory</label>
            <textarea
              rows={5}
              value={config.backstory}
              onChange={(e) => {
                setConfig({ ...config, backstory: e.target.value })
                if (fieldErrors.backstory) {
                  setFieldErrors((prev) => ({ ...prev, backstory: undefined }))
                }
              }}
              style={{
                ...styles.textarea,
                border: fieldErrors.backstory
                  ? "1px solid rgba(255, 107, 107, 0.5)"
                  : "1px solid var(--border-subtle)",
              }}
              disabled={loading || agentLoading}
              placeholder="10 years of experience building SaaS products…"
            />
            {fieldErrors.backstory && (
              <span style={styles.fieldError}>{fieldErrors.backstory}</span>
            )}
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Additional context (optional)</label>
            <textarea
              rows={4}
              value={config.additional_context}
              onChange={(e) =>
                setConfig({ ...config, additional_context: e.target.value })
              }
              style={styles.textarea}
              disabled={loading || agentLoading}
              placeholder="Behavioral guidelines, tone, constraints…"
            />
            <span style={styles.hint}>
              Combined with role and backstory to build the Gemini system prompt automatically.
            </span>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Max iterations</label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxStepsInput}
              style={{ ...styles.input, width: 120 }}
              disabled={loading || agentLoading}
              onChange={(e) => setMaxStepsInput(e.target.value)}
              onBlur={() => {
                const val = Math.min(
                  20,
                  Math.max(1, Number(maxStepsInput) || 1)
                )
                setMaxStepsInput(String(val))
                setConfig({ ...config, maxSteps: val })
              }}
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Forbidden topics (optional)</label>
            <input
              value={config.forbiddenTopics}
              placeholder="politics, violence…"
              style={styles.input}
              disabled={loading || agentLoading}
              onChange={(e) =>
                setConfig({ ...config, forbiddenTopics: e.target.value })
              }
            />
          </div>

          <div style={styles.section}>
            <div style={styles.toolsHeader}>
              <label style={styles.label}>Allowed tools</label>
              <button
                type="button"
                onClick={toggleAll}
                disabled={loading || toolsLoading || !availableTools.length}
                style={styles.selectAllBtn}
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>

            {toolsUsingFallback && !toolsError && (
              <div style={styles.toolsWarn} role="status">
                Tool list loaded from app defaults. Redeploy the API so{" "}
                <code style={styles.inlineCode}>GET /api/tools/</code> is available.
              </div>
            )}
            {toolsError && (
              <div style={styles.submitError} role="alert">{toolsError}</div>
            )}
            {(toolsLoading || agentLoading) && (
              <span style={styles.hint}>Loading tools…</span>
            )}

            {!toolsLoading && !toolsError && availableTools.length === 0 && (
              <span style={styles.hint}>
                No tools available from the server. Check API connection or try again later.
              </span>
            )}

            <div style={styles.toolsGrid}>
              {availableTools.map((tool) => {
                const checked = selectedTools.has(tool.id)
                return (
                  <div
                    key={tool.id}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0}
                    onClick={() => !loading && !agentLoading && toggleTool(tool.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggleTool(tool.id)
                      }
                    }}
                    style={{
                      ...styles.toolCard,
                      ...(checked ? styles.toolCardActive : {}),
                      cursor: loading || agentLoading ? "not-allowed" : "pointer",
                      opacity: loading || agentLoading ? 0.6 : 1,
                    }}
                  >
                    <div style={styles.toolCheckRow}>
                      <span style={styles.toolLabel}>{tool.label}</span>
                      <span
                        style={{
                          ...styles.toolCheckbox,
                          ...(checked ? styles.toolCheckboxActive : {}),
                        }}
                      >
                        {checked && <span style={styles.checkmark}>✓</span>}
                      </span>
                    </div>
                    {tool.desc ? (
                      <div style={styles.toolDesc}>{tool.desc}</div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {allToolsAllowed && availableTools.length > 0 && (
              <span style={styles.hint}>
                All tools selected — the agent may use every tool enabled in the catalog.
              </span>
            )}
            {!allToolsAllowed && selectedTools.size > 0 && (
              <span style={styles.hint}>
                {selectedTools.size} of {availableTools.length} tools selected.
              </span>
            )}
          </div>

          {submitError && <div style={styles.submitError} role="alert">{submitError}</div>}
          {successMessage && (
            <div style={styles.successMessage} role="status">{successMessage}</div>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={!canSave}
        onClick={handleSave}
        style={{
          ...styles.saveBtn,
          opacity: canSave ? 1 : 0.4,
          cursor: loading ? "wait" : canSave ? "pointer" : "not-allowed",
        }}
      >
        {loading ? "Saving…" : isEditMode ? "Update agent" : "Save agent"}
      </button>
    </div>
  )
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    padding: 16,
    gap: 12,
    boxSizing: "border-box",
    background: "var(--surface-base)",
    color: "var(--text-primary)",
    fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    flexShrink: 0,
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
  warnBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    background: "rgba(255, 180, 50, 0.08)",
    border: "1px solid rgba(255, 180, 50, 0.2)",
  },
  warnIcon: {
    fontSize: 14,
    color: "#ffc94d",
  },
  warnLink: { 
    textDecoration: "underline", 
    cursor: "pointer", 
    fontWeight: 700,
    color: "var(--brand-primary)",
  },
  scroll: { flex: 1, overflowY: "auto" },
  card: { 
    padding: 24, 
    borderRadius: "var(--radius-lg)", 
    background: "var(--surface-raised)",
    border: "1px solid var(--border-default)",
    boxShadow: "var(--shadow-raised)",
  },
  providerNote: {
    fontSize: 13,
    color: "var(--text-secondary)",
    marginTop: 0,
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  label: { 
    display: "block", 
    marginBottom: 10, 
    fontWeight: 700,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--text-secondary)",
  },
  hint: {
    display: "block",
    marginTop: 8,
    fontSize: 12,
    color: "var(--text-tertiary)",
  },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-subtle)",
    background: "var(--surface-sunken)",
    color: "var(--text-primary)",
    boxSizing: "border-box",
    fontSize: 14,
    boxShadow: "var(--shadow-pressed)",
    outline: "none",
    transition: "var(--transition-fast)",
  },
  textarea: {
    width: "100%",
    padding: 14,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-subtle)",
    background: "var(--surface-sunken)",
    color: "var(--text-primary)",
    boxSizing: "border-box",
    resize: "vertical",
    fontSize: 14,
    boxShadow: "var(--shadow-pressed)",
    outline: "none",
    transition: "var(--transition-fast)",
  },
  fieldError: { 
    display: "block", 
    marginTop: 8, 
    fontSize: 12, 
    color: "#ff6b6b" 
  },
  toolsWarn: {
    fontSize: 12,
    color: "#ffc94d",
    background: "rgba(255, 180, 50, 0.08)",
    border: "1px solid rgba(255, 180, 50, 0.2)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 14px",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  inlineCode: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 11,
    background: "var(--surface-sunken)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  submitError: {
    fontSize: 13,
    color: "#ff6b6b",
    background: "rgba(255, 107, 107, 0.1)",
    border: "1px solid rgba(255, 107, 107, 0.25)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 14px",
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 13,
    color: "var(--brand-primary)",
    background: "var(--brand-primary-soft)",
    border: "1px solid var(--border-accent)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 14px",
  },
  saveBtn: {
    padding: 18,
    border: "1px solid var(--border-accent)",
    borderRadius: "var(--radius-md)",
    fontWeight: 700,
    color: "var(--text-primary)",
    background: "var(--surface-elevated)",
    fontSize: 15,
    boxShadow: "var(--shadow-raised)",
    transition: "var(--transition-fast)",
  },
  toolsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  selectAllBtn: {
    padding: "6px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-default)",
    background: "var(--surface-raised)",
    color: "var(--text-secondary)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "var(--transition-fast)",
  },
  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 10,
  },
  toolCard: {
    borderRadius: "var(--radius-sm)",
    padding: "12px 14px",
    transition: "var(--transition-fast)",
    userSelect: "none",
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-pressed)",
  },
  toolCardActive: {
    background: "var(--brand-primary-soft)",
    border: "1px solid var(--border-accent)",
    boxShadow: "var(--shadow-soft)",
  },
  toolCheckRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  toolLabel: { 
    fontSize: 12, 
    fontWeight: 700, 
    color: "var(--text-primary)", 
    flex: 1 
  },
  toolCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "var(--transition-fast)",
    background: "var(--surface-base)",
    border: "1px solid var(--border-default)",
  },
  toolCheckboxActive: {
    background: "var(--brand-primary)",
    border: "1px solid var(--brand-primary)",
  },
  checkmark: { 
    fontSize: 10, 
    color: "var(--surface-base)", 
    fontWeight: 700, 
    lineHeight: 1 
  },
  toolDesc: { 
    fontSize: 10, 
    color: "var(--text-tertiary)", 
    lineHeight: 1.4 
  },
}

export default CreateAgent
