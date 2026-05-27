# ENS492 Project Final Review and Summary

## 1. Project Status

After the final implementation pass, the project now delivers a complete Month 1 core MVP flow across backend and mobile. It remains an MVP foundation rather than a full final-year polished product, but the core user journey is operational and test-backed.

## 2. What Has Been Done

### Backend

Implemented Node.js backend with the following routes:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /profile`
- `PUT /profile`
- `POST /meals`
- `GET /meals`
- `POST /workouts`
- `GET /workouts`
- `GET /dashboard/summary`

Engineering features:

- secure password hashing with `crypto.scrypt`
- signed token verification
- user-scoped data access controls
- service-layer business logic (`backend/src/services.js`)
- input validation and structured error responses
- JSON persistence for MVP (`backend/data/db.json`)

### Mobile

Implemented a practical React Native app with:

- authentication screen (signup/login + backend health check)
- dashboard tab with date-based summary refresh
- meals tab with add form and history list
- workouts tab with add form and history list
- profile tab with editable goals
- refresh and logout controls
- API auto-detection fallback for simulator/emulator/phone flows

### Tooling and Docs

- root one-terminal startup command (`npm run dev`)
- backend tests (`npm run test`)
- backend smoke check (`npm run smoke`)
- API contract in `docs/API_CONTRACT.md`
- month completion mapping in `docs/MONTH1_COMPLETION_AND_REARRANGEMENT.md`
- run and troubleshooting instructions in `README.md`

## 3. What Is Missing for Full Month 1 Aim (Strict Engineering Standard)

The core Month 1 workflow is implemented, but the following remain missing for a stricter production-style interpretation:

- PostgreSQL + migration-based schema management (currently JSON file storage)
- automated CI pipeline for tests and quality checks
- production deployment profile and environment separation
- token refresh or revocation strategy
- advanced UI polish and stronger component modularization

## 4. Encountered Problems

Practical issues encountered during implementation:

- sandbox blocked local listening port in this environment (`listen EPERM`), so HTTP socket tests could not run inside the sandbox
- verification strategy had to rely on service-level smoke checks in addition to unit tests
- emulator/device connectivity required explicit API host handling (`localhost` vs emulator/phone hosts)

## 5. Difficulties If One Person Built This Alone

Main single-developer pressure points:

- balancing backend correctness, mobile UX, and docs in parallel
- maintaining API consistency while rapidly iterating UI
- preventing technical debt when moving fast
- keeping enough test coverage while building features

## 6. What Changed from Project Requirements

Changes from the original plan:

- PostgreSQL was postponed in favor of JSON persistence for MVP speed
- social/recommendation expansion remains deferred to protect core stability
- session handling is token-based with client-side logout semantics
- architecture was improved with route/service separation and centralized API helpers

## 7. Project Summary

The project has moved from planning to a real, runnable Month 1 product baseline. A user can authenticate, manage profile goals, log meals and workouts, and view date-based dashboard metrics. The mobile app now presents these capabilities through a usable tabbed flow rather than a status-only demo shell.

This is now a credible engineering base for Month 2 work, where the priority should shift to persistence hardening (PostgreSQL), testing automation, and advanced feature extension.

## 8. Goals Achieved in Detail

Goals achieved:

- end-to-end authentication and protected API flow
- profile creation and update with goal management
- meal and workout create/list flows
- daily summary calculations for calories, macros, and activity
- mobile UX for all core Month 1 operations
- structured docs and runbook for onboarding and verification
- cleaner project rearrangement: `backend/`, `mobile/`, `docs/`, root startup script

Final assessment:

- backend core: complete for Month 1 scope
- mobile core: complete for Month 1 scope
- infrastructure maturity: partial
- documentation and developer usability: good

