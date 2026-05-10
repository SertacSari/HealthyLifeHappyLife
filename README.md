# HealthyLifeHappyLife — ENS492 Fitness Tracking App

A full-stack mobile fitness tracking application built with **React Native (Expo)**, **Express.js**, and **PostgreSQL**.

## Features

- **Authentication** — Secure signup/login with hashed passwords and JWT tokens
- **Profile Management** — Set daily calorie goals and weekly workout targets
- **Meal Tracking** — Log meals with full macro breakdown (protein, carbs, fats)
- **Workout Tracking** — Log workouts with duration and calories burned
- **Dashboard** — Real-time daily summary with progress bars and macro charts
- **Coach** — AI-powered daily recommendations (rule-based, non-medical wellness tips)
- **Reminders** — Configurable reminder preferences (time, frequency)
- **Social** — Follow/unfollow users, view followers and following lists

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo (TypeScript) |
| Navigation | React Navigation (Bottom Tabs) |
| Backend | Node.js + Express.js |
| Database | PostgreSQL 16 |
| Auth | HMAC-signed JWT + scrypt password hashing |

## Project Structure

```
├── backend/
│   ├── migrations/       # SQL schema files
│   ├── src/
│   │   ├── auth.js       # Password hashing & token management
│   │   ├── config.js     # Environment configuration
│   │   ├── db.js         # PostgreSQL connection pool
│   │   ├── server.js     # Express.js routes
│   │   ├── services.js   # Business logic (async + SQL)
│   │   └── validation.js # Input validation helpers
│   └── test/             # Backend tests
├── mobile/
│   ├── App.tsx            # Main app with tab navigation
│   └── src/
│       ├── api.ts         # REST API client
│       ├── theme.ts       # Design system (colors, spacing)
│       ├── types.ts       # TypeScript type definitions
│       └── screens/       # Screen components
│           ├── AuthScreen.tsx
│           ├── DashboardScreen.tsx
│           ├── MealsScreen.tsx
│           ├── WorkoutsScreen.tsx
│           ├── ProfileScreen.tsx
│           ├── CoachScreen.tsx
│           └── SocialScreen.tsx
└── docs/
    ├── API_CONTRACT.md
    └── screenshots/
```

## Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL 16 (`brew install postgresql@16`)

### 1. Database Setup

```bash
brew services start postgresql@16
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
createdb healthylife
cd backend
psql -d healthylife -f migrations/001_initial_schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Backend runs at `http://localhost:4000`.

### 3. Mobile App

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:4000 npx expo start
```

Then press:
- `w` for web browser
- `i` for iOS Simulator (requires Xcode)
- `a` for Android Emulator (requires Android Studio)

### Device-Specific API URLs

| Platform | API URL |
|---|---|
| iOS Simulator | `http://localhost:4000` |
| Android Emulator | `http://10.0.2.2:4000` |
| Physical device | `http://YOUR_COMPUTER_IP:4000` |

## API Endpoints

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for full details.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | No | Health check |
| POST | /auth/signup | No | Register new user |
| POST | /auth/login | No | Login |
| POST | /auth/logout | Yes | Logout |
| GET | /auth/me | Yes | Current user info |
| GET | /profile | Yes | Get profile |
| PUT | /profile | Yes | Update profile goals |
| POST | /meals | Yes | Log a meal |
| GET | /meals | Yes | List meals |
| POST | /workouts | Yes | Log a workout |
| GET | /workouts | Yes | List workouts |
| GET | /dashboard/summary | Yes | Daily summary |
| GET | /recommendations/daily | Yes | Coach tips |
| GET | /reminders/settings | Yes | Get reminder settings |
| PUT | /reminders/settings | Yes | Update reminders |
| POST | /social/follow | Yes | Follow a user |
| POST | /social/unfollow | Yes | Unfollow a user |
| GET | /social/following | Yes | List following |
| GET | /social/followers | Yes | List followers |

## Engineering Notes

- Passwords are hashed with `crypto.scrypt` and timing-safe comparison
- Token auth uses HMAC-signed JWT with configurable TTL
- Business logic is separated in `services.js` (route handlers are thin)
- PostgreSQL with connection pooling via `pg` library
- All service functions are async with proper error propagation
- Database schema uses foreign keys, check constraints, and indexes
- Recommendation engine has a safety layer blocking medical terminology
