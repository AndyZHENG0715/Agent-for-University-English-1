import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockRooms, mockBots, mockMessages, getBotResponse } from '../lib/mock-data';
import type { Message } from '../lib/types';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Send, Bot } from 'lucide-react';

interface ChatRoomProps {
  roomId: string;
  onBack: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const room = mockRooms.find(r => r.id === roomId);
  const roomBots = mockBots.filter(bot => room?.botIds.includes(bot.id));

  useEffect(() => {
    // Load mock messages for this room
    const roomMessages = mockMessages.filter(msg => msg.roomId === roomId);
    setMessages(roomMessages);
  }, [roomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    // Note: Using Date.now() for ID generation in this demo
    // In production, use crypto.randomUUID() or a proper ID generation service
    // eslint-disable-next-line react-hooks/purity
    const messageId = `msg-${Date.now()}`;
    
    // Add user message
    const userMessage: Message = {
      id: messageId,
      roomId,
      senderId: user.id,
      senderName: user.name,
      senderType: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Get bot response (use first bot in room)
    if (roomBots.length > 0) {
      const bot = roomBots[0];
      const botResponseContent = getBotResponse(inputMessage, bot.id);
      // Note: Using Date.now() for ID generation in this demo
      // In production, use crypto.randomUUID() or a proper ID generation service
      // eslint-disable-next-line react-hooks/purity
      const botMessageId = `msg-${Date.now()}-bot`;

      const botMessage: Message = {
        id: botMessageId,
        roomId,
        senderId: bot.id,
        senderName: bot.name,
        senderType: 'bot',
        content: botResponseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!room || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{room.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  {roomBots.map((bot) => (
                    <Badge key={bot.id} variant="secondary" className="text-xs">
                      <Bot className="h-3 w-3 mr-1" />
                      {bot.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Avatar 
              src={user.avatarUrl} 
              alt={user.name}
              fallback={user.name.charAt(0)}
              className="h-10 w-10"
            />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 lg:px-8 py-6">
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-full pr-4"
          >
            <div className="space-y-4 pb-4">
              {messages.map((message) => {
                const isBot = message.senderType === 'bot';
                const isCurrentUser = message.senderId === user.id;
                const bot = isBot ? mockBots.find(b => b.id === message.senderId) : null;

                return (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <Avatar 
                      src={isBot ? bot?.avatarUrl : user.avatarUrl} 
                      alt={message.senderName}
                      fallback={message.senderName.charAt(0)}
                      className="h-8 w-8 mt-1"
                    />
                    <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'items-end' : ''}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {message.senderName}
                        </span>
                        {isBot && <Bot className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <Card className={`${
                        isBot 
                          ? 'bg-secondary/50' 
                          : isCurrentUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card'
                      }`}>
                        <CardContent className="p-3">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-start space-x-3">
                  <Avatar 
                    src={roomBots[0]?.avatarUrl} 
                    alt={roomBots[0]?.name}
                    fallback="B"
                    className="h-8 w-8 mt-1"
                  />
                  <Card className="bg-secondary/50">
                    <CardContent className="p-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-900 border-t shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-end space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
