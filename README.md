# ENS492 Month 1 MVP Implementation

This repository now contains a coded Month 1 MVP foundation aligned to:
[ENS492_Improved_Project_Plan.md](/Users/sertac/Desktop/ENS492/ENS492_Improved_Project_Plan.md)

## Implemented Scope

- Authentication: signup, login, token-based protected routes
- Logout endpoint for token-based client session clearing
- Profile: fetch and update profile goals
- Diet tracking: add and list meals
- Workout tracking: add and list workouts
- Dashboard: daily summary endpoint
- Mobile app: auth + dashboard + meals + workouts + profile tabs with real lists/forms
- Verification: automated backend smoke test for end-to-end Month 1 core flow

## Project Structure

- `backend/`: Node.js API server and JSON persistence
- `mobile/`: React Native app for full Month 1 core user flow
- `docs/`: API contracts and Month 1 completion checklist

## Quick Start

### 0. One Terminal (Root)

```bash
cd /Users/sertac/Desktop/ENS492
npm run dev
```

This starts backend and mobile together in one terminal.
Press `Ctrl+C` to stop both.

### 1. Backend

```bash
cd backend
cp .env.example .env
npm run start
```

Backend runs at `http://localhost:4000`.

### 2. Backend Verification

```bash
cd backend
npm run test
npm run smoke
```

### 3. Mobile App

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:4000 npm run start
```

Prefer setting `EXPO_PUBLIC_API_URL` if your backend host differs from `http://localhost:4000`, especially for device testing on the same local network.
Edit the fallback value in [mobile/src/api.ts](/Users/sertac/Desktop/ENS492/mobile/src/api.ts) only if you want to change the default permanently.

Examples:

- iOS simulator on the same Mac: `EXPO_PUBLIC_API_URL=http://localhost:4000 npm run start`
- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 npm run start`
- Real phone on the same Wi-Fi: `EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:4000 npm run start`

Troubleshooting `Cannot reach backend`:

1. Verify backend is up: `curl http://localhost:4000/health`
2. Restart Expo with cache clear after URL changes: `npx expo start -c`
3. Use the in-app `Check Backend` button and confirm the shown `API:` value is reachable from your device.

## Engineering Notes

- Passwords are hashed with `crypto.scrypt`.
- Token auth uses an HMAC signed JWT-style token.
- HTTP handlers are separated from core business logic in `backend/src/services.js`.
- Data persistence uses `backend/data/db.json` for a zero-dependency MVP.
- For production-level Month 2+, replace JSON persistence with PostgreSQL migration-based storage.
