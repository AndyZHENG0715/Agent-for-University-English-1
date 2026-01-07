export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  accessCode: string;
  avatarUrl?: string;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  personality: string;
  avatarUrl?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  botIds: string[];
  createdAt: Date;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string; // Can be user ID or bot ID
  senderName: string;
  senderType: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
