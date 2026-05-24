import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { logout } from "../api/api"
import { useAuth } from "../hooks/useAuth"

export function ProfileMenu() {
  const navigate = useNavigate()
  const { apiKeys } = useAuth()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={styles.profileBar} onClick={() => setOpen(!open)}>
        <span style={styles.profileIcon}>●</span>
        Profile
      </div>

      {open && (
        <div style={styles.popup}>
          <div style={styles.meta}>
            <span style={styles.metaLabel}>Gemini</span>
            {apiKeys.gemini_configured
              ? <span style={styles.metaValue}>✓ {apiKeys.gemini_key_hint || "configured"}</span>
              : <span style={styles.metaValueWarn}>not configured</span>}
          </div>
          <div style={styles.divider} />
          <div style={styles.popupItem} onClick={handleLogout}>
            <span style={styles.logoutIcon}>↳</span>
            Logout
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  profileBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--surface-raised)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-lg)",
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-primary)",
    cursor: "pointer",
    userSelect: "none",
    boxShadow: "var(--shadow-raised)",
    transition: "var(--transition-fast)",
  },
  profileIcon: {
    fontSize: 8,
    color: "var(--brand-primary)",
  },
  popup: {
    position: "absolute",
    top: "calc(100% + 12px)",
    right: 0,
    background: "var(--surface-raised)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-md)",
    padding: 8,
    minWidth: 180,
    zIndex: 1000,
    boxShadow: "var(--shadow-raised), 0 16px 40px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    animation: "slide-up 0.15s ease",
  },
  meta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 11,
    padding: "8px 12px",
  },
  metaLabel: {
    color: "var(--text-tertiary)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  metaValue: {
    color: "var(--brand-primary)",
    fontWeight: 500,
  },
  metaValueWarn: {
    color: "var(--text-tertiary)",
    fontWeight: 500,
  },
  divider: {
    height: 1,
    background: "var(--border-subtle)",
    margin: "4px 0",
  },
  popupItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: 12,
    fontWeight: 600,
    color: "#ff6b6b",
    cursor: "pointer",
    transition: "var(--transition-fast)",
  },
  logoutIcon: {
    fontSize: 14,
    opacity: 0.8,
  },
}
