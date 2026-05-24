import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAgents } from '../api/agents'
import { AppNav } from '../components/AppNav'
import { ProfileMenu } from '../components/ProfileMenu'
import { useAuth } from '../hooks/useAuth'
import { useEventStream } from '../hooks/useEventStream'
import { FileUploadModal } from '../components/FileUploadModal'
import { EventCard, ThinkingCard } from '../components/EventCard'

function getFileIcon(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase()
  const icons = {
    txt: '📄', md: '📝', docx: '📘', xlsx: '📊', pdf: '📕',
    csv: '📊', json: '📋', js: '📜', jsx: '⚛️', ts: '📘', tsx: '⚛️',
    py: '🐍', html: '🌐', css: '🎨', yaml: '⚙️', yml: '⚙️', xml: '📰',
  }
  return icons[ext] || '📎'
}

export function LiveView() {
  const navigate = useNavigate()
  const { apiKeys } = useAuth()
  const [message, setMessage] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [agents, setAgents] = useState([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [agentsError, setAgentsError] = useState('')
  const [activeAgent, setActiveAgent] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [pollTick, setPollTick] = useState(0)
  const { events, status, step, error, run, reset } = useEventStream(pollTick)
  const feedRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function loadAgents() {
      try {
        setAgentsLoading(true)
        setAgentsError('')
        const list = await getAgents()
        if (cancelled) return
        setAgents(list)
        setActiveAgent((prev) => {
          if (prev && list.some((a) => a.id === prev.id)) return prev
          return list[0] ?? null
        })
      } catch (err) {
        if (!cancelled) {
          setAgentsError(err.message || 'Failed to load agents')
        }
      } finally {
        if (!cancelled) setAgentsLoading(false)
      }
    }

    loadAgents()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [events])

  function handleFilesReady(uploaded) {
    setAttachments((prev) => {
      const seen = new Set(prev.map((f) => f.path))
      const next = [...prev]
      uploaded.forEach((file) => {
        if (!seen.has(file.path)) next.push(file)
      })
      return next
    })
  }

  function removeAttachment(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleRun() {
    if ((!message.trim() && attachments.length === 0) || status === 'running' || !activeAgent) return
    const attachmentPaths = attachments.map((f) => f.path)
    const displayMsg = [
      message.trim(),
      attachments.length ? `\n[${attachments.length} attached file(s)]` : '',
    ].filter(Boolean).join('')
    setSentMessage(displayMsg)
    run(activeAgent.id, message, attachmentPaths)
    setMessage('')
    setAttachments([])
  }

  function handleApprovalResolved() {
    setPollTick((t) => t + 1)
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

  function handleReset() {
    reset()
    setSentMessage('')
    setAttachments([])
  }

  const canRun = (message.trim() || attachments.length > 0) && status !== 'running' && !!activeAgent

  const hasPendingApproval = events.some((e) => e.type === 'approval_pending')

  return (
    <div style={styles.root}>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.logoBadge}>
          <span style={styles.logoText}>Agentic</span>
          <span style={styles.logoAccent}>Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AppNav />
          {status === 'running' && (
            <span style={styles.statusRunning}>
              <span style={styles.statusDot} />
              Step {step} · running
            </span>
          )}
          {status === 'done' && (
            <span style={styles.statusDone}>
              <span style={styles.statusDotDone} />
              Done in {step} steps
            </span>
          )}
          {status === 'error' && (
            <span style={styles.statusError}>Run failed</span>
          )}
          <ProfileMenu />
        </div>
      </div>

      {!apiKeys.gemini_configured && (
        <div style={styles.warnBanner}>
          <span style={styles.warnIcon}>⚠</span>
          Add your Gemini API key in{' '}
          <span style={styles.warnLink} onClick={() => navigate('/settings')}>
            Settings
          </span>{' '}
          to run agents.
        </div>
      )}

      {/* BODY */}
      <div style={styles.body}>

        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarLabel}>My Agents</div>
          {agentsLoading && (
            <div style={styles.sidebarHint}>Loading agents...</div>
          )}
          {agentsError && (
            <div style={styles.sidebarError}>{agentsError}</div>
          )}
          {!agentsLoading && agents.length === 0 && (
            <div style={styles.sidebarHint}>
              No agents yet. Create one to get started.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => handleAgentSwitch(agent)}
                style={{
                  ...styles.agentItem,
                  ...(activeAgent?.id === agent.id ? styles.agentItemActive : {}),
                }}
              >
                <div style={{
                  ...styles.agentDot,
                  background: activeAgent?.id === agent.id ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.agentName}>{agent.name}</div>
                </div>
                <button
                  type="button"
                  title="Edit agent tools and settings"
                  style={styles.agentEditBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/constructor?agentId=${agent.id}`)
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>

          <div
            style={styles.newAgentBtn}
            onClick={() => navigate('/constructor')}
          >
            <span style={styles.plusIcon}>+</span>
            New Agent
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={styles.main}>

          <div ref={feedRef} style={styles.feed}>
            {events.length === 0 && status === 'idle' && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>◎</div>
                <div style={styles.emptyTitle}>
                  {activeAgent?.name ?? 'No agent selected'}
                </div>
                <div style={styles.emptySubtitle}>
                  {activeAgent
                    ? 'Ask your agent something to get started'
                    : 'Create an agent in the constructor first'}
                </div>
              </div>
            )}
            {sentMessage && (
              <div style={styles.userBubble}>{sentMessage}</div>
            )}
            {events.map((event, i) => (
              <EventCard
                key={`${i}-${event.approval_id || event.type}`}
                event={event}
                onApprovalResolved={handleApprovalResolved}
              />
            ))}
            {status === 'running' && !hasPendingApproval && <ThinkingCard />}
            {status === 'error' && error && (
              <div style={styles.errorBanner}>{error}</div>
            )}
          </div>

          {/* Input wrapper */}
          <div style={styles.inputWrapper}>

            {/* File chips */}
            {attachments.length > 0 && (
              <div style={styles.fileChipsRow}>
                {attachments.map((file, i) => (
                  <div key={file.path || i} style={styles.fileChip}>
                    <span style={{ fontSize: 13 }}>{getFileIcon(file.name)}</span>
                    <span style={styles.chipName}>{file.name}</span>
                    <span
                      onClick={() => removeAttachment(i)}
                      style={styles.chipRemove}
                      title="Remove"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && removeAttachment(i)}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={styles.inputArea}>

              {/* + Attach button */}
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                style={{
                  ...styles.attachBtn,
                  background: showUploadModal
                    ? 'var(--surface-elevated)'
                    : 'var(--surface-sunken)',
                }}
                title="Attach files"
                disabled={status === 'running'}
                aria-label="Attach files"
              >
                +
              </button>

              <FileUploadModal
                open={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onFilesReady={handleFilesReady}
                disabled={status === 'running'}
              />

              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeAgent
                    ? `Ask ${activeAgent.name} something...`
                    : 'Select or create an agent...'
                }
                disabled={status === 'running' || !activeAgent}
                style={{
                  ...styles.input,
                  opacity: status === 'running' ? 0.5 : 1,
                }}
              />

              {status !== 'idle' && (
                <button onClick={handleReset} style={styles.resetBtn}>New</button>
              )}

              <button
                onClick={handleRun}
                disabled={!canRun}
                style={{
                  ...styles.runBtn,
                  opacity: canRun ? 1 : 0.4,
                  cursor: canRun ? 'pointer' : 'not-allowed',
                }}
              >
                {status === 'running' ? 'Running...' : 'Run'}
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    display: 'flex', 
    flexDirection: 'column', 
    height: '100vh',
    background: 'var(--surface-base)',
    color: 'var(--text-primary)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: 16, 
    gap: 12, 
    boxSizing: 'border-box',
  },
  topBar: {
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: '8px 12px', 
    flexShrink: 0,
  },
  logoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 700, 
    fontSize: 16,
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 20px',
    boxShadow: 'var(--shadow-raised)',
  },
  logoText: {
    color: 'var(--text-primary)',
  },
  logoAccent: {
    color: 'var(--brand-primary)',
  },
  warnBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 180, 50, 0.08)',
    border: '1px solid rgba(255, 180, 50, 0.2)',
    flexShrink: 0,
  },
  warnIcon: {
    fontSize: 14,
    color: '#ffc94d',
  },
  warnLink: {
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: 700,
    color: 'var(--brand-primary)',
  },
  statusRunning: { 
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12, 
    color: 'var(--text-secondary)', 
    background: 'var(--surface-raised)', 
    padding: '8px 16px', 
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-soft)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--brand-primary)',
    animation: 'pulse-soft 1.5s infinite',
  },
  statusDone: { 
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12, 
    color: 'var(--brand-primary)', 
    background: 'var(--surface-raised)', 
    padding: '8px 16px', 
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-accent)',
  },
  statusDotDone: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--brand-primary)',
  },
  statusError: { 
    fontSize: 12, 
    color: '#ff6b6b', 
    background: 'rgba(255, 107, 107, 0.1)', 
    padding: '8px 16px', 
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255, 107, 107, 0.25)',
  },
  errorBanner: {
    fontSize: 13,
    color: '#ff6b6b',
    background: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid rgba(255, 107, 107, 0.25)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
  },
  body: { display: 'flex', flex: 1, gap: 12, overflow: 'hidden' },
  sidebar: {
    width: 200, 
    flexShrink: 0, 
    background: 'var(--surface-raised)',
    borderRadius: 'var(--radius-lg)', 
    border: '1px solid var(--border-default)', 
    padding: 14,
    display: 'flex', 
    flexDirection: 'column', 
    gap: 10, 
    overflowY: 'auto',
    boxShadow: 'var(--shadow-raised)',
  },
  sidebarLabel: { 
    fontSize: 10, 
    fontWeight: 700, 
    textTransform: 'uppercase', 
    letterSpacing: '0.8px', 
    color: 'var(--text-tertiary)', 
    paddingBottom: 8, 
    borderBottom: '1px solid var(--border-subtle)' 
  },
  sidebarHint: { fontSize: 12, color: 'var(--text-tertiary)', padding: '4px 2px' },
  sidebarError: { fontSize: 12, color: '#ff6b6b', padding: '4px 2px' },
  agentItem: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 10, 
    padding: '10px 12px', 
    borderRadius: 'var(--radius-sm)', 
    cursor: 'pointer', 
    transition: 'var(--transition-fast)',
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-pressed)',
  },
  agentItemActive: {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border-accent)',
    boxShadow: 'var(--shadow-soft)',
  },
  agentDot: { 
    width: 8, 
    height: 8, 
    borderRadius: '50%', 
    flexShrink: 0,
    transition: 'var(--transition-fast)',
  },
  agentName: { 
    fontSize: 13, 
    fontWeight: 600, 
    color: 'var(--text-primary)' 
  },
  agentEditBtn: {
    flexShrink: 0,
    padding: '4px 10px',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-default)',
    background: 'var(--surface-raised)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  newAgentBtn: { 
    marginTop: 'auto', 
    padding: '12px 14px', 
    background: 'var(--surface-sunken)', 
    border: '1px dashed var(--border-strong)', 
    borderRadius: 'var(--radius-sm)', 
    fontSize: 12, 
    color: 'var(--text-tertiary)', 
    cursor: 'pointer', 
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'var(--transition-fast)',
  },
  plusIcon: {
    fontSize: 16,
    fontWeight: 300,
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' },
  feed: {
    flex: 1, 
    overflowY: 'auto', 
    padding: '20px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 10,
    background: 'var(--surface-raised)',
    borderRadius: 'var(--radius-lg)', 
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-raised), var(--shadow-glow)',
  },
  userBubble: { 
    alignSelf: 'flex-end', 
    background: 'var(--surface-elevated)', 
    border: '1px solid var(--border-accent)', 
    borderRadius: '18px 18px 6px 18px', 
    padding: '12px 18px', 
    fontSize: 14, 
    color: 'var(--text-primary)', 
    maxWidth: '70%', 
    wordBreak: 'break-word',
    boxShadow: 'var(--shadow-soft)',
  },
  emptyState: { 
    textAlign: 'center', 
    marginTop: 80, 
    color: 'var(--text-tertiary)', 
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    color: 'var(--text-tertiary)',
    opacity: 0.5,
  },
  emptyTitle: {
    fontWeight: 600,
    fontSize: 16,
    color: 'var(--text-secondary)',
  },
  emptySubtitle: {
    fontSize: 13,
  },
  // Input wrapper (chips + row)
  inputWrapper: {
    display: 'flex', 
    flexDirection: 'column', 
    gap: 8, 
    flexShrink: 0,
  },
  fileChipsRow: {
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: 8,
    padding: '2px 4px',
  },
  fileChip: {
    display: 'flex', 
    alignItems: 'center', 
    gap: 6,
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)', 
    padding: '6px 12px',
    fontSize: 11, 
    color: 'var(--text-primary)', 
    maxWidth: 180,
    boxShadow: 'var(--shadow-soft)',
  },
  chipName: {
    overflow: 'hidden', 
    textOverflow: 'ellipsis', 
    whiteSpace: 'nowrap',
    maxWidth: 110,
  },
  chipRemove: {
    cursor: 'pointer', 
    fontSize: 15, 
    opacity: 0.5,
    lineHeight: 1, 
    marginLeft: 2, 
    flexShrink: 0,
    transition: 'var(--transition-fast)',
  },
  inputArea: {
    display: 'flex', 
    gap: 10, 
    padding: '12px 16px',
    background: 'var(--surface-raised)', 
    borderRadius: 'var(--radius-md)', 
    border: '1px solid var(--border-default)',
    alignItems: 'center',
    boxShadow: 'var(--shadow-raised)',
  },
  // + Attach button
  attachBtn: {
    width: 38, 
    height: 38, 
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-secondary)', 
    fontSize: 22, 
    fontWeight: 300,
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    lineHeight: 1, 
    padding: 0, 
    flexShrink: 0,
    transition: 'var(--transition-fast)',
    boxShadow: 'var(--shadow-pressed)',
  },
  input: {
    flex: 1, 
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)', 
    padding: '12px 16px',
    color: 'var(--text-primary)', 
    fontSize: 13, 
    outline: 'none',
    boxShadow: 'var(--shadow-pressed)',
    transition: 'var(--transition-fast)',
  },
  resetBtn: {
    padding: '12px 16px', 
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)', 
    color: 'var(--text-secondary)', 
    fontSize: 13, 
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  runBtn: {
    padding: '12px 22px', 
    border: '1px solid var(--border-accent)',
    borderRadius: 'var(--radius-sm)', 
    color: 'var(--text-primary)', 
    fontSize: 13, 
    fontWeight: 600,
    background: 'var(--surface-elevated)',
    boxShadow: 'var(--shadow-raised)',
    transition: 'var(--transition-fast)',
  },
}
