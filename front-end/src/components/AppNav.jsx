import { Link, useLocation } from "react-router-dom"

const links = [
  { to: "/live", label: "Live" },
  { to: "/constructor", label: "Create" },
  { to: "/settings", label: "User data" },
]

export function AppNav() {
  const { pathname } = useLocation()

  return (
    <nav style={styles.nav}>
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          style={{
            ...styles.link,
            ...(pathname === to ? styles.linkActive : {}),
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

const styles = {
  nav: {
    display: "flex",
    gap: 4,
    background: "var(--surface-sunken)",
    borderRadius: "var(--radius-md)",
    padding: 4,
    boxShadow: "var(--shadow-pressed)",
    border: "1px solid var(--border-subtle)",
  },
  link: {
    padding: "8px 14px",
    borderRadius: "var(--radius-sm)",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-tertiary)",
    textDecoration: "none",
    transition: "var(--transition-fast)",
    letterSpacing: "0.3px",
  },
  linkActive: {
    background: "var(--surface-elevated)",
    color: "var(--text-primary)",
    boxShadow: "var(--shadow-soft)",
  },
}
