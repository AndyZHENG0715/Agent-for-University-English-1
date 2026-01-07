import { useState, useEffect } from 'react'
import { supabase, hasSupabase } from '../lib/supabaseClient'

export interface Chatbot {
  id: string
  name: string
  description?: string
  avatar_emoji?: string
  system_prompt?: string
  is_global?: boolean
  created_at?: string
}

const MOCK_KEY = 'personc:mock_bots'

function readLocalBots(): Chatbot[] {
  try {
    const raw = localStorage.getItem(MOCK_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function writeLocalBots(bots: Chatbot[]) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(bots))
}

export function useBotMentions(roomId?: string) {
  const [availableBots, setAvailableBots] = useState<Chatbot[]>([])

  useEffect(() => {
    const fetchBots = async () => {
      if (hasSupabase() && supabase) {
        try {
          // get room bots
          const { data: roomBots } = await supabase
            .from('room_chatbots')
            .select('chatbot(id,name,avatar_emoji,is_global)')
            .eq('room_id', roomId)

          const mapped = (roomBots || []).map((r: any) => r.chatbot)

          const { data: globalBots } = await supabase
            .from('chatbots')
            .select('id,name,avatar_emoji,is_global')
            .eq('is_global', true)

          const globals = globalBots || []
          setAvailableBots([...mapped, ...globals])
          return
        } catch (e) {
          console.error('Supabase fetch bots error', e)
        }
      }

      // fallback: local storage
      setAvailableBots(readLocalBots())
    }

    fetchBots()
  }, [roomId])

  const detectMentions = (message: string) => {
    const mentioned: Chatbot[] = []
    availableBots.forEach(bot => {
      const pattern = new RegExp(`@${bot.name.replace(/\s+/g, '\\s+')}`, 'i')
      if (pattern.test(message)) mentioned.push(bot)
    })
    return mentioned
  }

  const triggerBotResponse = async (
    botId: string,
    roomId: string | undefined,
    userMessage: string,
    userPseudonym: string
  ) => {
    // If supabase functions available, try invoke, else mock
    if (hasSupabase() && supabase) {
      try {
        const res = await supabase.functions.invoke('chat-completion', {
          body: { room_id: roomId, bot_id: botId, user_message: userMessage, user_pseudonym: userPseudonym }
        })
        return res
      } catch (e) {
        console.error('Functions invoke failed', e)
      }
    }

    // Mock response: echo with suggestion
    const bot = availableBots.find(b => b.id === botId)
    const text = `${bot?.avatar_emoji || '🤖'} ${bot?.name || 'Bot'} responds to ${userPseudonym}: "I read your message and suggest improving clarity. (mock response)"`
    // Simulate saving message to messages table omitted here in demo
    return { success: true, message: text }
  }

  const createBot = async (b: Partial<Chatbot>) => {
    if (hasSupabase() && supabase) {
      try {
        const { data, error } = await supabase.from('chatbots').insert({ ...b }).select().single()
        if (error) throw error
        return data
      } catch (e) {
        console.error('createBot supabase error', e)
        throw e
      }
    }

    const current = readLocalBots()
    const newBot: Chatbot = {
      id: 'local-' + Date.now().toString(36),
      name: b.name || 'Bot',
      description: b.description,
      avatar_emoji: b.avatar_emoji || '🤖',
      system_prompt: b.system_prompt,
      is_global: !!b.is_global,
      created_at: new Date().toISOString(),
    }
    const next = [newBot, ...current]
    writeLocalBots(next)
    setAvailableBots(next)
    return newBot
  }

  const deleteBot = async (id: string) => {
    if (hasSupabase() && supabase) {
      try {
        const { error } = await supabase.from('chatbots').delete().eq('id', id)
        if (error) throw error
        setAvailableBots(prev => prev.filter(b => b.id !== id))
        return true
      } catch (e) {
        console.error('delete supabase', e)
        throw e
      }
    }

    const next = readLocalBots().filter(b => b.id !== id)
    writeLocalBots(next)
    setAvailableBots(next)
    return true
  }

  return { availableBots, detectMentions, triggerBotResponse, createBot, deleteBot }
}
