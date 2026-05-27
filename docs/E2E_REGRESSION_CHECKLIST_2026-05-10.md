# E2E Regression Checklist (2026-05-10)

Owner scope: `[ALL]` (`SCRUM-26`)

## 1) Baseline Setup

- [ ] Backend starts: `cd backend && npm run start`
- [ ] Mobile starts: `cd mobile && EXPO_PUBLIC_API_URL=http://localhost:4000 npm run start`
- [ ] Health endpoint reachable: `GET /health` returns `200`

## 2) Auth Flow

- [ ] `POST /auth/signup` creates user and returns token
- [ ] `POST /auth/login` returns token for existing user
- [ ] `GET /auth/me` with token returns current user
- [ ] `POST /auth/logout` with token returns logout message
- [ ] Protected routes reject missing/invalid token with `401`

## 3) Priority Demo Flow

- [ ] Onboarding/TDEE API: `PUT /profile/onboarding` stores metrics and `GET /nutrition/targets` returns calculated targets
- [ ] Food library API: `GET /food-items`, `POST /food-items`, `POST /meals/from-food-item`, `GET/POST /meal-templates`, and `POST /meal-templates/add-to-log` work with seeded/custom foods
- [ ] Smart Coach fallback: with `RECOMMENDATION_ENGINE_MODE=rules`, `GET /recommendations/daily` returns `source: "rules"` tips
- [ ] Smart Coach fallback: with `RECOMMENDATION_ENGINE_MODE=hybrid` and Ollama unavailable/invalid, `GET /recommendations/daily` still returns `source: "rules"` tips
- [ ] Rich coach routes: `POST /coach/meal-suggestions` returns safe meal ideas and `GET /coach/weekly-review` returns weekly summary/focus items
- [ ] Social feed/post/copy routes: `POST /social/posts`, `GET /social/feed`, `POST /social/posts/like`, `POST /social/posts/comment`, and `POST /social/posts/copy-to-log` work with visibility/privacy controls
- [ ] Daily check-in API: `POST /check-ins/daily` upserts readiness data and `GET /check-ins/daily?date=YYYY-MM-DD` returns it

## 4) Core Tracking Flow

- [ ] `GET /profile` loads default profile
- [ ] `PUT /profile` updates goals and name
- [ ] `PUT /profile/onboarding` accepts age, sex/gender, height, weight, activity level, goal type, diet preference, privacy preference, restrictions, and allergies
- [ ] `GET /nutrition/targets` returns BMR/TDEE/calorie/macros after onboarding profile is complete
- [ ] `GET /food-items?query=...&filter=allergy_safe` returns reusable food items
- [ ] `POST /food-items` creates a custom food item
- [ ] `POST /meals` creates meal log
- [ ] `POST /meals/from-food-item` creates a scaled meal from a reusable food item
- [ ] `GET /meals?date=YYYY-MM-DD` returns date-filtered meals
- [ ] `GET /meal-templates` returns templates for the authenticated user
- [ ] `POST /meal-templates` creates a template from existing food items
- [ ] `POST /meal-templates/add-to-log` creates a meal log from a template
- [ ] `POST /workouts` creates workout log
- [ ] `GET /workouts?date=YYYY-MM-DD` returns date-filtered workouts
- [ ] `GET /workouts/recommendation?date=YYYY-MM-DD` returns readiness-aware recommendation
- [ ] `GET /dashboard/summary?date=YYYY-MM-DD` returns calculated totals/macros

## 5) Coach + Reminder Flow

- [ ] `POST /check-ins/daily` accepts energy, mood, soreness, sleep hours, and notes
- [ ] `GET /check-ins/daily?date=YYYY-MM-DD` returns `checkIn` or `null`
- [ ] `GET /recommendations/daily` returns disclaimer + tips
- [ ] `POST /coach/meal-suggestions` returns disclaimer, source, and bounded safe suggestions
- [ ] `GET /coach/weekly-review?weekStart=YYYY-MM-DD` validates date and returns disclaimer, summary, highlights, risks, next-week focus, metrics, and source
- [ ] Recommendation tip count is bounded (`<= 4`)
- [ ] Recommendation source is `rules` or `llm`
- [ ] `GET /reminders/settings` returns defaults on first call
- [ ] `PUT /reminders/settings` updates settings with valid payload
- [ ] Invalid reminder payload returns `400`

## 6) Social Flow

- [ ] `GET /users?query=...` returns matching users and excludes the authenticated user
- [ ] `POST /social/follow` follows target user
- [ ] `POST /social/unfollow` unfollows target user
- [ ] `GET /social/following` returns list for authenticated user
- [ ] `GET /social/followers` returns follower list for authenticated user
- [ ] Self-follow is blocked (`400`)
- [ ] `POST /social/posts` creates a meal post from `mealId`, `templateId`, nested `meal`, or top-level meal fields
- [ ] `GET /social/feed` returns visible own/public/mutual-friend posts only
- [ ] `POST /social/posts/like` is idempotent and returns the rendered post
- [ ] `POST /social/posts/comment` attaches a visible comment and returns the rendered post
- [ ] `POST /social/posts/copy-to-log` creates a copied meal and omits hidden private body data

## 7) Automated Regression Evidence

Current automated suite as of 2026-05-25:

```bash
cd backend && npm test
```

Result:

- Tests: `11`
- Latest local run on 2026-05-25: `11` passed, `0` failed

## 8) Open Manual Verifications Before Submission

- [ ] Final iOS simulator pass with real UI interactions
- [ ] Empty-state and network-error visual checks in mobile tabs
- [ ] Demo script timing run (<= 7 minutes)
