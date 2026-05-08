# ENS492 Month 1 API Contract

Base URL: `http://localhost:4000`

## Health

`GET /health`

Response:

```json
{ "status": "ok", "service": "ens492-month1-backend" }
```

## Auth

`POST /auth/signup`

Request:

```json
{
  "email": "mvp@example.com",
  "password": "StrongPass123",
  "name": "MVP User"
}
```

`POST /auth/login`

Request:

```json
{
  "email": "mvp@example.com",
  "password": "StrongPass123"
}
```

Auth response:

```json
{
  "token": "jwt_like_token",
  "user": {
    "id": 1,
    "email": "mvp@example.com",
    "createdAt": "2026-03-28T00:00:00.000Z"
  }
}
```

`POST /auth/logout` (Bearer token required)

Response:

```json
{
  "message": "Logout successful on client side. Remove stored token."
}
```

`GET /auth/me` (Bearer token required)

Response:

```json
{
  "user": {
    "id": 1,
    "email": "mvp@example.com",
    "createdAt": "2026-03-28T00:00:00.000Z"
  }
}
```

## Profile

`GET /profile` (Bearer token required)

`PUT /profile` (Bearer token required)

Request:

```json
{
  "name": "Updated User",
  "goalCalories": 2200,
  "goalWorkoutsPerWeek": 4
}
```

## Meals

`POST /meals` (Bearer token required)

Request:

```json
{
  "name": "Chicken Bowl",
  "calories": 650,
  "protein": 45,
  "carbs": 50,
  "fats": 20
}
```

`GET /meals?date=YYYY-MM-DD` (Bearer token required, `date` optional)

## Workouts

`POST /workouts` (Bearer token required)

Request:

```json
{
  "name": "Push Day",
  "durationMinutes": 60,
  "caloriesBurned": 350
}
```

`GET /workouts?date=YYYY-MM-DD` (Bearer token required, `date` optional)

## Dashboard

`GET /dashboard/summary?date=YYYY-MM-DD` (Bearer token required, `date` optional)

Response:

```json
{
  "summary": {
    "date": "2026-03-28",
    "totalCaloriesIn": 650,
    "totalCaloriesOut": 350,
    "netCalories": 300,
    "workoutMinutes": 60,
    "mealsCount": 1,
    "workoutsCount": 1,
    "macros": {
      "protein": 45,
      "carbs": 50,
      "fats": 20
    },
    "goals": {
      "goalCalories": 2200,
      "goalWorkoutsPerWeek": 4
    }
  }
}
```

## Recommendations

`GET /recommendations/daily?date=YYYY-MM-DD` (Bearer token required, `date` optional)

Notes:

- response includes at most 4 tips (priority-ranked)
- tip `area` is one of: `nutrition`, `workout`, `recovery`, `consistency`
- all outputs are non-medical wellness guidance and include a fixed non-medical disclaimer

Response:

```json
{
  "recommendations": {
    "date": "2026-03-28",
    "disclaimer": "General wellness guidance only. This app does not provide medical advice, diagnosis, or treatment.",
    "tips": [
      {
        "area": "consistency",
        "title": "No activity logs yet today",
        "message": "Start with one meal log or a short walk to build daily momentum."
      },
      {
        "area": "nutrition",
        "title": "Calorie intake is far below goal",
        "message": "Add a balanced meal with protein, complex carbs, and healthy fats."
      },
      {
        "area": "nutrition",
        "title": "Protein intake appears low",
        "message": "Aim to include 25-35g protein in your next meal."
      },
      {
        "area": "workout",
        "title": "No workout logged today",
        "message": "A 20-30 minute walk or bodyweight session can keep your routine active."
      }
    ]
  }
}
```

## Reminders

`GET /reminders/settings` (Bearer token required)

`PUT /reminders/settings` (Bearer token required)

Request:

```json
{
  "enabled": true,
  "reminderTime": "08:30",
  "frequency": "weekdays"
}
```

## Social (Minimal)

`POST /social/follow` (Bearer token required)

Request:

```json
{
  "targetUserId": 2
}
```

`POST /social/unfollow` (Bearer token required)

`GET /social/following` (Bearer token required)

`GET /social/followers` (Bearer token required)
