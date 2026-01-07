## 👥 Team Division Strategy

**Person A: Backend & Infrastructure** (Foundation)
**Person B: Auth & Chat Core** (User-facing MVP)
**Person C: Bot System & UI** (AI Integration)

Each person has minimal dependencies on others initially, then merge points are clearly defined.

---

## 🔵 Person A: Backend & Infrastructure

### A1. Database Schema & Supabase Setup

```
Set up Supabase project and create complete database schema.

Project setup:
1. Create new Supabase project (or use existing)
2. Install Supabase CLI:  npm install -g supabase
3. Initialize:  supabase init
4. Link to project: supabase link --project-ref [your-project-ref]

Create migration file: supabase/migrations/001_initial_schema.sql

Tables to create:
1. users (id, access_code UNIQUE, pseudonym, role, avatar_emoji, created_at, last_seen_at)
2. rooms (id, name, description, assignment_id, created_by, created_at, is_active)
3. room_members (id, room_id, user_id, joined_at, UNIQUE constraint)
4. chatbots (id, name, description, system_prompt, avatar_emoji, created_by, is_global, created_at)
5. room_chatbots (id, room_id, chatbot_id, added_by, added_at, UNIQUE constraint)
6. messages (id, room_id, sender_type ENUM, sender_user_id, sender_bot_id, content, mentions UUID[], parent_message_id, created_at)
7. knowledge_base_files (id, room_id, uploaded_by, file_name, file_type, storage_path, file_size_bytes, purpose ENUM, extracted_text, embedding_status ENUM, created_at)
8. file_embeddings (id, file_id, chunk_index, chunk_text, embedding VECTOR(1536), created_at)

Enable extensions:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

Create pseudonym generator function:
CREATE OR REPLACE FUNCTION generate_pseudonym(access_code TEXT)
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['Curious', 'Clever', 'Quiet', 'Bold', 'Swift', 'Wise', 'Gentle', 'Brave', 'Calm', 'Eager', 'Bright', 'Mighty', 'Noble', 'Quick', 'Steady'];
  animals TEXT[] := ARRAY['Panda', 'Fox', 'Dolphin', 'Eagle', 'Tiger', 'Owl', 'Wolf', 'Bear', 'Hawk', 'Lion', 'Otter', 'Raven', 'Falcon', 'Lynx', 'Crane'];
  emojis TEXT[] := ARRAY['🐼', '🦊', '🐬', '🦅', '🐯', '🦉', '🐺', '🐻', '🦅', '🦁', '🦦', '🦅', '🦅', '🐆', '🦢'];
  hash_val BIGINT;
  adj_idx INT;
  animal_idx INT;
BEGIN
  -- Use MD5 hash for deterministic selection
  hash_val := ('x' || substr(md5(access_code), 1, 8))::bit(32)::bigint;
  adj_idx := (hash_val % array_length(adjectives, 1)) + 1;
  animal_idx := ((hash_val / 1000) % array_length(animals, 1)) + 1;

  RETURN adjectives[adj_idx] || ' ' || animals[animal_idx];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

Create function to get emoji for pseudonym:
CREATE OR REPLACE FUNCTION get_avatar_emoji(pseudonym TEXT)
RETURNS TEXT AS $$
DECLARE
  emoji_map JSONB := '{
    "Panda": "🐼", "Fox": "🦊", "Dolphin": "🐬", "Eagle": "🦅",
    "Tiger": "🐯", "Owl": "🦉", "Wolf": "🐺", "Bear": "🐻",
    "Hawk": "🦅", "Lion": "🦁", "Otter":  "🦦", "Raven": "🦅",
    "Falcon": "🦅", "Lynx":  "🐆", "Crane": "🦢"
  }'::jsonb;
  animal TEXT;
BEGIN
  animal := split_part(pseudonym, ' ', 2);
  RETURN COALESCE(emoji_map->>animal, '🤖');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

Create indexes:
CREATE INDEX idx_users_access_code ON users(access_code);
CREATE INDEX idx_messages_room_id_created_at ON messages(room_id, created_at DESC);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_room_members_room_id ON room_members(room_id);
CREATE INDEX idx_file_embeddings_embedding ON file_embeddings USING ivfflat (embedding vector_cosine_ops);

Row Level Security (RLS):
Enable RLS on all tables and create policies:
- Users can read their own data
- Room members can read messages in their rooms
- Teachers can manage rooms and bots
- All authenticated users can insert messages in rooms they're members of

Apply migration:  supabase db push
```

