const STYLES = {
  thought: {
    bg: 'rgba(0,30,40,0.45)', border: 'rgba(255,255,255,0.15)',
    label: 'rgba(255,255,255,0.5)', text: 'rgba(255,255,255,0.9)', labelText: 'Thinking',
  },
  tool_call: {
    bg: 'rgba(0,40,80,0.5)', border: 'rgba(100,180,255,0.4)',
    label: '#7dd3fc', text: '#e0f2fe', labelText: 'Tool Call',
  },
  tool_result: {
    bg: 'rgba(0,50,30,0.5)', border: 'rgba(80,220,140,0.4)',
    label: '#6ee7b7', text: '#ecfdf5', labelText: 'Result',
  },
  final_answer: {
    bg: 'rgba(30,0,60,0.55)', border: 'rgba(180,130,255,0.5)',
    label: '#d8b4fe', text: '#fff', labelText: 'Final Answer',
  },
  max_steps_reached: {
    bg: 'rgba(60,30,0,0.5)', border: 'rgba(255,180,50,0.4)',
    label: '#fcd34d', text: '#fef3c7', labelText: 'Max Steps Reached',
  },
}

export function EventCard({ event }) {
  const s = STYLES[event.type] || STYLES.thought
  const body = event.content || event.input || event.result || ''

  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(10px)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: s.label, marginBottom: 6 }}>
        {s.labelText}{event.tool ? ` — ${event.tool}` : ''}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: s.text, whiteSpace: 'pre-wrap' }}>
        {body}
      </div>
    </div>
  )
}

export function ThinkingCard() {
  return (
    <>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        .dot { width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.4);display:inline-block;margin-right:3px;animation:bounce 1.2s infinite; }
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
      `}</style>
      <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div><span className="dot"/><span className="dot"/><span className="dot"/></div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Agent is thinking...</span>
      </div>
    </>
  )
}
