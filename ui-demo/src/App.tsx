import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import IdEntryPage from './pages/IdEntryPage'
import RoomList from './pages/RoomList'
import ChatRoom from './pages/ChatRoom'

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <IdEntryPage />;
  }

  if (selectedRoomId) {
    return (
      <ChatRoom 
        roomId={selectedRoomId} 
        onBack={() => setSelectedRoomId(null)} 
      />
    );
  }

  return <RoomList onRoomSelect={setSelectedRoomId} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
