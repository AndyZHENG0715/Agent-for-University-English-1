export interface User {
  id: string
  access_code: string
  pseudonym: string
  role: 'student' | 'teacher'
  avatar_emoji?: string
  created_at?: string
}

export interface Message {
  id: string
  room_id: string
  sender_type: 'user' | 'bot'
  sender_user_id?: string
  sender_bot_id?: string
  content: string
  created_at?: string
  sender_pseudonym?: string
}

export interface Room {
  id: string
  name: string
  description?: string
  created_at?: string
}