### A2. Supabase Storage Setup

```
Configure Supabase Storage for file uploads.

Create storage buckets:
1. Create bucket "knowledge-base" with these settings:
   - Public:  false
   - File size limit: 10MB
   - Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain

2. Create folder structure via RLS policies:
   - /rooms/{room_id}/reference/
   - /rooms/{room_id}/review/
   - /global/reference/

Storage policies:
1. Upload policy:
   - Anyone authenticated can upload to rooms they're members of
   - Teachers can upload to /global/

2. Download policy:
   - Room members can download files in their rooms
   - All authenticated users can download from /global/

3. Delete policy:
   - File uploader or teachers can delete

Create helper function to generate storage path:
CREATE OR REPLACE FUNCTION generate_storage_path(
  p_room_id UUID,
  p_purpose TEXT,
  p_file_name TEXT
) RETURNS TEXT AS $$
BEGIN
  IF p_room_id IS NULL THEN
    RETURN 'global/reference/' || gen_random_uuid() || '_' || p_file_name;
  ELSE
    RETURN 'rooms/' || p_room_id || '/' || p_purpose || '/' || gen_random_uuid() || '_' || p_file_name;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### A3. Edge Function:  Chat Completion (Basic)

```
Create Supabase Edge Function for AI chat responses using Claude.

File: supabase/functions/chat-completion/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno. env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ChatRequest {
  room_id: string
  bot_id: string
  user_message: string
  user_pseudonym: string
}

serve(async (req) => {
  try {
    const { room_id, bot_id, user_message, user_pseudonym }: ChatRequest = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Get bot configuration
    const { data: bot, error: botError } = await supabase
      .from('chatbots')
      .select('name, system_prompt, avatar_emoji')
      .eq('id', bot_id)
      .single()

    if (botError) throw botError

    // 2. Get last 20 messages for context
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        content,
        sender_type,
        sender_user_id,
        sender_bot_id,
        created_at,
        users: sender_user_id(pseudonym),
        chatbots:sender_bot_id(name)
      `)
      .eq('room_id', room_id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (messagesError) throw messagesError

    // 3. Build conversation context
    const conversationHistory = messages
      .reverse()
      .map((msg:  any) => {
        const sender = msg.sender_type === 'user'
          ? msg.users?. pseudonym || 'Unknown'
          : msg.chatbots?.name || 'Bot'
        return `${sender}: ${msg.content}`
      })
      .join('\n')

    // 4. Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers:  {
        'Content-Type':  'application/json',
        'x-api-key':  ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: `${bot.system_prompt}\n\nConversation context:\n${conversationHistory}\n\nRespond to ${user_pseudonym}'s message naturally. `,
        messages: [
          { role: 'user', content:  user_message }
        ],
      }),
    })

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.statusText}`)
    }

    const claudeData = await claudeResponse.json()
    const botResponse = claudeData.content[0].text

    // 5. Save bot response to database
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        room_id,
        sender_type: 'bot',
        sender_bot_id:  bot_id,
        content:  botResponse,
      })

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ success: true, message: botResponse }),
      { headers: { 'Content-Type':  'application/json' } }
    )

  } catch (error) {
    console.error('Chat completion error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

Deploy with:
supabase functions deploy chat-completion --no-verify-jwt

Set secrets:
supabase secrets set ANTHROPIC_API_KEY=your_key_here
```

**A's Output**:  Database schema deployed, storage configured, chat-completion Edge Function working

---

## 🟢 Person B: Auth & Chat Core

### B1. Project Setup & Auth System

