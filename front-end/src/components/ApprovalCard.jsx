import { useState } from "react"
import { resolveApproval } from "../api/approvals"

function describeAction(event) {
  const tool = event.tool || "unknown tool"
  let detail = ""
  try {
    const parsed = JSON.parse(event.input || "{}")
    detail = JSON.stringify(parsed, null, 2)
  } catch {
    detail = event.input || ""
  }
  return { tool, detail }
}

export function ApprovalCard({ event, onResolved }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { tool, detail } = describeAction(event)

  async function submit(decision, alwaysAllow = false) {
    if (!event.approval_id || loading) return
    setLoading(true)
    setError("")
    try {
      await resolveApproval(event.approval_id, decision, { alwaysAllow })
      onResolved?.()
    } catch (err) {
      setError(err.message || "Failed to submit approval")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.card} role="region" aria-label="Approval required">
      <div style={styles.label}>
        <span style={styles.labelIcon}>⚡</span>
        Approval required
      </div>
      <p style={styles.intro}>Agent wants to:</p>
      <div style={styles.actionBox}>
        <strong style={styles.toolName}>{tool}</strong>
        {detail && <pre style={styles.detail}>{detail}</pre>}
      </div>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.actions}>
        <button
          type="button"
          style={styles.approveBtn}
          disabled={loading}
          onClick={() => submit("approve", false)}
        >
          Approve once
        </button>
        <button
          type="button"
          style={styles.alwaysBtn}
          disabled={loading}
          onClick={() => submit("approve", true)}
        >
          Always allow
        </button>
        <button
          type="button"
          style={styles.rejectBtn}
          disabled={loading}
          onClick={() => submit("deny", false)}
        >
          Reject
        </button>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: "rgba(255, 180, 50, 0.06)",
    border: "1px solid rgba(255, 180, 50, 0.25)",
    borderRadius: "var(--radius-md)",
    padding: "16px 20px",
    boxShadow: "var(--shadow-soft)",
    animation: "slide-up 0.2s ease",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    color: "#ffc94d",
    marginBottom: 12,
  },
  labelIcon: {
    fontSize: 14,
  },
  intro: { 
    margin: "0 0 10px", 
    fontSize: 14, 
    color: "var(--text-primary)" 
  },
  actionBox: {
    background: "var(--surface-sunken)",
    borderRadius: "var(--radius-sm)",
    padding: 14,
    marginBottom: 14,
    boxShadow: "var(--shadow-pressed)",
  },
  toolName: { 
    fontSize: 14, 
    color: "#ffc94d" 
  },
  detail: {
    margin: "10px 0 0",
    fontSize: 12,
    color: "var(--text-secondary)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 140,
    overflow: "auto",
    fontFamily: "ui-monospace, monospace",
  },
  error: {
    fontSize: 12,
    color: "#ff6b6b",
    marginBottom: 10,
    padding: "8px 12px",
    background: "rgba(255, 107, 107, 0.1)",
    borderRadius: "var(--radius-sm)",
  },
  actions: { 
    display: "flex", 
    flexWrap: "wrap", 
    gap: 8 
  },
  approveBtn: {
    padding: "10px 16px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(62, 207, 140, 0.35)",
    background: "rgba(62, 207, 140, 0.12)",
    color: "var(--brand-primary)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
    transition: "var(--transition-fast)",
    boxShadow: "var(--shadow-soft)",
  },
  alwaysBtn: {
    padding: "10px 16px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-default)",
    background: "var(--surface-raised)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontSize: 12,
    transition: "var(--transition-fast)",
  },
  rejectBtn: {
    padding: "10px 16px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(255, 107, 107, 0.35)",
    background: "rgba(255, 107, 107, 0.1)",
    color: "#ff6b6b",
    cursor: "pointer",
    fontSize: 12,
    transition: "var(--transition-fast)",
  },
}
