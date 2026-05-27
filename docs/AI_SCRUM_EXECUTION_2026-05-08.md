# AI Scrum Execution Report (2026-05-08)

This document records implementation and verification evidence for Jira `[AI]` scrum items completed on 2026-05-08.

## Scope Completed

- `SCRUM-23` `[AI] Tune recommendation rules v2`
- `SCRUM-24` `[AI] Safety pass for non-medical outputs`
- `SCRUM-25` `[AI] Edge-case matrix execution`
- `SCRUM-34` `[AI] Full regression for final submission`
- `SCRUM-35` `[AI] Final safety/privacy verification`

## Code Changes

### 1) Recommendation rules v2 (`SCRUM-23`)

Updated `backend/src/services.js`:

- introduced deterministic priority-based tip selection (max 4 tips)
- added richer calorie logic bands:
  - far below goal (`>= 700` gap)
  - below goal (`>= 300` gap)
  - above goal (`<= -250` gap)
  - far above goal (`<= -600` gap)
- added protein guidance bands with estimated protein target
- added workout guidance bands (`0`, `<20`, `<45`, `>=45` minutes)
- added recovery signal for high training load (`>=2 workouts` or `>=90` minutes)
- added "no logs yet today" consistency starter tip
- added unknown-user guard (`404 User not found`)

### 2) Safety pass for non-medical outputs (`SCRUM-24`)

Updated `backend/src/services.js`:

- centralized non-medical disclaimer constant
- added safety-enforcement layer for recommendation payloads
- added blocked-medical-term checks for tip titles/messages
- added safe fallback tip generation when text is invalid/unsafe
- constrained tip areas to allowlist: `nutrition`, `workout`, `recovery`, `consistency`

### 3) Edge-case matrix execution (`SCRUM-25`)

Updated `backend/test/services-extra.test.js`:

- added a recommendation edge-case matrix test covering 10 scenario families:
  - no logs
  - far calorie deficit
  - moderate calorie deficit
  - calorie surplus
  - far calorie surplus
  - low protein
  - healthy protein
  - very short workout
  - moderate workout
  - long/multi-session recovery case
- added assertions for:
  - max 4 returned tips
  - non-medical language quality checks in tips
  - unknown-user 404 path

### 4) Full regression and privacy verification (`SCRUM-34`, `SCRUM-35`)

Updated `backend/test/services-extra.test.js`:

- added privacy test to confirm:
  - social list payloads omit `passwordHash` and `passwordSalt`
  - recommendations do not leak participant emails

## Documentation Update

Updated `docs/API_CONTRACT.md` recommendations section:

- documented recommendation v2 constraints (max tips, area allowlist, non-medical behavior)
- refreshed example response with v2 tip structure

## Regression Evidence

Command run:

```bash
cd backend && npm test
```

Result:

- total tests: `8`
- passed: `8`
- failed: `0`
- duration: ~`656ms`

No failing tests remained after the recommendation v2/safety/privacy changes.