```
Set up React + TypeScript + Tailwind project with authentication.

1. Create new Vite project:
npm create vite@latest ai-learning-platform -- --template react-ts
cd ai-learning-platform

2. Install dependencies:
npm install @supabase/supabase-js @supabase/auth-helpers-react
npm install @tanstack/react-query react-router-dom
npm install date-fns lucide-react

3. Install Tailwind & shadcn/ui:
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
npx shadcn@latest add button input card avatar badge

4. Create . env. local:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

5. Create Supabase client:
File: src/lib/supabase. ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env. VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

6. Create types:
File: src/lib/types.ts

export interface User {
  id: string
  access_code: string
  pseudonym: string
  role: 'student' | 'teacher'
  avatar_emoji: string
  created_at: string
}

export interface Message {
  id: string
  room_id:  string
  sender_type: 'user' | 'bot'
  sender_user_id?:  string
  sender_bot_id?: string
  content: string
  created_at: string
  sender_pseudonym?: string
  sender_name?: string
}

7. Create Auth Context:
File: src/contexts/AuthContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  loading:  boolean
  signInWithCode: (accessCode: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children:  ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for saved access code
    const savedCode = localStorage.getItem('access_code')
    if (savedCode) {
      signInWithCode(savedCode)
    } else {
      setLoading(false)
    }
  }, [])

  const signInWithCode = async (accessCode: string) => {
    try {
      // Look up user by access code
      let { data: existingUser, error } = await supabase
        . from('users')
        .select('*')
        .eq('access_code', accessCode)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (! existingUser) {
        // Create new user with generated pseudonym
        const { data:  newUser, error: insertError } = await supabase
          . rpc('create_user_with_pseudonym', { p_access_code: accessCode })
          .single()

        if (insertError) throw insertError
        existingUser = newUser
      }

      setUser(existingUser)
      localStorage.setItem('access_code', accessCode)

      // Update last_seen_at
      await supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existingUser.id)

    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('access_code')
  }

  return (
    <AuthContext. Provider value={{ user, loading, signInWithCode, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

Note: Need Person A to create this SQL function first:
CREATE OR REPLACE FUNCTION create_user_with_pseudonym(p_access_code TEXT)
RETURNS users AS $$
DECLARE
  new_user users;
  pseudonym TEXT;
  emoji TEXT;
BEGIN
  pseudonym := generate_pseudonym(p_access_code);
  emoji := get_avatar_emoji(pseudonym);

  INSERT INTO users (access_code, pseudonym, avatar_emoji, role)
  VALUES (p_access_code, pseudonym, emoji, 'student')
  RETURNING * INTO new_user;

  RETURN new_user;
END;
$$ LANGUAGE plpgsql;

8. Create ID Entry Page:
File: src/pages/IdEntryPage.tsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function IdEntryPage() {
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signInWithCode } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessCode.trim()) {
      setError('Please enter your access code')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signInWithCode(accessCode. trim())
      navigate('/rooms')
    } catch (err) {
      setError('Invalid access code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to Learning Space</CardTitle>
          <CardDescription>Enter your unique access code to join</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter your access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center text-lg tracking-wider"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entering.. .' : 'Enter Learning Space'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### B2. Chat Room Interface

```
Create real-time chat room with Supabase Realtime.

