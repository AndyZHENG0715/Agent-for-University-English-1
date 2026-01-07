import React, { useEffect, useState } from 'react'
import { Chatbot } from '../hooks/useBotMentions'

interface Props {
  availableBots: Chatbot[]
  onSelect: (botName: string) => void
  trigger: string
}

export default function MentionAutocomplete({ availableBots, onSelect, trigger }: Props) {
  const [filtered, setFiltered] = useState<Chatbot[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!trigger) {
      setShow(false)
      return
    }
    const t = trigger.toLowerCase()
    const matches = availableBots.filter(b => b.name.toLowerCase().includes(t))
    setFiltered(matches)
    setShow(matches.length > 0)
  }, [trigger, availableBots])

  if (!show) return null

  return (
    <div style={{ position: 'absolute', bottom: '48px', left: 0, width: 320 }} className="card">
      {filtered.map(b => (
        <button key={b.id} onClick={() => onSelect(b.name)} className="button ghost" style={{ display:'flex', gap:8, padding:8, alignItems:'center', width:'100%', justifyContent:'flex-start', background:'#fff', border:'none' }}>
          <div style={{ fontSize:20 }}>{b.avatar_emoji || '🤖'}</div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontWeight:600 }}>{b.name}</div>
            <div style={{ fontSize:12, color:'#6b7280' }}>{b.description}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
