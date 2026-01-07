import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let supabase: SupabaseClient | null = null

if (url && anonKey) {
  supabase = createClient(url, anonKey)
}

export { supabase }
export function hasSupabase() { return supabase !== null }
