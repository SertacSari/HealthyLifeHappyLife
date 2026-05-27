# ENS 492 Month 1 Aim

## Better-Engineered Version

## 1. Month 1 Objective

The aim of the first month is to finish a stable end-to-end MVP foundation, not to chase every planned feature. By the end of Month 1, the team should be able to demonstrate one complete working flow from mobile interface to backend to database.

That working flow should include:

- user registration and login
- secure session handling
- profile creation and editing
- meal logging
- workout logging
- a basic dashboard that shows saved user data

If these core flows are not complete and stable, the team should not continue with advanced social or recommendation features yet.

## 2. What Must Be Ready at the End of Month 1

By the end of the month, the project should have:

- a runnable React Native mobile app
- a working Node.js backend
- a connected PostgreSQL database
- agreed folder structure and branch strategy
- documented environment setup
- database schema and migrations for core entities
- tested API endpoints for auth, profile, meals, workouts, and dashboard summary
- connected frontend screens using real backend data
- basic validation, error handling, and bug tracking

## 3. Recommended Month 1 Execution Order

### Phase 1: Foundation

- finalize MVP scope
- define backend architecture and frontend screen map
- create database schema for users, profiles, meals, workouts, goals, and summaries
- define API contracts before deep implementation
- set up repository rules, branches, and shared coding conventions

### 33% Checkpoint

At one-third progress, the team should stop and verify:

- every teammate can run the app and backend locally
- database schema is frozen for MVP entities
- auth endpoints are defined and partly implemented
- frontend navigation skeleton is working
- API request and response shapes are agreed
- no one is building features outside the approved MVP scope

If these are not true, the team should correct the foundation before moving on.

### Phase 2: Core Vertical Slice

- implement signup, login, logout, and protected routes
- complete profile create and edit flow
- build meal logging form and data storage
- build workout logging form and data storage
- connect frontend screens to backend APIs
- add validation messages and basic loading or error states

### 66% Checkpoint

At two-thirds progress, the team should stop and verify:

- authentication works from mobile app to backend to database
- profile, meal, and workout data can be created and retrieved correctly
- major integration bugs are logged and assigned
- dashboard backend summary logic has started
- the team is still focused on MVP stability instead of stretch features

If these checks fail, the remaining time should be used for fixing and integration only.

### Phase 3: Stabilization and Demo-Ready MVP

- complete a basic dashboard with real user summaries
- test all critical user flows end to end
- fix major bugs and integration issues
- improve UI consistency on the main screens
- update README, environment notes, and setup steps
- prepare screenshots and a short demo-safe user flow

## 4. Final End-of-Month Review

Before moving into Month 2, the team should verify:

- a new user can register and log in successfully
- the user can edit profile information
- the user can add and view meals
- the user can add and view workouts
- the dashboard shows real saved data
- setup and run instructions are documented
- no critical bug blocks a live demonstration

Only after this review passes should the team expand into recommendation polish, reminders, social features, or advanced progress tracking.

## 5. Proper Rearrangement of Priorities

The best engineering order for Month 1 is:

1. Scope and architecture agreement
2. Environment and repository setup
3. Database schema and API contracts
4. Authentication flow
5. Profile flow
6. Meal and workout logging
7. Dashboard summary
8. Testing, bug fixing, and documentation

This arrangement is stronger than building screens first and integrating later, because it reduces rework, integration mismatch, and late-stage failures.
