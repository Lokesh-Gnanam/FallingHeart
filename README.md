# FallingHeart ❤️

A modern social gaming and private chat application built with React Native, Expo, TypeScript, and Supabase.

## 🚀 Overview

FallingHeart is a real-time social platform that combines private messaging, friend connections, and multiplayer Bingo gameplay into a single mobile experience.

### Core Features

* 🔐 Secure Authentication
* 👥 Friend System
* 💬 Real-Time Private Chat
* 🟢 Online Presence
* ✍️ Typing Indicators
* 🔔 Push Notifications
* 🎮 Multiplayer Bingo
* 🏆 Leaderboards
* 👤 User Profiles

---

# 🛠 Tech Stack

## Frontend

* React Native
* Expo SDK 56
* TypeScript
* Expo Router
* NativeWind (Tailwind CSS)
* Zustand
* React Native Reanimated
* Moti

## Backend

* Supabase Authentication
* Supabase PostgreSQL
* Supabase Realtime
* Supabase Storage (Future)
* Supabase Edge Functions (Future)

---

# 📦 Project Structure

```plaintext
FallingHeart/
│
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   │
│   ├── (tabs)/
│   │   ├── home.tsx
│   │   ├── chats.tsx
│   │   ├── friends.tsx
│   │   └── profile.tsx
│   │
│   ├── chat/
│   │   └── [id].tsx
│   │
│   └── game/
│       └── bingo.tsx
│
├── src/
│   ├── lib/
│   │   └── supabase.ts
│   │
│   ├── store/
│   ├── services/
│   ├── hooks/
│   ├── components/
│   ├── utils/
│   ├── constants/
│   └── types/
│
├── assets/
├── .env
├── app.json
└── package.json
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone <repository-url>

cd FallingHeart
```

---

## Install Dependencies

```bash
npm install
```

---

## Install Expo Router

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

---

## Install Supabase

```bash
npm install @supabase/supabase-js
```

---

## Install State Management

```bash
npm install zustand
```

---

## Install UI Dependencies

```bash
npm install nativewind
npm install tailwindcss
```

---

## Install Animations

```bash
npm install moti

npx expo install react-native-reanimated

npx expo install lottie-react-native
```

---

# 🔥 Environment Variables

Create a `.env` file in the project root.

```env
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL

EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

---

# 🗄 Database Schema

## Users

```sql
create table users (
  id uuid primary key,
  username text,
  avatar_url text,
  created_at timestamp default now()
);
```

---

## Friends

```sql
create table friends (
  id uuid primary key,
  sender_id uuid,
  receiver_id uuid,
  status text,
  created_at timestamp default now()
);
```

---

## Chats

```sql
create table chats (
  id uuid primary key,
  user1 uuid,
  user2 uuid,
  created_at timestamp default now()
);
```

---

## Messages

```sql
create table messages (
  id uuid primary key,
  chat_id uuid,
  sender_id uuid,
  message text,
  created_at timestamp default now()
);
```

---

## Bingo Rooms

```sql
create table bingo_rooms (
  id uuid primary key,
  room_code text,
  host_id uuid,
  guest_id uuid,
  status text,
  created_at timestamp default now()
);
```

---

## Bingo Moves

```sql
create table bingo_moves (
  id uuid primary key,
  room_id uuid,
  player_id uuid,
  number_called integer,
  created_at timestamp default now()
);
```

---

# 🔐 Authentication

Supported Methods:

* Email & Password
* Magic Links (Optional)
* Google Login (Future)

Authentication is managed through Supabase Auth.

---

# 💬 Realtime Messaging

Realtime chat is powered by Supabase Realtime.

Features:

* Instant Messaging
* Message Delivery
* Online Status
* Typing Indicators
* Chat History

---

# 🎮 Multiplayer Bingo

### Features

* Create Room
* Join Room
* Realtime Sync
* Turn Tracking
* Winner Detection
* Match History

Powered entirely by Supabase Realtime channels.

---

# 🏆 Leaderboards

Track:

* Total Wins
* Games Played
* Win Rate
* Ranking Position

---

# 🔔 Notifications

Future integration:

* Expo Notifications
* Friend Requests
* New Messages
* Match Invites

---

# 🚧 Development

Run development server:

```bash
npx expo start
```

---

Run on web:

```bash
npx expo install react-dom react-native-web @expo/metro-runtime

npm run web
```

---

# 📱 Android Build

Install EAS CLI:

```bash
npm install -g eas-cli
```

Login:

```bash
eas login
```

Configure:

```bash
eas build:configure
```

Build APK:

```bash
eas build --platform android --profile preview
```

Production Build:

```bash
eas build --platform android --profile production
```

---

# 📈 Development Roadmap

## Phase 1

* Authentication
* User Profiles
* Home Screen

## Phase 2

* Friends System
* Chat System
* Realtime Messaging

## Phase 3

* Online Presence
* Typing Indicators
* Notifications

## Phase 4

* Multiplayer Bingo
* Leaderboards
* Match History

## Phase 5

* Media Sharing
* Voice Notes
* Advanced Social Features

---

# 🔒 Security

* Row Level Security (RLS)
* Secure Authentication
* Protected User Data
* Environment Variables
* Session Management

---

# 📄 License

This project is developed for educational and commercial use by the FallingHeart team.

---

## ❤️ FallingHeart

Connecting people through private conversations and social gaming experiences.
