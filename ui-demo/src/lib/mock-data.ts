import type { User, Bot, Room, Message } from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Dr. Smith',
    role: 'teacher',
    accessCode: 'TEACHER123',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrSmith'
  },
  {
    id: 'user-2',
    name: 'Alice Johnson',
    role: 'student',
    accessCode: 'STUDENT001',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
  },
  {
    id: 'user-3',
    name: 'Bob Williams',
    role: 'student',
    accessCode: 'STUDENT002',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
  },
  {
    id: 'user-4',
    name: 'Carol Davis',
    role: 'student',
    accessCode: 'STUDENT003',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol'
  }
];

// Mock Bots
export const mockBots: Bot[] = [
  {
    id: 'bot-1',
    name: 'Grammar Guru',
    description: 'Helps with grammar and sentence structure',
    personality: 'Friendly and patient, loves to explain grammatical rules',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=GrammarGuru'
  },
  {
    id: 'bot-2',
    name: 'Vocabulary Victor',
    description: 'Expands your vocabulary and teaches new words',
    personality: 'Enthusiastic about words and their meanings',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=VocabVictor'
  },
  {
    id: 'bot-3',
    name: 'Conversation Coach',
    description: 'Practices conversational English',
    personality: 'Casual and encouraging, great for practice',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ConvoCoach'
  },
  {
    id: 'bot-4',
    name: 'Writing Wizard',
    description: 'Assists with essays and creative writing',
    personality: 'Thoughtful and detailed, provides constructive feedback',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=WritingWiz'
  }
];

// Mock Rooms
export const mockRooms: Room[] = [
  {
    id: 'room-1',
    name: 'Grammar Practice',
    description: 'Master English grammar with Grammar Guru',
    memberIds: ['user-1', 'user-2', 'user-3'],
    botIds: ['bot-1'],
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'room-2',
    name: 'Vocabulary Building',
    description: 'Expand your vocabulary with interactive exercises',
    memberIds: ['user-1', 'user-2', 'user-4'],
    botIds: ['bot-2'],
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'room-3',
    name: 'Conversation Club',
    description: 'Practice everyday English conversations',
    memberIds: ['user-1', 'user-2', 'user-3', 'user-4'],
    botIds: ['bot-3'],
    createdAt: new Date('2024-01-25')
  },
  {
    id: 'room-4',
    name: 'Writing Workshop',
    description: 'Improve your writing skills with guided practice',
    memberIds: ['user-1', 'user-3', 'user-4'],
    botIds: ['bot-4'],
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'room-5',
    name: 'Advanced English',
    description: 'Multi-bot room for comprehensive learning',
    memberIds: ['user-1', 'user-2', 'user-3', 'user-4'],
    botIds: ['bot-1', 'bot-2', 'bot-3'],
    createdAt: new Date('2024-02-05')
  }
];

// Mock Messages (sample for one room)
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    roomId: 'room-1',
    senderId: 'user-2',
    senderName: 'Alice Johnson',
    senderType: 'user',
    content: 'Hi! Can you help me with present perfect tense?',
    timestamp: new Date('2024-02-10T10:00:00')
  },
  {
    id: 'msg-2',
    roomId: 'room-1',
    senderId: 'bot-1',
    senderName: 'Grammar Guru',
    senderType: 'bot',
    content: 'Hello Alice! I\'d be happy to help you with present perfect tense. It\'s used for actions that started in the past and continue to the present, or for actions in the past with a result in the present. The structure is: have/has + past participle. Would you like some examples?',
    timestamp: new Date('2024-02-10T10:00:15')
  },
  {
    id: 'msg-3',
    roomId: 'room-1',
    senderId: 'user-2',
    senderName: 'Alice Johnson',
    senderType: 'user',
    content: 'Yes please! Can you give me some examples?',
    timestamp: new Date('2024-02-10T10:01:00')
  },
  {
    id: 'msg-4',
    roomId: 'room-1',
    senderId: 'bot-1',
    senderName: 'Grammar Guru',
    senderType: 'bot',
    content: 'Of course! Here are some examples:\n\n1. "I have lived in London for five years." (still living there)\n2. "She has finished her homework." (the result is that homework is done)\n3. "They have visited Paris three times." (experience up to now)\n\nTry making your own sentence!',
    timestamp: new Date('2024-02-10T10:01:30')
  }
];

// Helper function to get bot responses
export const getBotResponse = (userMessage: string, botId: string): string => {
  const bot = mockBots.find(b => b.id === botId);
  if (!bot) return "I'm here to help!";

  // Simple bot response logic based on keywords
  const message = userMessage.toLowerCase();

  if (botId === 'bot-1') { // Grammar Guru
    if (message.includes('help') || message.includes('question')) {
      return "I'm here to help with your grammar questions! What would you like to know?";
    }
    if (message.includes('tense')) {
      return "English tenses can be tricky! Which tense are you working on - present, past, or future?";
    }
    if (message.includes('thanks') || message.includes('thank')) {
      return "You're welcome! Keep practicing and you'll master it in no time!";
    }
    return "That's an interesting question about grammar! Let me explain: " + userMessage;
  }

  if (botId === 'bot-2') { // Vocabulary Victor
    if (message.includes('word') || message.includes('meaning')) {
      return "Great question! Let me help you understand that word better. Context is key for vocabulary!";
    }
    if (message.includes('synonym')) {
      return "Looking for synonyms is a great way to expand your vocabulary! Let me suggest some alternatives.";
    }
    return "Excellent vocabulary practice! Here's what that means: " + userMessage;
  }

  if (botId === 'bot-3') { // Conversation Coach
    if (message.includes('hello') || message.includes('hi')) {
      return "Hello! How are you doing today? Let's have a nice conversation!";
    }
    if (message.includes('practice')) {
      return "Great! Let's practice together. Tell me about your day or any topic you'd like to discuss.";
    }
    return "That's great to hear! Tell me more about that. " + userMessage;
  }

  if (botId === 'bot-4') { // Writing Wizard
    if (message.includes('essay') || message.includes('write')) {
      return "Writing is a wonderful way to express yourself! What type of writing are you working on?";
    }
    if (message.includes('feedback')) {
      return "I'd be happy to give you feedback! Share your writing and I'll provide constructive suggestions.";
    }
    return "Interesting writing topic! Let's develop that idea further: " + userMessage;
  }

  return "Thanks for your message! I'm here to help you learn English.";
};
