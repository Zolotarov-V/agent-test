import { useState } from 'react'

export function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleRegister() {
    console.log('Registering with:', { email, password })
    // Тут буде виклик вашого API
  }

  return (
    <div style={styles.root}>

      {/* Header - такий самий, як у LiveView */}
      <div style={styles.header}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: '#b3f0ff' }}>Studio</span>
        </div>
      </div>

      {/* Реєстраційна форма */}
      <div style={styles.authContainer}>
        <div style={styles.card}>
          <h2 style={styles.title}>Створити акаунт</h2>
          <p style={styles.subtitle}>Введіть дані для доступу до студії</p>

          <div style={styles.form}>

            {/* Поле Пошта */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Електронна пошта</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                style={styles.input}
              />
            </div>

            {/* Поле Пароль */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="your_password"
                style={styles.input}
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={!email || !password}
              style={{
                ...styles.runBtn,
                background: (!email || !password) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                marginTop: '10px'
              }}
            >
              Зареєструватися/Увійти
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    padding: '40px 16px',
    minHeight: '100vh', justifyContent: 'center',
    display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(160deg, #5ececa 0%, #3a9fbf 40%, #1a6080 100%)',
    color: '#fff',
    fontFamily: 'Frutiger, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: 16,
    gap: 40,
    boxSizing: 'border-box',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px',
  },
  logoBadge: {
    fontWeight: 700, fontSize: 18, color: '#fff',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12, padding: '10px 24px',
  },
  authContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    width: '100%', maxWidth: 400,
  },
  card: {
    width: '100%',
    padding: '32px',
    display: 'flex', flexDirection: 'column', gap: 8,
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: 24,
    border: '2px solid rgba(80,180,255,0.6)',
    boxShadow: '0 0 40px rgba(80,180,255,0.2)',
  },
  title: {
    fontSize: 24, fontWeight: 700, margin: 0, textAlign: 'center'
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 20
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: 16
  },
  inputGroup: {
    display: 'flex', flexDirection: 'column', gap: 6
  },
  label: {
    fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginLeft: 4
  },
  input: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12, padding: '12px 16px',
    color: '#fff', fontSize: 14, outline: 'none',
  },
  runBtn: {
    padding: '14px', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  footerText: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)'
  }
}
