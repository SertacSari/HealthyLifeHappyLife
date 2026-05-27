# Demo Screenshots + Walkthrough (2026-05-10)

Owner scope: `[DOC]` (`SCRUM-29`)

## Available Screenshots in Repo

- [/Users/sertac/Desktop/ENS492 Agents/Simulator Screenshot - iPhone 15 Pro Max - 2026-03-30 at 11.11.21.png](</Users/sertac/Desktop/ENS492 Agents/Simulator Screenshot - iPhone 15 Pro Max - 2026-03-30 at 11.11.21.png>)
- [/Users/sertac/Desktop/ENS492 Agents/Simulator Screenshot - iPhone 15 Pro Max - 2026-03-30 at 11.11.38.png](</Users/sertac/Desktop/ENS492 Agents/Simulator Screenshot - iPhone 15 Pro Max - 2026-03-30 at 11.11.38.png>)
- [/Users/sertac/Desktop/ENS492 Agents/Simulator Screenshot - iPhone 15 Pro Max - 2026-03-30 at 11.11.42.png](</Users/sertac/Desktop/ENS492 Agents/Simulator Screenshot - iPhone 15 Pro Max - 2026-03-30 at 11.11.42.png>)
- [/Users/sertac/Desktop/ENS492 Agents/Simulator Screenshot - iPhone 15 Pro Max - 2026-03-30 at 11.11.48.png](</Users/sertac/Desktop/ENS492 Agents/Simulator Screenshot - iPhone 15 Pro Max - 2026-03-30 at 11.11.48.png>)

## Suggested Final Capture List (Before Final Submission)

- [ ] Login/Signup screen
- [ ] Onboarding/TDEE API evidence or UI screen using `PUT /profile/onboarding` and `GET /nutrition/targets`
- [ ] Dashboard with non-empty daily summary
- [ ] FatSecret food lookup results and meal form prefilled from a selected food
- [ ] Food library/template API evidence or UI screen using `/food-items`, `/meals/from-food-item`, and `/meal-templates`
- [ ] Meal add form + populated meal list
- [ ] Workout add form + populated workout list
- [ ] Daily check-in API evidence or UI screen, plus `/workouts/recommendation` response
- [ ] Profile goals edit screen
- [ ] Smart Coach recommendations + disclaimer with visible fallback-safe content
- [ ] Coach meal suggestions and weekly review API evidence or UI screens
- [ ] Reminder settings update success state
- [ ] User search plus social follow/follower list responses (API evidence screenshot if UI is minimal)
- [ ] Social feed/post/like/comment/copy-to-log API evidence or UI screens with privacy controls

## Demo Walkthrough Script (Live)

1. Start backend and mobile.
2. Open app and log in as an existing user.
3. Show onboarding/TDEE via UI if available, or API evidence for `PUT /profile/onboarding` and `GET /nutrition/targets`.
4. Search FatSecret food lookup, select a food, and create a local meal log.
5. Show reusable food/template flow via UI if available, or API evidence for `/food-items`, `/meals/from-food-item`, and `/meal-templates`.
6. Add one workout entry, then submit a daily check-in and show `/workouts/recommendation`.
7. Refresh dashboard and explain metric changes.
8. Open Smart Coach and show daily recommendations + non-medical disclaimer; also show meal suggestions and weekly review, noting safe fallback when Ollama/LLM is unavailable.
9. Open reminder settings and update frequency/time.
10. Show profile tab and goal update.
11. Show current `/users?query=...` search and follow/unfollow behavior, then create a social meal post, view feed, like/comment, and copy it to the viewer's log.
12. Close with test evidence and remaining milestones.

## Demo Runtime Checklist

- [ ] All API calls succeed without manual retries
- [ ] No red error boxes or runtime crashes
- [ ] Date-based reload works on dashboard/coach
- [ ] Demo language presents onboarding/TDEE, food-items/templates, daily check-ins, workout recommendation, rich coach, and social feed/posts/copy-to-log as implemented APIs only when the UI/API evidence is shown
- [ ] Presenter can complete full path in <= 4 minutes
