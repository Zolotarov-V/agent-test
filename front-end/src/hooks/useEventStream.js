import { useState, useCallback } from 'react'

// mock of the file thats being read and data it recieves
// CHANGE IF DOESNT WORK
const MOCK_EVENTS = [
  { type: 'thought', content: 'The user wants to know about AI startups in Ukraine. I should search the web for the most recent information.' },
  { type: 'tool_call', tool: 'web_search', input: 'Ukraine AI startups 2025' },
  { type: 'tool_result', tool: 'web_search', result: 'Found: Grammarly, Reface AI, Respeecher, MacPaw, Petcube. Multiple funding rounds reported in Q1 2025.' },
  { type: 'thought', content: 'Good results. Let me search for specific funding data to give a more complete picture.' },
  { type: 'tool_call', tool: 'web_search', input: 'Ukraine AI startup funding rounds 2025 Crunchbase' },
  { type: 'tool_result', tool: 'web_search', result: 'Reface raised $5M Series A. Respeecher secured $3M. Ukrainian AI market grew 40% YoY according to Dealroom report.' },
  { type: 'final_answer', content: 'Here are the top AI startups in Ukraine in 2025:\n\n1. Grammarly — AI writing assistant, $13B valuation\n2. Reface AI — face swap technology, raised $5M in 2025\n3. Respeecher — voice cloning for film & media, $3M Series A\n4. MacPaw — developer tools with AI features\n5. Petcube — AI-powered pet monitoring\n\nSource: web_search results, Dealroom 2025 report.' },
]

export function useEventStream() {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('idle') // idle | running | done | error
  const [step, setStep] = useState(0)

  const run = useCallback(async (agentId, message) => {
    setEvents([])
    setStatus('running')
    setStep(0)

    // ─── SWITCH TO REAL SSE WHEN BACKEND IS READY ───────────────────────────
    // const res = await fetch(`/api/agents/${agentId}/run/`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message }),
    // })
    // const { run_id } = await res.json()
    // const source = new EventSource(`/api/runs/${run_id}/stream/`)
    // source.onmessage = (e) => {
    //   const event = JSON.parse(e.data)
    //   setEvents(prev => [...prev, event])
    //   if (event.type === 'thought' || event.type === 'tool_call') setStep(s => s + 1)
    //   if (event.type === 'final_answer' || event.type === 'max_steps_reached') {
    //     setStatus('done')
    //     source.close()
    //   }
    // }
    // source.onerror = () => { setStatus('error'); source.close() }
    // ────────────────────────────────────────────────────────────────────────

    // MOCK MODE — simulates real events arriving one by one
    let stepCount = 0
    for (const event of MOCK_EVENTS) {
      await delay(1300)
      if (event.type === 'thought' || event.type === 'tool_call') {
        stepCount++
        setStep(stepCount)
      }
      setEvents(prev => [...prev, event])
      if (event.type === 'final_answer' || event.type === 'max_steps_reached') {
        setStatus('done')
        return
      }
    }
  }, [])

  const reset = useCallback(() => {
    setEvents([])
    setStatus('idle')
    setStep(0)
  }, [])

  return { events, status, step, run, reset }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
