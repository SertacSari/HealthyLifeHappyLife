# ENS 492 Mobile App Project Plan

## Revised Engineering-Focused Version

Prepared from the original 2-month plan and reorganized into a stronger engineering structure.

## 1. Project Goal

The project should deliver a stable mobile fitness MVP first, then expand it with presentation-ready features. The priority is not feature count. The priority is an end-to-end system that is testable, maintainable, and demonstrable.

Core product areas:

- Authentication
- Profile and goals
- Diet tracking
- Workout tracking
- Dashboard and progress summary
- Lightweight recommendation logic
- Limited social/discovery feature
- Testing, documentation, and demo preparation

## 2. What Should Be Improved for a Better Engineered Project

The original document is useful for task distribution, but it needs stronger engineering controls. The following changes make the project more realistic and defensible as a graduation project.

### A. Reduce scope pressure with a strict MVP boundary

Month 1 should only target one complete vertical slice:

- user can register and log in
- user can edit profile and goals
- user can log meals and workouts
- user can view saved data in a basic dashboard

The social feature and advanced recommendation behavior should stay in Month 2 unless the MVP is stable early.

### B. Define architecture before feature coding

The team should agree on:

- frontend: React Native app structure, screen flow, component conventions
- backend: route, controller, service, and data-access separation
- database: normalized schema plus migration files
- API contract: request and response formats for all core endpoints

This prevents each person from building incompatible parts.

### C. Add quality gates

Every feature should meet a basic Definition of Done:

- code pushed through branch and pull request
- reviewed by at least one teammate
- tested locally
- no broken build
- API documented or example payload added
- relevant UI and backend integration verified

### D. Add weekly milestones instead of only monthly targets

Two-month plans fail when the team waits too long to integrate. Weekly milestones make issues visible earlier and reduce last-week chaos.

### E. Add DevOps and reproducibility

The project should include:

- `.env.example` files
- setup instructions in `README`
- database migrations or schema versioning
- seeded sample data if possible
- linting and formatting rules
- automatic test run in CI if time allows

This makes the project look engineered instead of only coded.

### F. Add testing structure early

Testing should not wait until the end. The team should define:

- critical user flows
- API test checklist
- UI smoke test checklist
- bug tracking sheet with status and owner

### G. Add risk management

The highest risks are:

- frontend and backend integration mismatches
- authentication bugs
- weak database design
- too much time spent on social or AI-like features
- delayed testing

Each week should end with a short risk review and scope decision.

## 3. One-Month Aim of the Project

### Month 1 Aim

By the end of the first month, the team should have a usable end-to-end MVP where a user can sign up, log in, create or edit a profile, log meals, log workouts, and view a basic dashboard summary using real backend and database data.

### Month 1 Success Criteria

- React Native app runs reliably on target devices or emulator
- backend server runs with documented setup steps
- PostgreSQL schema is finalized for core MVP entities
- authentication works with secure password hashing and protected routes
- profile, meal, and workout flows are fully connected to the backend
- dashboard shows at least basic daily or weekly summaries
- critical APIs are tested
- major integration bugs are tracked and fixed
- repository structure, branch strategy, and basic documentation are in place

If these are not complete by the end of Month 1, Month 2 should not expand scope until the MVP is stable.

## 4. Revised Two-Month Timeline

### Weeks 1-2: Foundation and Contracts

- confirm final MVP scope
- create repository structure and branch rules
- set up React Native project, Node.js backend, and PostgreSQL connection
- define schema for users, profiles, meals, workouts, goals, and progress summaries
- define API contracts for auth, profile, meal, workout, and dashboard endpoints
- prepare reusable UI base components and navigation skeleton

### 33% Checkpoint Review

At roughly one-third progress, the team should verify:

- project structure is stable
- environments run on every teammate machine
- database schema is agreed and versioned
- auth flow skeleton exists on frontend and backend
- API contracts are written and shared
- major scope disagreements are resolved now, not later

If these are missing, feature expansion should pause until the foundation is corrected.

### Weeks 3-4: Core MVP Implementation

- implement signup, login, logout, token handling, and route protection
- build profile create and edit flow
- build meal logging and workout logging screens and APIs
- connect frontend forms to real backend endpoints
- add input validation and error handling
- begin dashboard summary endpoint and dashboard UI shell

### Weeks 5-6: Integration, Stability, and Smart Features

- complete dashboard summary logic
- add progress tracking such as streaks or basic charts
- implement rule-based recommendations and reminders
- run API tests and end-to-end smoke tests
- fix integration issues and improve UX consistency

### 66% Checkpoint Review

At roughly two-thirds progress, the team should verify:

- full MVP flow works with real data
- no blocker exists in auth, profile, meal, or workout features
- dashboard works at least at a basic level
- recommendation logic is limited and realistic
- bug list is prioritized by severity
- social feature is only continued if MVP is already stable

If core flows still fail here, Month 2 must focus on stabilization, not new features.

### Weeks 7-8: Controlled Expansion and Submission Readiness

- add minimal social or discovery feature
- finish reminder and achievement logic if still pending
- perform usability testing and regression testing
- polish UI consistency and demo flow
- collect screenshots and evidence
- prepare report sections and presentation materials

## 5. Better Work Distribution for 3 People

The original work split is reasonable, but it should include shared engineering responsibilities in addition to ownership.

### Person 1: Frontend and Mobile UX

Owns:

- React Native app structure
- navigation and screen implementation
- reusable components
- form handling and validation messages
- frontend API integration
- visual polish for demo readiness

Shared responsibilities:

- review backend payload compatibility
- participate in smoke testing before merges

### Person 2: Backend, Database, and Security

Owns:

- backend architecture
- PostgreSQL schema and migrations
- authentication and authorization
- core APIs
- business logic for dashboard summaries and tracking
- backend tests and error handling

Shared responsibilities:

- publish endpoint contracts early
- support integration debugging quickly

### Person 3: QA, Recommendation Logic, and Delivery Coordination

Owns:

- recommendation and reminder rules
- test scenarios and bug tracking
- progress tracking logic such as streaks and achievements
- documentation, screenshots, and report evidence
- integration checklist and demo flow

Shared responsibilities:

- enforce milestone reviews
- identify scope cuts when progress slips

## 6. Immediate Starting Order

The team should start in parallel, but in a controlled order:

1. Finalize MVP scope, architecture boundaries, and endpoint list.
2. Create repository structure, issue board, and branch naming rules.
3. Start frontend skeleton and backend skeleton on the same day.
4. Freeze the core schema and auth contract before deeper feature coding.
5. Integrate one vertical slice early: login plus profile.
6. Expand to meal and workout logging only after the first integration succeeds.

## 7. Final Completion Review

Before submission, the team should perform one last structured review:

- all MVP features work from mobile UI to database
- no critical bug remains open
- setup steps are documented clearly
- screenshots and report evidence match the actual implementation
- stretch features are clearly labeled as completed or future work
- the demo script uses stable flows only

## 8. Final Rearrangement Recommendation

The project should be presented in this order:

1. Problem and product goal
2. Final MVP scope
3. System architecture
4. Database and API design
5. Implementation milestones
6. Team work distribution
7. Testing and quality assurance
8. Risks, postponed features, and future work

This order is stronger than a feature-only plan because it shows that the team approached the project as an engineered software system, not just a set of screens.