File: src/pages/ChatRoom. tsx

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Message } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Send } from 'lucide-react'

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch initial messages
  useEffect(() => {
    if (! roomId) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_user: users! sender_user_id(pseudonym, avatar_emoji),
          sender_bot:chatbots!sender_bot_id(name, avatar_emoji)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending:  true })

      if (!error && data) {
        setMessages(data. map(msg => ({
          ... msg,
          sender_pseudonym: msg.sender_user?.pseudonym,
          sender_name: msg. sender_bot?.name,
        })))
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch full message with relations
          const { data } = await supabase
            . from('messages')
            .select(`
              *,
              sender_user:users!sender_user_id(pseudonym, avatar_emoji),
              sender_bot: chatbots!sender_bot_id(name, avatar_emoji)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages(prev => [...prev, {
              ...data,
              sender_pseudonym: data.sender_user?.pseudonym,
              sender_name: data.sender_bot?.name,
            }])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || ! user || ! roomId) return

    setSending(true)
    try {
      // Insert user message
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_type: 'user',
          sender_user_id: user.id,
          content: newMessage. trim(),
        })

      if (error) throw error

      // Check for @mentions and trigger bot responses
      const mentionRegex = /@(\w+)/g
      const mentions = [... newMessage.matchAll(mentionRegex)].map(m => m[1])

      if (mentions.length > 0) {
        // TODO: Person C will handle bot triggering
        console.log('Mentions detected:', mentions)
      }

      setNewMessage('')
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages. map((msg) => {
          const isUser = msg.sender_type === 'user'
          const isCurrentUser = msg.sender_user_id === user?.id

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <div className="flex items-center justify-center w-full h-full text-lg">
                  {isUser ?  msg.sender_user?.avatar_emoji : msg.sender_bot?.avatar_emoji}
                </div>
              </Avatar>

              <div className={`flex flex-col ${isCurrentUser ?  'items-end' : 'items-start'} max-w-[70%]`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {isUser ? msg.sender_pseudonym : msg.sender_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>

                <div className={`rounded-lg px-4 py-2 ${
                  isCurrentUser
                    ? 'bg-blue-600 text-white'
                    : isUser
                    ? 'bg-white border border-gray-200'
                    : 'bg-gray-100 border border-gray-300'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message...  (use @BotName to mention a bot)"
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
```

### B3. Room List & Navigation

```
Create room list page and routing.

File: src/pages/RoomList.tsx

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { MessageSquare, Users } from 'lucide-react'

interface Room {
  id: string
  name: string
  description:  string
  created_at: string
  member_count: number
}

export default function RoomList() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    if (!user) return

    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          room:rooms (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('user_id', user.id)

      if (!error && data) {
        const roomIds = data.map(rm => rm.room.id)

        // Get member counts
        const { data:  counts } = await supabase
          . from('room_members')
          .select('room_id')
          .in('room_id', roomIds)

        const countMap = counts?.reduce((acc, item) => {
          acc[item.room_id] = (acc[item.room_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        setRooms(data.map(rm => ({
          ...rm. room,
          member_count:  countMap? .[rm.room.id] || 0
        })))
      }
    }

    fetchRooms()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Your Rooms</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.pseudonym} {user?.avatar_emoji}
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {rooms.map((room) => (
            <Link key={room.id} to={`/room/${room.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {room.name}
                  </CardTitle>
                  <CardDescription>{room.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {room. member_count} members
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {rooms.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">You're not in any rooms yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Ask your teacher for a room code to join.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

File: src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import IdEntryPage from './pages/IdEntryPage'
import RoomList from './pages/RoomList'
import ChatRoom from './pages/ChatRoom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/" />

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<IdEntryPage />} />
          <Route path="/rooms" element={
            <ProtectedRoute>
              <RoomList />
            </ProtectedRoute>
          } />
          <Route path="/room/:roomId" element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

**B's Output**:  Working auth system, chat room with real-time messages, room list

---

## 🟡 Person C:  Bot System & UI

### C1. Bot Configuration Interface

```
Create bot management system for teachers.

File: src/pages/BotManagement.tsx

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash } from 'lucide-react'

interface Chatbot {
  id: string
  name: string
  description:  string
  system_prompt: string
  avatar_emoji: string
  is_global: boolean
  created_at:  string
}

const PRESET_BOTS = [
  {
    name: 'Citation Helper',
    description: 'Checks APA 7th edition citations and provides formatting help',
    avatar_emoji: '📚',
    system_prompt: `You are a citation expert specializing in APA 7th edition. Help students format their citations correctly, explain citation rules, and identify citation errors. Be patient and educational in your responses.`,
  },
  {
    name:  'Peer Reviewer',
    description: 'Provides constructive feedback on writing',
    avatar_emoji: '✍️',
    system_prompt: `You are a supportive peer reviewer. Provide constructive feedback on writing, highlighting strengths and suggesting improvements. Focus on structure, clarity, argumentation, and academic tone.  Be encouraging and specific.`,
  },
  {
    name: 'Devil\'s Advocate',
    description: 'Challenges arguments to help strengthen them',
    avatar_emoji: '😈',
    system_prompt:  `You play devil's advocate to help students strengthen their arguments. Challenge their claims respectfully, point out potential weaknesses, and suggest counterarguments they should address. Be thought-provoking but supportive.`,
  },
  {
    name: 'Summarization Tutor',
    description: 'Teaches academic summarization techniques',
    avatar_emoji: '📝',
    system_prompt: `You teach academic summarization skills. Help students identify main ideas, distinguish key points from details, and practice paraphrasing. Provide examples and guide them through the summarization process.`,
  },
]

export default function BotManagement() {
  const { user } = useAuth()
  const [bots, setBots] = useState<Chatbot[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar_emoji: '🤖',
    system_prompt: '',
    is_global: false,
  })

  // Only allow teachers
  if (user?.role !== 'teacher') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Only teachers can manage bots. </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  useEffect(() => {
    fetchBots()
  }, [])

  const fetchBots = async () => {
    const { data, error } = await supabase
      .from('chatbots')
      .select('*')
      .or(`created_by.eq.${user.id},is_global.eq.true`)
      .order('created_at', { ascending: false })

    if (! error && data) setBots(data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('chatbots')
      .insert({
        ... formData,
        created_by: user.id,
      })

    if (! error) {
      setIsCreateOpen(false)
      setFormData({
        name: '',
        description: '',
        avatar_emoji:  '🤖',
        system_prompt: '',
        is_global: false,
      })
      fetchBots()
    }
  }

  const handleDelete = async (id: string) => {
    if (! confirm('Delete this bot?')) return

    const { error } = await supabase
      .from('chatbots')
      .delete()
      .eq('id', id)

    if (!error) fetchBots()
  }

  const loadPreset = (preset: typeof PRESET_BOTS[0]) => {
    setFormData({
      ...formData,
      ... preset,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Bot Management</h1>
            <p className="text-gray-600 mt-1">Create and manage AI chatbots</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Bot</DialogTitle>
              </DialogHeader>

              {/* Presets */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Start Templates: </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_BOTS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => loadPreset(preset)}
                      className="justify-start"
                    >
                      <span className="mr-2">{preset.avatar_emoji}</span>
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Bot Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e. target.value })}
                    placeholder="e.g., Citation Helper"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData. description}
                    onChange={(e) => setFormData({ ...formData, description: e.target. value })}
                    placeholder="What does this bot do?"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Avatar Emoji</label>
                  <Input
                    value={formData.avatar_emoji}
                    onChange={(e) => setFormData({ ...formData, avatar_emoji: e.target.value })}
                    placeholder="🤖"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">System Prompt</label>
                  <Textarea
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    placeholder="Define the bot's personality, knowledge, and behavior..."
                    rows={8}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This prompt defines how the bot behaves.  Be specific about its role and tone.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_global"
                    checked={formData.is_global}
                    onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                  />
                  <label htmlFor="is_global" className="text-sm">
                    Make this bot available in all rooms
                  </label>
                </div>

                <Button type="submit" className="w-full">Create Bot</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bot List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <Card key={bot.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{bot.avatar_emoji}</span>
                  {bot.name}
                </CardTitle>
                <CardDescription>{bot.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {bot.is_global && (
                    <Badge variant="secondary">Global</Badge>
                  )}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bot. id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### C2. Bot Mention Detection & Triggering

```
Add bot mention detection and trigger AI responses.

File: src/hooks/useBotMentions.ts

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Chatbot {
  id: string
  name: string
  avatar_emoji: string
}

export function useBotMentions(roomId: string) {
  const [availableBots, setAvailableBots] = useState<Chatbot[]>([])

  useEffect(() => {
    if (!roomId) return

    const fetchBots = async () => {
      // Get bots assigned to this room + global bots
      const { data, error } = await supabase
        .from('room_chatbots')
        .select(`
          chatbot: chatbots (
            id,
            name,
            avatar_emoji
          )
        `)
        .eq('room_id', roomId)

      if (! error && data) {
        setAvailableBots(data.map(rb => rb.chatbot))
      }

      // Also get global bots
      const { data: globalBots } = await supabase
        . from('chatbots')
        .select('id, name, avatar_emoji')
        .eq('is_global', true)

      if (globalBots) {
        setAvailableBots(prev => [...prev, ...globalBots])
      }
    }

    fetchBots()
  }, [roomId])

  const detectMentions = (message: string): Chatbot[] => {
    const mentioned:  Chatbot[] = []

    availableBots.forEach(bot => {
      // Check for @BotName or @Bot Name (case insensitive)
      const pattern = new RegExp(`@${bot.name. replace(/\s+/g, '\\s+')}`, 'i')
      if (pattern.test(message)) {
        mentioned.push(bot)
      }
    })

    return mentioned
  }

  const triggerBotResponse = async (
    botId: string,
    roomId: string,
    userMessage: string,
    userPseudonym: string
  ) => {
    try {
      // Call the Edge Function
      const { data, error } = await supabase. functions.invoke('chat-completion', {
        body: {
          room_id: roomId,
          bot_id: botId,
          user_message: userMessage,
          user_pseudonym: userPseudonym,
        },
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Bot response error:', error)
      throw error
    }
  }

  return { availableBots, detectMentions, triggerBotResponse }
}

Update Person B's ChatRoom. tsx to use this hook:

// Add to imports
import { useBotMentions } from '@/hooks/useBotMentions'

// Inside ChatRoom component
const { availableBots, detectMentions, triggerBotResponse } = useBotMentions(roomId!)

// Update handleSend function:
const handleSend = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!newMessage.trim() || !user || !roomId) return

  setSending(true)
  try {
    // Insert user message
    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_type: 'user',
        sender_user_id: user.id,
        content: newMessage. trim(),
      })

    if (error) throw error

    // Detect mentioned bots
    const mentionedBots = detectMentions(newMessage)

    // Trigger responses for each mentioned bot
    for (const bot of mentionedBots) {
      await triggerBotResponse(bot.id, roomId, newMessage, user.pseudonym)
    }

    setNewMessage('')
  } catch (error) {
    console.error('Send error:', error)
  } finally {
    setSending(false)
  }
}
```

### C3. @Mention Autocomplete

```
Add autocomplete for bot mentions.

File: src/components/MentionAutocomplete.tsx

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/avatar'

interface Bot {
  id: string
  name: string
  avatar_emoji: string
}

interface Props {
  availableBots: Bot[]
  onSelect: (botName: string) => void
  trigger: string // The @ symbol position
  inputRef: React.RefObject<HTMLInputElement>
}

export function MentionAutocomplete({ availableBots, onSelect, trigger, inputRef }: Props) {
  const [filtered, setFiltered] = useState<Bot[]>([])
  const [selected, setSelected] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!trigger) {
      setShow(false)
      return
    }

    // Extract search term after @
    const searchTerm = trigger.toLowerCase()
    const matches = availableBots.filter(bot =>
      bot.name.toLowerCase().includes(searchTerm)
    )

    setFiltered(matches)
    setShow(matches.length > 0)
    setSelected(0)
  }, [trigger, availableBots])

  const handleSelect = (bot: Bot) => {
    onSelect(bot.name)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border rounded-lg shadow-lg overflow-hidden">
      {filtered.map((bot, idx) => (
        <button
          key={bot.id}
          onClick={() => handleSelect(bot)}
          className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 ${
            idx === selected ?  'bg-gray-50' : ''
          }`}
        >
          <Avatar className="h-8 w-8">
            <div className="flex items-center justify-center w-full h-full text-lg">
              {bot.avatar_emoji}
            </div>
          </Avatar>
          <div className="text-left">
            <div className="font-medium text-sm">{bot.name}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

// Update ChatRoom. tsx input section:
import { MentionAutocomplete } from '@/components/MentionAutocomplete'

// Add state for mention detection
const [mentionTrigger, setMentionTrigger] = useState('')
const inputRef = useRef<HTMLInputElement>(null)

// Handle input change
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value
  setNewMessage(value)

  // Detect @ symbol
  const lastAtIndex = value.lastIndexOf('@')
  if (lastAtIndex !== -1) {
    const afterAt = value.slice(lastAtIndex + 1)
    if (! afterAt.includes(' ')) {
      setMentionTrigger(afterAt)
    } else {
      setMentionTrigger('')
    }
  } else {
    setMentionTrigger('')
  }
}

const handleMentionSelect = (botName:  string) => {
  const lastAtIndex = newMessage.lastIndexOf('@')
  const before = newMessage.slice(0, lastAtIndex)
  setNewMessage(`${before}@${botName} `)
  setMentionTrigger('')
  inputRef.current?.focus()
}

// Update the input in JSX:
<div className="relative">
  <MentionAutocomplete
    availableBots={availableBots}
    onSelect={handleMentionSelect}
    trigger={mentionTrigger}
    inputRef={inputRef}
  />
  <Input
    ref={inputRef}
    value={newMessage}
    onChange={handleInputChange}
    placeholder="Type a message...  (use @BotName to mention)"
    disabled={sending}
    className="flex-1"
  />
</div>
```

**C's Output**:  Bot management UI, bot triggering system, @mention autocomplete

---

## 🔗 Merge Points

### Stage 1:
- **A** shares:  Supabase project URL + anon key
- **B** and **C** update their `.env. local`

### Stage 2:
- **B** merges **C**'s bot hooks into ChatRoom
- **A** tests Edge Function with **C**'s bot triggering code

### Stage 3:
- Full integration test:  Create room → Add bot → Send @mention → Get AI response

---

## ✅ Success Criteria for MVP

- [ ] User can enter access code and get pseudonym
- [ ] User can see room list
- [ ] User can send messages in real-time chat
- [ ] Teacher can create custom bots
- [ ] User can @mention bot and get AI response
- [ ] Messages persist in database

---

This breakdown lets all 3 work in parallel with minimal blocking!  🚀
