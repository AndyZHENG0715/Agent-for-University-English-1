import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { hasSupabase, supabase } from '../lib/supabaseClient'
import { Room } from '../lib/types'

export default function RoomList() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    const fetchRooms = async () => {
      if (hasSupabase() && supabase) {
        try {
          const { data } = await supabase.from('room_members').select('room:rooms(id,name,description,created_at)').eq('user_id', user?.id)
          if (data) {
            setRooms(data.map((r: any) => r.room))
            return
          }
        } catch (e) { console.error('fetch rooms', e) }
      }

      // fallback: sample rooms
      setRooms([
        { id: 'r1', name: 'English Writing 101', description: 'Intro course room' },
        { id: 'r2', name: 'Peer Review Lab', description: 'Share drafts and get feedback' },
      ])
    }

    fetchRooms()
  }, [user])

  return (
    <div className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2>Your Rooms</h2>
        <div>Welcome, {user?.pseudonym} {user?.avatar_emoji}</div>
      </div>

      <div style={{ marginTop:12 }}>
        {rooms.map(r => (
          <Link key={r.id} to={`/room/${r.id}`} style={{ textDecoration:'none' }}>
            <div className="card" style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{r.name}</div>
                  <div className="small" style={{ color:'#6b7280' }}>{r.description}</div>
                </div>
                <div style={{ alignSelf:'center' }}>Enter →</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
