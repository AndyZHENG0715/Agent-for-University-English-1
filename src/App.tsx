import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import IdEntryPage from './pages/IdEntryPage'
import RoomList from './pages/RoomList'
import ChatRoom from './pages/ChatRoom'
import BotManagement from './pages/BotManagement'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/" />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<IdEntryPage />} />
          <Route path="/rooms" element={<ProtectedRoute><RoomList /></ProtectedRoute>} />
          <Route path="/room/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
          <Route path="/bots" element={<ProtectedRoute><BotManagement /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
