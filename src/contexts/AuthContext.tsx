import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, hasSupabase } from '../lib/supabaseClient'
import { User } from '../lib/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithCode: (accessCode: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function generatePseudonym(accessCode: string) {
  const adjectives = ['Curious','Clever','Quiet','Bold','Swift','Wise','Gentle','Brave']
  const animals = ['Panda','Fox','Dolphin','Eagle','Tiger','Owl','Wolf','Bear']
  const hash = Math.abs(Array.from(accessCode).reduce((acc,c) => acc*31 + c.charCodeAt(0), 0))
  const adj = adjectives[hash % adjectives.length]
  const animal = animals[Math.floor(hash/10) % animals.length]
  return `${adj} ${animal}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('mock_user')
    const code = localStorage.getItem('access_code')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { localStorage.removeItem('mock_user') }
    } else if (code) {
      signInWithCode(code)
    }
    setLoading(false)
  }, [])

  const signInWithCode = async (accessCode: string) => {
    setLoading(true)
    try {
      if (hasSupabase() && supabase) {
        const { data, error } = await supabase.from('users').select('*').eq('access_code', accessCode).single()
        if (error && (error as any).code !== 'PGRST116') throw error

        if (!data) {
          // try rpc create_user_with_pseudonym
          try {
            const { data: newUser, error: rpcErr } = await supabase.rpc('create_user_with_pseudonym', { p_access_code: accessCode })
            if (rpcErr) throw rpcErr
            setUser(newUser as User)
            localStorage.setItem('access_code', accessCode)
            return
          } catch (e) {
            console.error('RPC create user failed', e)
          }
        } else {
          setUser(data as User)
          localStorage.setItem('access_code', accessCode)
          return
        }
      }

      // fallback: create local mock user
      const pseudonym = generatePseudonym(accessCode)
      const mockUser: User = { id: 'local-' + Date.now().toString(36), access_code: accessCode, pseudonym, role: 'student', avatar_emoji: '🤖', created_at: new Date().toISOString() }
      setUser(mockUser)
      localStorage.setItem('mock_user', JSON.stringify(mockUser))
      localStorage.setItem('access_code', accessCode)
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('mock_user')
    localStorage.removeItem('access_code')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithCode, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
