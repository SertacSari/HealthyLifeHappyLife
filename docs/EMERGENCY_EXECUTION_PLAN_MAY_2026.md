# HealthyLifeHappyLife Emergency Execution Plan

Date created: 2026-05-06

## Hard Deadlines

- Final draft submission: 2026-05-10
- Mid-semester presentation: 2026-05-11
- Final project completion: 2026-05-22

## What Was Pre-Implemented Today (Time Saver)

- Backend endpoints added:
  - `GET /recommendations/daily`
  - `GET /reminders/settings`
  - `PUT /reminders/settings`
  - `POST /social/follow`
  - `POST /social/unfollow`
  - `GET /social/following`
  - `GET /social/followers`
- Backend data model expanded with `reminders` and `follows` arrays.
- Mobile app updated with a new `Coach` tab:
  - Displays daily recommendations
  - Allows reminder settings updates
- New backend tests added and passing.

## 4-Day Plan (to 2026-05-10)

### Day 1 - 2026-05-06

- Freeze scope for draft (MVP only).
- Verify all implemented endpoints with Postman.
- Frontend: stabilize login + dashboard + meals + workouts + profile + coach navigation.
- Backend: fix any integration bugs.
- AI/API: prepare recommendation rule table and reminder behavior documentation.

### Day 2 - 2026-05-07

- Frontend:
  - Improve validation and empty states
  - Add clearer status/error banners
- Backend:
  - Add input constraints and edge-case checks on new routes
  - Add quick API examples to docs
- AI/API:
  - Add 10 edge-case tests for recommendation outputs
  - Confirm non-medical disclaimer appears in outputs

### Day 3 - 2026-05-08

- Frontend: demo flow polish (no broken navigation, fast data refresh).
- Backend: lightweight activity feed schema draft (optional if stable).
- AI/API: reminder default strategy + fallback messages.
- Team: record screenshots and short demo video snippets.

### Day 4 - 2026-05-09

- Full regression pass:
  - auth
  - profile
  - meals
  - workouts
  - dashboard
  - coach recommendations
  - reminders
- Fix only high/critical issues.
- Finalize draft package (report sections, architecture diagram, API contract update).

### Submission Day - 2026-05-10

- Submit final draft.
- Keep code freeze except blocker fixes.

## Presentation Prep (for 2026-05-11)

Slide order:

1. Background and motivation
2. Problem statement and project objectives
3. System overview (mobile + backend + recommendation module)
4. What is completed so far (with live screenshots)
5. Demo flow (1 user journey)
6. What remains until 2026-05-22
7. Risks and mitigation
8. Closing and Q&A

## Plan from 2026-05-12 to 2026-05-22

- 2026-05-12 to 2026-05-15:
  - social flow completion (follow list UI and basic feed if feasible)
  - achievements/streak refinement
- 2026-05-16 to 2026-05-18:
  - testing, bug fixing, UX cleanup
- 2026-05-19 to 2026-05-21:
  - final report alignment with implementation
  - final demo rehearsals
- 2026-05-22:
  - final submission handoff

## Role-Based Ownership (Immediate)

- Frontend Developer:
  - own UI stability and demo usability
  - ensure all tabs work without manual API calls
- Backend Developer:
  - own API correctness, validation, and data consistency
  - own all bugfixes in new endpoints
- AI/API/Integration Developer:
  - own recommendation rules quality and reminder logic checks
  - own test checklist and evidence collection

## Scope Control

Keep in MVP:

- auth/profile/meals/workouts/dashboard
- coach recommendations (rule-based)
- reminder preferences
- minimal follow/following

Postpone if time slips:

- comments
- full activity feed ranking
- advanced personalization
- vision-based food recognition
