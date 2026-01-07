import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockRooms, mockBots } from '../lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Users, Bot, LogOut } from 'lucide-react';

interface RoomListProps {
  onRoomSelect: (roomId: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({ onRoomSelect }) => {
  const { user, logout, toggleRole } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar 
                src={user.avatarUrl} 
                alt={user.name}
                fallback={user.name.charAt(0)}
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
                <p className="text-sm text-muted-foreground">
                  Role: {user.role === 'teacher' ? 'Teacher' : 'Student'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleRole}
              >
                Switch to {user.role === 'teacher' ? 'Student' : 'Teacher'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Chat Rooms</h2>
          <p className="text-muted-foreground">
            Select a room to start learning English with AI assistants
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRooms.map((room) => {
            const roomBots = mockBots.filter(bot => room.botIds.includes(bot.id));
            const memberCount = room.memberIds.length;
            const isTeacher = user.role === 'teacher';

            return (
              <Card 
                key={room.id}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => onRoomSelect(room.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{room.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {room.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Bots */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-medium text-muted-foreground">
                        <Bot className="h-4 w-4 mr-2" />
                        AI Assistants
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {roomBots.map((bot) => (
                          <div 
                            key={bot.id}
                            className="flex items-center space-x-2 bg-secondary/50 rounded-full px-3 py-1"
                          >
                            <Avatar 
                              src={bot.avatarUrl} 
                              alt={bot.name}
                              fallback={bot.name.charAt(0)}
                              className="h-6 w-6"
                            />
                            <span className="text-xs font-medium">{bot.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Members */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </div>
                      <Badge variant="outline">
                        {isTeacher ? 'Manage' : 'Join'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoomList;
