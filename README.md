# ENS492 Wellness App

Backend + mobile app with:

- authentication and profile goals
- onboarding profile metrics with TDEE-derived nutrition targets
- meal/workout tracking
- FatSecret food lookup for manual meal entry
- reusable food items, meal templates, and daily check-ins
- dashboard summaries
- readiness-aware workout recommendation
- rule-based recommendations with optional LLM hybrid mode
- coach meal suggestions and weekly review with safe fallback behavior
- social meal posts, feed, likes, comments, and copy-to-log
- database provider switch: JSON file or PostgreSQL

## Project Structure

- `backend/`: Node.js API
- `mobile/`: React Native (Expo) client
- `docs/`: API and report/support docs

## Backend Setup

```bash
cd /Users/sertac/Desktop/ENS492\ Agents/backend
cp .env.example .env
npm install
npm run start
```

Backend URL: `http://localhost:4000`

## Database Mode

`DB_PROVIDER` supports:

- `json` (default): uses `backend/data/db.json`
- `postgres`: uses `DATABASE_URL`

Example `.env` for PostgreSQL:

```env
DB_PROVIDER=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ens492
PG_SSL_ENABLED=false
PG_SSL_REJECT_UNAUTHORIZED=true
```

When `DB_PROVIDER=postgres`, backend auto-creates the internal `app_state` table on startup.

Useful commands:

```bash
npm run db:check
npm run db:sync-json-to-postgres
```

## LLM Hybrid Recommendations

Keep rules as fallback and enable LLM generation when available:

```env
RECOMMENDATION_ENGINE_MODE=hybrid
OPENAI_BASE_URL=http://127.0.0.1:11434/v1
OPENAI_MODEL=llama3.1:8b
OPENAI_API_KEY=
OPENAI_TIMEOUT_MS=8000
```

Local Ollama setup for the current demo model:

```bash
ollama pull llama3.1:8b
ollama serve
```

Notes:

- `hybrid` or `llm_hybrid` both enable LLM + rule fallback.
- Ollama must expose its OpenAI-compatible API at `http://127.0.0.1:11434/v1`.
- `OPENAI_API_KEY` may be blank for local Ollama. Remote OpenAI-compatible providers usually require a key.
- If the LLM is unavailable, times out, returns invalid JSON, or fails safety checks, the response automatically falls back to deterministic `rules`.
- Implemented coach APIs are `GET /recommendations/daily`, `POST /coach/meal-suggestions`, and `GET /coach/weekly-review`.

## Demo API Notes

Implemented Batch 2 demo APIs include:

- `PUT /profile/onboarding`
- `GET /nutrition/targets`
- `GET/POST /food-items`
- `POST /meals/from-food-item`
- `GET/POST /meal-templates`
- `POST /meal-templates/add-to-log`
- `GET/POST /check-ins/daily`
- `GET /workouts/recommendation`
- `POST /coach/meal-suggestions`
- `GET /coach/weekly-review`
- `GET /social/feed`
- `POST /social/posts`
- `POST /social/posts/like`
- `POST /social/posts/comment`
- `POST /social/posts/copy-to-log`

Current implemented social APIs include user search, follow/follower lists, feed, meal posts, likes, comments, and copy-to-log.

## FatSecret Food Lookup

FatSecret is used only to search foods and prefill the meal form. The app stores the user-created meal values through the normal local `/meals` endpoint.

```env
FATSECRET_CLIENT_ID=
FATSECRET_CLIENT_SECRET=
FATSECRET_SCOPE=basic
FATSECRET_REGION=
FATSECRET_LANGUAGE=
FATSECRET_TIMEOUT_MS=8000
```

## Mobile Setup

```bash
cd /Users/sertac/Desktop/ENS492\ Agents/mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:4000 npm run start
```

For real device testing, use your computer IP for `EXPO_PUBLIC_API_URL`.

## Verification

```bash
cd /Users/sertac/Desktop/ENS492\ Agents/backend
npm run test
npm run smoke
```
