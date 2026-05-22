import { useState, useRef, useEffect } from 'react'
import { useEventStream } from '../hooks/useEventStream'
import { EventCard, ThinkingCard } from '../components/EventCard'

const AGENT_ID = 1 // replace with real ID once backend is ready

const MOCK_AGENTS = [
  { id: 1, name: 'Research Assistant', active: true },
  { id: 2, name: 'Customer Support', active: false },
  { id: 3, name: 'Data Analyst', active: false },
]

export function LiveView() {
  const [message, setMessage] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [activeAgent, setActiveAgent] = useState(MOCK_AGENTS[0])
  const { events, status, step, run, reset } = useEventStream()
  const feedRef = useRef(null)

  // Стан для поп-апу профілю
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [events])

  function handleRun() {
    if (!message.trim() || status === 'running') return
    setSentMessage(message)
    run(AGENT_ID, message)
    setMessage('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRun()
    }
  }

  function handleAgentSwitch(agent) {
    setActiveAgent(agent)
    setSentMessage('')
    reset()
  }

  function handleLogout() {
    console.log('Logging out...')
    // Додай тут логіку виходу, наприклад: window.location.href = '/login'
  }

  return (
    <div style={styles.root}>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.logoBadge}>
          Agentic<span style={{ color: '#b3f0ff' }}>Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {status === 'running' && (
            <span style={styles.statusRunning}>Step {step} · running...</span>
          )}
          {status === 'done' && (
            <span style={styles.statusDone}>Done in {step} steps</span>
          )}

          {/* Профіль з поп-апом */}
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
      </div>

      {/* BODY */}
      <div style={styles.body}>

        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarLabel}>My Agents</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MOCK_AGENTS.map(agent => (
              <div
                key={agent.id}
                onClick={() => handleAgentSwitch(agent)}
                style={{
                  ...styles.agentItem,
                  background: activeAgent.id === agent.id
                    ? 'rgba(255,255,255,0.28)'
                    : 'rgba(0,0,0,0.2)',
                  border: activeAgent.id === agent.id
                    ? '1px solid rgba(255,255,255,0.5)'
                    : '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div style={styles.agentDot} />
                <div>
                  <div style={styles.agentName}>{agent.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.newAgentBtn}>+ New Agent</div>
        </div>

        {/* MAIN CONTENT */}
        <div style={styles.main}>

          <div ref={feedRef} style={styles.feed}>
            {events.length === 0 && status === 'idle' && (
              <div style={styles.emptyState}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{activeAgent.name}</div>
                <div>Ask your agent something to get started</div>
              </div>
            )}
            {sentMessage && (
              <div style={styles.userBubble}>{sentMessage}</div>
            )}
            {events.map((event, i) => (
              <EventCard key={i} event={event} />
            ))}
            {status === 'running' && <ThinkingCard />}
          </div>

          {/* Input Area */}
          <div style={styles.inputArea}>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${activeAgent.name} something...`}
              disabled={status === 'running'}
              style={{
                ...styles.input,
                opacity: status === 'running' ? 0.5 : 1,
              }}
            />
            {status !== 'idle' && (
              <button onClick={() => { reset(); setSentMessage('') }} style={styles.resetBtn}>New</button>
            )}
            <button
              onClick={handleRun}
              disabled={status === 'running' || !message.trim()}
              style={{
                ...styles.runBtn,
                background: status === 'running' || !message.trim()
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(255,255,255,0.25)',
                cursor: status === 'running' || !message.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'running' ? 'Running...' : 'Run'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  // Копіюємо стилі з попередньої версії та додаємо нові для поп-апу
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

  // Стилі для Поп-апу
  popup: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    background: 'rgba(25, 45, 60, 0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: '6px',
    minWidth: '130px',
    zIndex: 1000,
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
  },
  popupItem: {
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: '#ff8080',
    cursor: 'pointer',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.05)',
  },

  // Всі інші стилі без змін
  statusRunning: { fontSize: 12, color: '#fff', background: 'rgba(255,255,255,0.15)', padding: '5px 14px', borderRadius: 20, backdropFilter: 'blur(8px)' },
  statusDone: { fontSize: 12, color: '#fff', background: 'rgba(255,255,255,0.15)', padding: '5px 14px', borderRadius: 20 },
  body: { display: 'flex', flex: 1, gap: 10, overflow: 'hidden' },
  sidebar: {
    width: 180, flexShrink: 0, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
    borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto',
  },
  sidebarLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.8)', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.08)' },
  agentItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' },
  agentDot: { width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', flexShrink: 0 },
  agentName: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  newAgentBtn: { marginTop: 'auto', padding: '8px 10px', background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textAlign: 'center' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' },
  feed: {
    flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
    borderRadius: 16, border: '2px solid rgba(80,180,255,0.6)', boxShadow: '0 0 30px rgba(80,180,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  userBubble: { alignSelf: 'flex-end', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', fontSize: 14, color: '#fff', maxWidth: '70%', wordBreak: 'break-word', backdropFilter: 'blur(8px)' },
  emptyState: { textAlign: 'center', marginTop: 60, color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  inputArea: { display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(12px)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 },
  input: { flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '9px 14px', color: '#fff', fontSize: 13, outline: 'none' },
  resetBtn: { padding: '9px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 13, cursor: 'pointer' },
  runBtn: { padding: '9px 18px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600 },
}
