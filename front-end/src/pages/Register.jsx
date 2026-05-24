import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { login, register } from "../api/auth"
import { isAuthenticated } from "../api/api"

export function Register({ mode = "register" }) {
  const navigate = useNavigate()
  const isLogin = mode === "login"

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (isAuthenticated()) {
    return <Navigate to="/live" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!username.trim() || !password) {
      setError("Enter username and password")
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setLoading(true)
      if (isLogin) {
        await login({ username: username.trim(), password })
      } else {
        await register({ username: username.trim(), password, email: email.trim() })
      }
      navigate("/live", { replace: true })
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.logoBadge}>
          <span style={styles.logoText}>Agentic</span>
          <span style={styles.logoAccent}>Studio</span>
        </div>
      </div>

      <div style={styles.authContainer}>
        <div style={styles.card}>
          <h2 style={styles.title}>
            {isLogin ? "Sign in" : "Create account"}
          </h2>
          <p style={styles.subtitle}>
            {isLogin
              ? "Use your credentials to access the studio"
              : "Register to build and run agents"}
          </p>

          <div style={styles.tabs}>
            <Link
              to="/login"
              style={{
                ...styles.tab,
                ...(isLogin ? styles.tabActive : {}),
              }}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              style={{
                ...styles.tab,
                ...(!isLogin ? styles.tabActive : {}),
              }}
            >
              Register
            </Link>
          </div>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                style={styles.input}
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              disabled={
                loading || !username.trim() || !password || (!isLogin && !confirmPassword)
              }
              style={{
                ...styles.runBtn,
                opacity: loading || !username.trim() || !password ? 0.5 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>

        <p style={styles.footerText}>
          Django API: <code style={styles.code}>localhost:8000</code>
        </p>
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: "100vh",
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    background: "var(--surface-base)",
    color: "var(--text-primary)",
    fontFamily: 'Frutiger, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: "40px 16px",
    gap: 40,
    boxSizing: "border-box",
    alignItems: "center",
  },
  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
  },
  logoBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontWeight: 700,
    fontSize: 20,
    background: "var(--surface-raised)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-md)",
    padding: "12px 28px",
    boxShadow: "var(--shadow-raised)",
  },
  logoText: {
    color: "var(--text-primary)",
  },
  logoAccent: {
    color: "var(--brand-primary)",
  },
  authContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    width: "100%",
    maxWidth: 420,
  },
  card: {
    width: "100%",
    padding: "36px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "var(--surface-raised)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--border-default)",
    boxShadow: "var(--shadow-raised), var(--shadow-glow)",
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    textAlign: "center",
    color: "var(--text-primary)",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: 14,
    color: "var(--text-secondary)",
    textAlign: "center",
    marginBottom: 16,
  },
  tabs: {
    display: "flex",
    gap: 4,
    marginBottom: 12,
    background: "var(--surface-sunken)",
    borderRadius: "var(--radius-md)",
    padding: 4,
    boxShadow: "var(--shadow-pressed)",
  },
  tab: {
    flex: 1,
    textAlign: "center",
    padding: "12px 14px",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-tertiary)",
    textDecoration: "none",
    transition: "var(--transition-fast)",
  },
  tabActive: {
    background: "var(--surface-elevated)",
    color: "var(--text-primary)",
    boxShadow: "var(--shadow-soft)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-secondary)",
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    padding: "14px 18px",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    boxShadow: "var(--shadow-pressed)",
    transition: "var(--transition-fast)",
  },
  error: {
    fontSize: 13,
    color: "#ff6b6b",
    background: "rgba(255, 107, 107, 0.1)",
    border: "1px solid rgba(255, 107, 107, 0.25)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 14px",
  },
  runBtn: {
    padding: "16px",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    fontSize: 15,
    fontWeight: 700,
    transition: "var(--transition-normal)",
    background: "var(--surface-elevated)",
    boxShadow: "var(--shadow-raised)",
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    color: "var(--text-tertiary)",
  },
  code: {
    fontSize: 12,
    background: "var(--surface-sunken)",
    padding: "3px 8px",
    borderRadius: "var(--radius-sm)",
    fontFamily: "ui-monospace, monospace",
  },
}
