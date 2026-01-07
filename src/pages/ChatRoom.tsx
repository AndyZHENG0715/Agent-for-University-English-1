import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { hasSupabase, supabase } from '../lib/supabaseClient'
import { Message } from '../lib/types'
import { useBotMentions } from '../hooks/useBotMentions'
import MentionAutocomplete from '../components/MentionAutocomplete'
import { formatDistanceToNow } from 'date-fns'

export default function ChatRoom() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)
  const { availableBots, detectMentions, triggerBotResponse } = useBotMentions(roomId)
  const [mentionTrigger, setMentionTrigger] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomId) return
      if (hasSupabase() && supabase) {
        try {
          const { data } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true })
          if (data) setMessages(data as Message[])
        } catch (e) { console.error(e) }
      } else {
        const raw = localStorage.getItem(`messages:${roomId}`)
        setMessages(raw ? JSON.parse(raw) : [])
      }
    }

    fetchMessages()

    if (hasSupabase() && supabase && roomId) {
      const channel = supabase.channel(`room:${roomId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, payload => {
        setMessages(prev => [...prev, payload.new])
      }).subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [roomId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const persistLocal = (roomId: string, msgs: Message[]) => localStorage.setItem(`messages:${roomId}`, JSON.stringify(msgs))

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || !user || !roomId) return
    setSending(true)
    try {
      if (hasSupabase() && supabase) {
        const { error } = await supabase.from('messages').insert({ room_id: roomId, sender_type: 'user', sender_user_id: user.id, content: newMessage.trim() })
        if (error) throw error
      } else {
        const m: Message = { id: 'm-'+Date.now().toString(36), room_id: roomId, sender_type: 'user', sender_user_id: user.id, content: newMessage.trim(), created_at: new Date().toISOString(), sender_pseudonym: user.pseudonym }
        const next = [...messages, m]
        setMessages(next)
        persistLocal(roomId, next)
      }

      // detect mentions and trigger bots
      const mentioned = detectMentions(newMessage)
      for (const bot of mentioned) {
        await triggerBotResponse(bot.id, roomId, newMessage, user.pseudonym)
      }

      setNewMessage('')
    } catch (e) { console.error(e) }
    finally { setSending(false) }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setNewMessage(v)
    const lastAt = v.lastIndexOf('@')
    if (lastAt !== -1) {
      const after = v.slice(lastAt + 1)
      if (!after.includes(' ')) setMentionTrigger(after)
      else setMentionTrigger('')
    } else setMentionTrigger('')
  }

  const handleMentionSelect = (botName: string) => {
    const lastAt = newMessage.lastIndexOf('@')
    const before = newMessage.slice(0, lastAt)
    setNewMessage(`${before}@${botName} `)
    setMentionTrigger('')
    inputRef.current?.focus()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'80vh' }}>
      <div style={{ flex:1, overflow:'auto', padding:12 }}>
        {messages.map(msg => (
          <div key={msg.id} className="card" style={{ marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontWeight:600 }}>{msg.sender_pseudonym || (msg.sender_user_id ? 'User' : 'Bot')}</div>
              <div className="small">{msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : ''}</div>
            </div>
            <div style={{ marginTop:6 }}>{msg.content}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ borderTop: '1px solid #eee', padding:12, background:'#fff' }}>
        <form onSubmit={handleSend} style={{ display:'flex', gap:8 }}>
          <div style={{ position:'relative', flex:1 }}>
            <MentionAutocomplete availableBots={availableBots} onSelect={handleMentionSelect} trigger={mentionTrigger} />
            <input ref={inputRef} className="input" value={newMessage} onChange={handleInputChange} placeholder="Type a message (use @BotName)" />
          </div>
          <button className="button" type="submit" disabled={sending || !newMessage.trim()}>Send</button>
        </form>
      </div>
    </div>
  )
}
