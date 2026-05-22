import { useState } from 'react'

const MODELS = [
  'Claude 3.5 Sonnet',
  'GPT-4o',
  'GPT-4o mini',
  'Claude 3 Opus',
  'Gemini Pro',
]

const CreateAgent = () => {
  const [config, setConfig] = useState({
    name: '',
    instructions: '',
    model: 'Claude 3.5 Sonnet',
    maxSteps: 5,
    forbiddenTopics: '',
  })
  const [maxStepsInput, setMaxStepsInput] = useState('5')

  // 1. Стан для відображення поп-апу
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  function handleSave() {
    if (!config.name.trim() || !config.instructions.trim()) return
    console.log('Saving agent:', config)
  }

  // 2. Функція виходу
  function handleLogout() {
    console.log('Logging out...')
    // Тут можна додати логіку очищення токенів або редирект
  }

  const canSave = config.name.trim() && config.instructions.trim()

  return (
    <div style={styles.root}>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: '#b3f0ff' }}>Studio</span>
        </div>

        <div style={{ position: 'relative' }}>
          <div
            style={styles.profileBar}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            Mary Fedorenko
          </div>

          {showProfileMenu && (
            <div style={styles.popup}>
              <div style={styles.popupItem} onClick={handleLogout}>
                Вийти
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FORM CARD (без змін) */}
      <div style={styles.scroll}>
        <div style={styles.card}>
          <div style={styles.section}>
            <label style={styles.label}>Name</label>
            <input
              value={config.name}
              onChange={e => setConfig({ ...config, name: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Instructions</label>
            <textarea
              value={config.instructions}
              onChange={e => setConfig({ ...config, instructions: e.target.value })}
              rows={7}
              style={styles.textarea}
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Model</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MODELS.map(model => (
                <div
                  key={model}
                  onClick={() => setConfig({ ...config, model })}
                  style={{
                    ...styles.modelChip,
                    background: config.model === model
                      ? 'rgba(255,255,255,0.25)'
                      : 'rgba(0,0,0,0.2)',
                    border: config.model === model
                      ? '1px solid rgba(255,255,255,0.5)'
                      : '1px solid rgba(255,255,255,0.12)',
                    color: config.model === model
                      ? '#fff'
                      : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {model}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Max Iterations</label>
            <input
              type="number"
              min={1} max={20}
              value={maxStepsInput}
              onChange={e => setMaxStepsInput(e.target.value)}
              onBlur={() => {
                const val = Math.min(20, Math.max(1, Number(maxStepsInput) || 1))
                setMaxStepsInput(String(val))
                setConfig({ ...config, maxSteps: val })
              }}
              style={{ ...styles.input, width: 120 }}
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Forbidden Topics</label>
            <input
              value={config.forbiddenTopics}
              onChange={e => setConfig({ ...config, forbiddenTopics: e.target.value })}
              placeholder="e.g. politics, violence, gambling"
              style={styles.input}
            />
            <div style={styles.hint}>Separate topics with commas</div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Tools</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={styles.actionRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={styles.actionIcon}>🔧</span>
                  <div>
                    <div style={styles.actionTitle}>Add tools</div>
                    <div style={styles.actionDesc}>Search, calculator, API</div>
                  </div>
                </div>
                <span style={styles.chevron}>›</span>
              </div>

              <div style={styles.actionRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={styles.actionIcon}>🗄️</span>
                  <div>
                    <div style={styles.actionTitle}>Add files</div>
                    <div style={styles.actionDesc}>PDF or TXT</div>
                  </div>
                </div>
                <span style={styles.chevron}>›</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{
          ...styles.saveBtn,
          background: canSave ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
          border: canSave ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.1)',
          cursor: canSave ? 'pointer' : 'not-allowed',
        }}
      >
        Save agent
      </button>

    </div>
  )
}

const styles = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: 'linear-gradient(160deg, #5ececa 0%, #3a9fbf 40%, #1a6080 100%)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: 12, gap: 10, boxSizing: 'border-box',
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 8px', flexShrink: 0,
  },
  logoBadge: {
    fontWeight: 700, fontSize: 15, color: '#fff',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12, padding: '7px 16px',
  },
  profileBar: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 20, padding: '6px 14px',
    fontSize: 12, fontWeight: 700,
    color: '#fff', cursor: 'pointer',
    userSelect: 'none',
  },
  popup: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    background: 'rgba(25, 45, 60, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: '8px',
    minWidth: '120px',
    zIndex: 100,
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
  },
  popupItem: {
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: '#ff8080',
    cursor: 'pointer',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.05)',
  },
  scroll: { flex: 1, overflowY: 'auto' },
  card: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16,
    border: '2px solid rgba(80,180,255,0.6)',
    boxShadow: '0 0 30px rgba(80,180,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
    padding: 16,
    display: 'flex', flexDirection: 'column',
  },
  section: { padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  label: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.6px', color: 'rgba(255,255,255,1)',
    marginBottom: 10,
  },
  input: {
    width: '100%', background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '10px 14px',
    color: '#fff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '10px 14px',
    color: '#fff', fontSize: 13, outline: 'none',
    resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
    boxSizing: 'border-box',
  },
  modelChip: { padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  actionRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
  },
  hint: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  actionIcon: { fontSize: 20 },
  actionTitle: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  actionDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  chevron: { fontSize: 20, color: 'rgba(255,255,255,0.3)' },
  saveBtn: { padding: '13px', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, backdropFilter: 'blur(8px)', flexShrink: 0 },
}

export default CreateAgent
