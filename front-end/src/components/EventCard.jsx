import { ApprovalCard } from "./ApprovalCard"

const STYLES = {
  thought: {
    bg: 'var(--surface-sunken)', 
    border: 'var(--border-subtle)',
    label: 'var(--text-tertiary)', 
    text: 'var(--text-secondary)', 
    labelText: 'Thinking',
  },
  tool_call: {
    bg: 'rgba(62, 140, 207, 0.08)', 
    border: 'rgba(62, 140, 207, 0.25)',
    label: '#7eb8e7', 
    text: 'var(--text-primary)', 
    labelText: 'Tool Call',
  },
  tool_result: {
    bg: 'rgba(62, 207, 140, 0.08)', 
    border: 'rgba(62, 207, 140, 0.25)',
    label: 'var(--brand-primary)', 
    text: 'var(--text-primary)', 
    labelText: 'Result',
  },
  final_answer: {
    bg: 'rgba(160, 120, 255, 0.08)', 
    border: 'rgba(160, 120, 255, 0.3)',
    label: '#c4b5fd', 
    text: 'var(--text-primary)', 
    labelText: 'Final Answer',
  },
  max_steps_reached: {
    bg: 'rgba(255, 180, 50, 0.08)', 
    border: 'rgba(255, 180, 50, 0.25)',
    label: '#ffc94d', 
    text: 'var(--text-primary)', 
    labelText: 'Max Steps Reached',
  },
  error: {
    bg: 'rgba(255, 107, 107, 0.08)', 
    border: 'rgba(255, 107, 107, 0.25)',
    label: '#ff6b6b', 
    text: '#fecaca', 
    labelText: 'Error',
  },
}

export function EventCard({ event, onApprovalResolved }) {
  if (event.type === "approval_pending") {
    return <ApprovalCard event={event} onResolved={onApprovalResolved} />
  }

  const s = STYLES[event.type] || STYLES.thought
  const body =
    event.content ||
    event.input ||
    (event.result != null ? String(event.result) : '')

  return (
    <div style={{ 
      background: s.bg, 
      border: `1px solid ${s.border}`, 
      borderRadius: 'var(--radius-md)', 
      padding: '14px 18px',
      boxShadow: 'var(--shadow-soft)',
      animation: 'slide-up 0.2s ease',
    }}>
      <div style={{ 
        fontSize: 10, 
        fontWeight: 700, 
        textTransform: 'uppercase', 
        letterSpacing: '0.8px', 
        color: s.label, 
        marginBottom: 8 
      }}>
        {s.labelText}{event.tool ? ` — ${event.tool}` : ''}
      </div>
      <div style={{ 
        fontSize: 14, 
        lineHeight: 1.7, 
        color: s.text, 
        whiteSpace: 'pre-wrap' 
      }}>
        {body}
      </div>
    </div>
  )
}

export function ThinkingCard() {
  return (
    <>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }
        .thinking-dot { 
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brand-primary);
          display: inline-block;
          margin-right: 4px;
          animation: bounce 1.2s infinite;
          opacity: 0.7;
        }
        .thinking-dot:nth-child(2){animation-delay:.2s}
        .thinking-dot:nth-child(3){animation-delay:.4s}
      `}</style>
      <div style={{ 
        background: 'var(--surface-sunken)', 
        border: '1px solid var(--border-subtle)', 
        borderRadius: 'var(--radius-md)', 
        padding: '14px 18px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        boxShadow: 'var(--shadow-pressed)',
      }}>
        <div>
          <span className="thinking-dot"/>
          <span className="thinking-dot"/>
          <span className="thinking-dot"/>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Agent is thinking...</span>
      </div>
    </>
  )
}
