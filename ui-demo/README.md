# University English Platform - UI Verification Demo

This is a high-fidelity frontend demonstration of the University English Platform, built with React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- **Authentication System**: Mock login with access codes
- **Role-Based Views**: Toggle between Teacher and Student perspectives
- **Room List**: Grid of interactive chat room cards with metadata
- **Chat Interface**: Real-time-like conversation with AI bots
- **Bot Responses**: Simulated AI responses based on message content
- **Responsive Design**: Modern, polished UI with Tailwind CSS

## Demo Access Codes

- **Teacher**: `TEACHER123`
- **Student**: `STUDENT001`, `STUDENT002`, `STUDENT003`

## Technology Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **shadcn/ui** component patterns
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
cd ui-demo
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Build

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
ui-demo/
├── src/
│   ├── components/
│   │   └── ui/          # Reusable UI components (button, card, input, etc.)
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── lib/
│   │   ├── types.ts     # TypeScript type definitions
│   │   ├── mock-data.ts # Mock data for users, rooms, bots, messages
│   │   └── utils.ts     # Utility functions
│   ├── pages/
│   │   ├── IdEntryPage.tsx  # Login page
│   │   ├── RoomList.tsx     # Room selection page
│   │   └── ChatRoom.tsx     # Chat interface
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles and Tailwind config
├── package.json
└── vite.config.ts
```

## Available Bots

1. **Grammar Guru**: Helps with grammar and sentence structure
2. **Vocabulary Victor**: Expands vocabulary and teaches new words
3. **Conversation Coach**: Practices conversational English
4. **Writing Wizard**: Assists with essays and creative writing

## Features Demonstrated

### 1. ID Entry Page
- Clean, centered card design
- Access code input with validation
- Loading animations
- Error state handling

### 2. Room List
- Grid layout of room cards
- Bot avatars and member counts
- Teacher vs Student role toggle
- Hover effects and animations

### 3. Chat Interface
- Distinct message bubbles for users and bots
- Scrollable message area
- Sticky input area
- Bot typing indicators
- Real-time-like message flow

### 4. Role Toggle
- Switch between Teacher and Student views
- Different UI elements based on role (Join vs Manage buttons)

## Mock Data

The application uses local mock data stored in `src/lib/mock-data.ts`:
- 4 users (1 teacher, 3 students)
- 4 AI bots with different specialties
- 5 chat rooms with various configurations
- Sample messages and conversation history

Bot responses are generated based on keyword matching in user messages, simulating intelligent conversation without requiring a backend or LLM.

## Notes

- This is a **frontend-only demo** with no backend integration
- All data is stored in memory and resets on page reload
- Bot responses are simulated using simple pattern matching
- Authentication is mocked and bypasses any real security
- Avatar images use placeholder services (may be blocked by ad blockers)

## Future Enhancements

When integrating with a real backend:
- Replace mock data with API calls
- Implement real authentication with Supabase
- Connect to actual LLM services for bot responses
- Add persistent storage for messages and user preferences
- Implement real-time updates with WebSockets

