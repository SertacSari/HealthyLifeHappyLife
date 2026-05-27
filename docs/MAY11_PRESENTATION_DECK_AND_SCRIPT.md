# May 11 Presentation Deck + Script

Owner scope: `[DOC]` (`SCRUM-28`)
Presentation date: **2026-05-11**
Target length: **6-7 minutes**

## Slide Plan

1. Title + Team + Course context
2. Problem and motivation
3. Scope and constraints (Month 1 MVP boundary)
4. System architecture (mobile + backend + data + recommendation module)
5. Implemented features (auth/profile/meals/workouts/dashboard/coach/reminders/social-minimal)
6. Recommendation module quality and safety pass
7. Demo flow (single-user journey)
8. Testing and regression evidence
9. Risks, limitations, and what is postponed
10. Next steps to 2026-05-22 and close

## Speaker Script (Per Slide)

### 1) Title + Context
"This project is HealthyLifeHappyLife, developed for ENS492. Today we show the Month 1 MVP implementation and what remains before final submission."

### 2) Problem and Motivation
"Users need simple daily tracking with low friction. Our goal is to combine meal/workout logging and lightweight daily guidance in one flow."

### 3) Scope and Constraints
"For Month 1, we intentionally focused on reliable core flows over advanced features. We kept persistence simple with JSON storage to prioritize delivery speed and testability."

### 4) Architecture
"Mobile is React Native with Expo, backend is Node.js with service-layer business logic, and data is persisted in a local JSON file for MVP. Auth is token-based, and coach recommendations are rule-based."

### 5) Implemented Features
"Implemented features include signup/login, profile goals, meal and workout logging, dashboard summary, recommendation endpoint, reminder settings, and minimal follow/follower social routes."

### 6) AI/Recommendation Quality
"We completed recommendation rules v2, added non-medical safety constraints, and validated behavior with an edge-case matrix plus privacy checks."

### 7) Demo Flow
"Demo shows: create/login user, update goals, add meal and workout logs, refresh dashboard, open coach recommendations, and show reminder settings."

### 8) Testing Evidence
"Backend automated regression currently passes 8 out of 8 tests, including auth, reminders, social follow flow, recommendation edge cases, and privacy assertions."

### 9) Risks and Limitations
"Main limitations are JSON persistence, no CI pipeline yet, and limited UI polish for final-quality UX. These are known tradeoffs for Month 1 schedule pressure."

### 10) Next Steps and Close
"Until 2026-05-22, the plan is final stabilization, documentation finalization, and submission readiness checks. The current baseline is runnable, test-backed, and extensible."

## Presenter Timing Guide

- Slides 1-3: 1.5 min
- Slides 4-6: 2.0 min
- Slide 7 (demo setup + transitions): 1.5 min
- Slides 8-10: 1.5-2.0 min
