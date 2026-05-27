# HealthyLifeHappyLife Demo Readiness Checklist

Last updated: 2026-05-27

Use this as the short product-demo checklist. It complements the older final rehearsal checklist by focusing on market positioning and feature proof.

## Demo-Critical Path

- [ ] Backend starts cleanly and `/health` returns `status: ok`.
- [ ] Mobile login works with the demo account or a freshly created account.
- [ ] Onboarding is completed with realistic student profile values.
- [ ] Home shows nutrition targets, daily progress, daily check-in, and coach preview.
- [ ] Food Library search finds at least one Turkish food using Turkish and ASCII-friendly terms.
- [ ] A local/Turkish meal is added to today's log.
- [ ] A low-sleep or sore daily check-in is saved.
- [ ] Smart Coach shows meal/workout suggestions with reason and source labels.
- [ ] Weekly review loads after there is enough demo data.
- [ ] Latest meal can be shared, feed can be loaded, and shared meal can be copied to the user's log.

## Positioning Proof

- [ ] Presenter explicitly says the app is not trying to beat global apps on database size.
- [ ] Presenter frames the wedge as Turkish/local-food-first, student-budget, privacy-aware social copy-to-log, and check-in-aware coaching.
- [ ] Demo uses local food examples instead of only generic chicken/rice examples.
- [ ] Demo shows privacy behavior before or during social copy-to-log.
- [ ] Demo shows at least one recommendation reason tied to sleep, soreness, hunger, time, or ingredients.
- [ ] Presenter states that nutrition values are estimates and the product is wellness guidance, not medical advice.

## Known Demo Risks

- [ ] Social share UI currently needs stronger manual explanation because backend privacy controls are richer than the mobile share control.
- [ ] Template creation can feel awkward because it depends on the first Food Library result.
- [ ] Manual calorie/macro entry can look slow; prefer food library, FatSecret search, template, or copy-to-log in the demo.
- [ ] Reminder settings are stored, but real notification delivery should not be claimed unless separately implemented.
- [ ] JSON persistence is acceptable for the ENS492 demo, but should be named as a market-readiness blocker.

## Backup Talking Points

- Backend route surface is broad enough to support a real product story: onboarding, nutrition targets, foods, templates, check-ins, recommendations, coach, weekly review, reminders, and social.
- Tests cover important differentiators: Turkish food search, AI coach safety fallback, and social privacy/copy-to-log.
- The near-term product work is polish and coherence, not inventing a brand-new feature set.
