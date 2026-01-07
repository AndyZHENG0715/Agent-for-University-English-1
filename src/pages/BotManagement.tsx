import React, { useEffect, useState, useRef } from 'react'
import { useBotMentions, Chatbot } from '../hooks/useBotMentions'
import MentionAutocomplete from '../components/MentionAutocomplete'

const PRESET_BOTS: Partial<Chatbot>[] = [
  {
    name: 'Citation Helper',
    description: 'Checks APA 7th edition citations and provides formatting help',
    avatar_emoji: '📚',
    system_prompt: 'You are a citation expert specializing in APA 7th edition.'
  },
  {
    name: 'Peer Reviewer',
    description: 'Provides constructive feedback on writing',
    avatar_emoji: '✍️',
    system_prompt: 'You are a supportive peer reviewer.'
  },
  {
    name: "Devil's Advocate",
    description: 'Challenges arguments to help strengthen them',
    avatar_emoji: '😈',
    system_prompt: "You play devil's advocate to help students strengthen their arguments."
  }
]

export default function BotManagement() {
  const { availableBots, createBot, deleteBot, triggerBotResponse } = useBotMentions()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', avatar_emoji: '🤖', system_prompt: '', is_global: false })
  const [role] = useState((import.meta.env.VITE_USER_ROLE as string) || 'teacher')

  // simple mention demo states
  const [message, setMessage] = useState('')
  const [mentionTrigger, setMentionTrigger] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    // ensure there's at least one mock bot for demo if no supabase
    if (availableBots.length === 0) {
      // noop here — use create via UI
    }
  }, [availableBots.length])

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!form.name.trim()) return
    const b = await createBot(form)
    setForm({ name: '', description: '', avatar_emoji: '🤖', system_prompt: '', is_global: false })
    setIsCreateOpen(false)
    setLog(prev => [`Created bot ${b.name}`, ...prev])
  }

  const handlePreset = (p: Partial<Chatbot>) => setForm(f => ({ ...f, ...p }))

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!message.trim()) return
    const mentioned = availableBots.filter(b => new RegExp(`@${b.name.replace(/\s+/g,'\\s+')}`, 'i').test(message))
    setLog(prev => [`You: ${message}`, ...prev])
    for (const bot of mentioned) {
      const res: any = await triggerBotResponse(bot.id, 'demo-room', message, 'Student007')
      const text = res?.message || JSON.stringify(res)
      setLog(prev => [`${bot.avatar_emoji || '🤖'} ${bot.name}: ${text}`, ...prev])
    }
    setMessage('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setMessage(v)
    const lastAt = v.lastIndexOf('@')
    if (lastAt !== -1) {
      const after = v.slice(lastAt + 1)
      if (!after.includes(' ')) setMentionTrigger(after)
      else setMentionTrigger('')
    } else setMentionTrigger('')
  }

  const handleMentionSelect = (botName: string) => {
    const lastAt = message.lastIndexOf('@')
    const before = message.slice(0, lastAt)
    setMessage(`${before}@${botName} `)
    setMentionTrigger('')
    inputRef.current?.focus()
  }

  if (role !== 'teacher') {
    return <div className="card">Only teachers can manage bots. Set VITE_USER_ROLE=teacher to demo.</div>
  }

  return (
    <div className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <h2>Bot Management</h2>
        <button className="button" onClick={() => setIsCreateOpen(s => !s)}>{isCreateOpen ? 'Close' : 'Create Bot'}</button>
      </div>

      {isCreateOpen && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom:12 }}>
          <div style={{ marginBottom:8 }}>
            <label className="small">Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={{ marginBottom:8 }}>
            <label className="small">Description</label>
            <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ marginBottom:8 }}>
            <label className="small">Avatar Emoji</label>
            <input className="input" value={form.avatar_emoji} onChange={e => setForm({ ...form, avatar_emoji: e.target.value })} />
          </div>
          <div style={{ marginBottom:8 }}>
            <label className="small">System Prompt</label>
            <textarea className="input" rows={5} value={form.system_prompt} onChange={e => setForm({ ...form, system_prompt: e.target.value })} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="button" type="submit">Create</button>
            <button type="button" className="button ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
          </div>

          <div style={{ marginTop:12 }}>
            <div className="small">Presets:</div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              {PRESET_BOTS.map(p => (
                <button key={p.name} type="button" className="button ghost" onClick={() => handlePreset(p)}>{p.avatar_emoji} {p.name}</button>
              ))}
            </div>
          </div>
        </form>
      )}

      <section style={{ marginBottom:20 }}>
        <h3>Existing Bots</h3>
        <div className="bot-list">
          {availableBots.length === 0 && <div className="card">No bots yet. Create one above.</div>}
          {availableBots.map(b => (
            <div key={b.id} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:600 }}>{b.avatar_emoji} {b.name}</div>
                  <div className="small" style={{ color:'#6b7280' }}>{b.description}</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="button ghost" onClick={() => { deleteBot(b.id) }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Mention Demo</h3>
        <div className="card" style={{ position:'relative' }}>
          <div style={{ marginBottom:8 }}>
            <div style={{ position:'relative' }}>
              <MentionAutocomplete availableBots={availableBots} onSelect={handleMentionSelect} trigger={mentionTrigger} />
              <input ref={inputRef} className="input" value={message} onChange={handleInputChange} placeholder="Type message and use @BotName" />
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="button" onClick={handleSend}>Send</button>
          </div>

          <div style={{ marginTop:12 }}>
            <h4>Log</h4>
            <div style={{ maxHeight:240, overflow:'auto' }}>
              {log.map((l,i) => <div key={i} className="small" style={{ borderBottom:'1px solid #f3f4f6', padding:'6px 0' }}>{l}</div>)}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
