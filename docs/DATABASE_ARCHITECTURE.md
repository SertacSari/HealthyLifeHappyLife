# Database Architecture

HealthyLifeHappyLife uses Node.js as the backend runtime. Node.js is not the database. The database storage mode is selected by backend environment variables.

## Current Decision

The current setup is acceptable for the ENS492 demo:

- The backend is a small Node.js HTTP API in `backend/src/server.js`.
- Business rules operate on an in-memory JavaScript state object loaded through `backend/src/db.js`.
- Demo mode persists that state to `backend/data/db.json`.
- PostgreSQL mode already exists and stores the same state object in a PostgreSQL `app_state` table as a JSONB document.

This is real PostgreSQL persistence, but it is not yet a normalized relational schema. It is a pragmatic bridge that keeps the API stable while allowing the app to run against a managed PostgreSQL service for production-like demonstrations.

## Runtime vs Storage

Node.js runs the backend application:

- accepts HTTP requests
- validates auth tokens and payloads
- calls service-layer business logic
- loads and saves application state

Storage is separate:

- JSON mode writes to a local JSON file
- PostgreSQL mode writes to a PostgreSQL database

Changing from JSON mode to PostgreSQL mode does not require mobile app changes because the REST API contract stays the same.

## JSON Mode

JSON mode is the default when no database environment variables are set.

```bash
cd backend
npm install
npm start
```

Equivalent explicit configuration:

```bash
DB_PROVIDER=json npm start
```

Storage file:

```text
backend/data/db.json
```

JSON mode is useful for:

- local demos
- repeatable MVP testing
- quick development without external services

Limitations:

- not safe for concurrent writes from multiple backend processes
- no database-level constraints or indexes
- data is local to the machine running the backend
- backups and migrations are manual

## PostgreSQL Mode

PostgreSQL mode is selected automatically when `DATABASE_URL` is set, or explicitly with `DB_PROVIDER=postgres`.

```bash
cd backend
npm install
DATABASE_URL="postgres://user:password@host:5432/healthylife" DB_PROVIDER=postgres npm start
```

The backend creates this table if it does not exist:

```sql
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The application state is stored as row `id = 1`.

Useful commands:

```bash
cd backend
DATABASE_URL="postgres://user:password@host:5432/healthylife" npm run db:check
DATABASE_URL="postgres://user:password@host:5432/healthylife" npm run db:sync-json-to-postgres
DATABASE_URL="postgres://user:password@host:5432/healthylife" DB_PROVIDER=postgres npm start
```

Use `db:sync-json-to-postgres` when the demo JSON file should be copied into PostgreSQL before switching modes.

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_PROVIDER` | `postgres` if `DATABASE_URL` exists, otherwise `json` | Selects storage mode. Use `json` or `postgres`. |
| `DATABASE_URL` | empty | PostgreSQL connection string. Required for PostgreSQL mode. |
| `PG_SSL_ENABLED` | `false` | Enables TLS for PostgreSQL connections. Often needed for hosted databases. |
| `PG_SSL_REJECT_UNAUTHORIZED` | `true` | Controls certificate verification when PostgreSQL SSL is enabled. |
| `PORT` | `4000` | Backend HTTP port. |
| `JWT_SECRET` | development fallback | Token signing secret. Must be changed outside local demo. |

Example hosted database configuration:

```bash
DATABASE_URL="postgres://user:password@host:5432/healthylife"
DB_PROVIDER=postgres
PG_SSL_ENABLED=true
PG_SSL_REJECT_UNAUTHORIZED=true
JWT_SECRET="replace-with-a-long-random-secret"
```

## Production-Like Status

PostgreSQL support is present and credible for a production-like ENS492 demonstration because:

- the backend uses the official `pg` driver
- startup lazily verifies the PostgreSQL connection
- the schema is created automatically
- the API uses the same load/save abstraction in JSON and PostgreSQL modes
- JSON demo mode remains available
- scripts exist to check PostgreSQL connectivity and copy JSON demo data into PostgreSQL

It is not full production database architecture yet because all application records are stored inside one JSONB document. That means PostgreSQL provides durability and hosted deployment compatibility, but not the full benefits of relational modeling.

## Recommended Next Steps

For a real production release, move from the single JSONB state table to normalized tables with migrations:

- `users`
- `profiles`
- `meals`
- `workouts`
- `food_items`
- `meal_templates`
- `daily_check_ins`
- `follows`
- `social_posts`
- `post_likes`
- `post_comments`
- `reminders`

Also add:

- transaction handling for multi-step writes
- unique constraints, foreign keys, and indexes
- password reset/session revocation tables
- automated migrations
- integration tests against a temporary PostgreSQL database
- backup/restore procedures
- environment-specific secrets management

The current recommendation is to keep JSON mode for demo reliability, use PostgreSQL JSONB mode for production-like deployment proof, and plan normalized PostgreSQL tables as a follow-up architecture milestone.
