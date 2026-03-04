# CrewMate - Among Us Dating App

A dating app for Among Us fans to find their player two. Swipe, match, and chat with fellow crewmates.

## Features

- **Email OTP Authentication** - Sign in with email verification codes
- **Profile Onboarding** - 5-step setup: name/age, gender preferences, crewmate color, play style (role/map/style), bio + sus level
- **Swipe Discovery** - Tinder-style card swiping with Among Us themed profile cards showing crewmate avatars and game stats
- **Mutual Matching** - When both users swipe right, it's a match with a celebratory popup
- **Real-time Chat** - Message your matches with auto-refreshing conversations
- **Profile View** - View your crewmate profile with all your Among Us stats

## Tech Stack

- **Frontend**: Expo SDK 53, React Native, NativeWind, React Query, Zustand
- **Backend**: Hono, Prisma (SQLite), Better Auth (Email OTP)
- **Fonts**: Orbitron (headings), Inter (body)
- **Design**: Dark space theme with Among Us color palette

## Database Models

- **User** - Auth user (Better Auth managed)
- **Profile** - Dating profile with Among Us fields (crewmateColor, favoriteRole, favoriteMap, playStyle, susLevel)
- **Swipe** - Left/right swipe records
- **Message** - Chat messages between matched users

## API Endpoints

- `POST /api/auth/*` - Authentication (Better Auth)
- `GET /api/profiles/me` - Get own profile
- `POST /api/profiles/me` - Create/update profile
- `GET /api/profiles/discover` - Get swipeable profiles
- `POST /api/swipes` - Record a swipe (returns isMatch)
- `GET /api/matches` - Get mutual matches with last message
- `GET /api/messages/:userId` - Get chat history
- `POST /api/messages/:userId` - Send a message
