# ENS492 Month 1 API Contract

Owner scope: `[DOC]` (`SCRUM-27`)

Base URL: `http://localhost:4000`

Route reality checked against `/Users/sertac/Desktop/ENS492 Agents/backend/src/server.js` on 2026-05-25.

Auth header for protected routes:

`Authorization: Bearer <token>`

Common error body:

```json
{
  "error": "Error message"
}
```

## Health

`GET /health`

Response:

```json
{ "status": "ok", "service": "ens492-month1-backend", "dbProvider": "json" }
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

Response:

```json
{
  "profile": {
    "userId": 1,
    "name": "Updated User",
    "goalCalories": 2200,
    "goalWorkoutsPerWeek": 4,
    "updatedAt": "2026-03-28T00:00:00.000Z"
  }
}
```

`PUT /profile` (Bearer token required)

Request:

```json
{
  "name": "Updated User",
  "goalCalories": 2200,
  "goalWorkoutsPerWeek": 4
}
```

`PUT /profile/onboarding` (Bearer token required)

Stores onboarding metrics/preferences on the profile. When age, sex/gender, height, weight, and activity level are present, the backend calculates BMR/TDEE-derived macro targets and updates `goalCalories`.

Request:

```json
{
  "age": 28,
  "sex": "female",
  "heightCm": 168,
  "weightKg": 64,
  "activityLevel": "moderately_active",
  "goalType": "maintain",
  "dietPreference": "balanced",
  "privacyPreference": "friends",
  "restrictions": ["vegetarian"],
  "allergies": ["peanut"]
}
```

Response:

```json
{
  "profile": {
    "userId": 1,
    "name": "Updated User",
    "goalCalories": 2200,
    "goalWorkoutsPerWeek": 4,
    "age": 28,
    "sex": "female",
    "gender": "female",
    "heightCm": 168,
    "weightKg": 64,
    "activityLevel": "moderately_active",
    "goalType": "maintain",
    "dietPreference": "balanced",
    "privacyPreference": "friends",
    "restrictions": ["vegetarian"],
    "allergies": ["peanut"],
    "bmr": 1400,
    "tdee": 2170,
    "dailyCalorieTarget": 2170,
    "proteinTarget": 128,
    "carbTarget": 244,
    "fatTarget": 60,
    "updatedAt": "2026-05-25T00:00:00.000Z"
  }
}
```

## Nutrition Targets

`GET /nutrition/targets` (Bearer token required)

Response:

```json
{
  "targets": {
    "bmr": 1400,
    "tdee": 2170,
    "dailyCalorieTarget": 2170,
    "proteinTarget": 128,
    "carbTarget": 244,
    "fatTarget": 60,
    "activityLevel": "moderately_active",
    "goalType": "maintain"
  }
}
```

## Meals

`GET /nutrition/foods/search?query=chicken&limit=8` (Bearer token required)

Looks up foods in FatSecret and returns candidate macros for manual meal entry. The app does not store these search results directly; users still create a local meal through `POST /meals`.

Response:

```json
{
  "query": "chicken",
  "pageNumber": 0,
  "maxResults": 8,
  "totalResults": 100,
  "foods": [
    {
      "foodId": "1641",
      "name": "Chicken Breast",
      "brandName": "",
      "type": "Generic",
      "url": "https://foods.fatsecret.com/calories-nutrition/generic/chicken-breast",
      "description": "Per 100g - Calories: 195kcal | Fat: 7.72g | Carbs: 0.00g | Protein: 29.55g",
      "servingDescription": "Per 100g",
      "calories": 195,
      "protein": 29.55,
      "carbs": 0,
      "fats": 7.72
    }
  ]
}
```

`GET /food-items?query=oats&filter=allergy_safe` (Bearer token required; query/filter optional)

Response:

```json
{
  "foodItems": [
    {
      "id": 1,
      "name": "Greek Yogurt",
      "brand": "Custom",
      "category": "breakfast",
      "servingSize": "170 g",
      "calories": 120,
      "protein": 17,
      "carbs": 8,
      "fats": 0,
      "dietTags": ["high-protein"],
      "allergens": ["milk"],
      "source": "user",
      "createdByUserId": 1,
      "createdAt": "2026-05-25T00:00:00.000Z",
      "updatedAt": "2026-05-25T00:00:00.000Z"
    }
  ]
}
```

`POST /food-items` (Bearer token required)

Request:

```json
{
  "name": "Greek Yogurt",
  "brand": "Custom",
  "category": "breakfast",
  "servingSize": "170 g",
  "calories": 120,
  "protein": 17,
  "carbs": 8,
  "fats": 0,
  "dietTags": ["high-protein"],
  "allergens": ["milk"]
}
```

Response:

```json
{
  "foodItem": {
    "id": 1,
    "name": "Greek Yogurt",
    "brand": "Custom",
    "category": "breakfast",
    "servingSize": "170 g",
    "calories": 120,
    "protein": 17,
    "carbs": 8,
    "fats": 0,
    "dietTags": ["high-protein"],
    "allergens": ["milk"],
    "source": "user",
    "createdByUserId": 1,
    "createdAt": "2026-05-25T00:00:00.000Z",
    "updatedAt": "2026-05-25T00:00:00.000Z"
  }
}
```

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

`POST /meals/from-food-item` (Bearer token required)

Request:

```json
{
  "foodItemId": 1,
  "servingMultiplier": 1.5,
  "mealType": "breakfast",
  "loggedAt": "2026-05-25T08:00:00.000Z"
}
```

Response:

```json
{
  "meal": {
    "id": 2,
    "userId": 1,
    "name": "Greek Yogurt",
    "calories": 180,
    "protein": 25.5,
    "carbs": 12,
    "fats": 0,
    "mealType": "breakfast",
    "foodItemId": 1,
    "servingMultiplier": 1.5,
    "loggedAt": "2026-05-25T08:00:00.000Z"
  }
}
```

`GET /meals?date=YYYY-MM-DD` (Bearer token required, `date` optional)

Response:

```json
{
  "meals": [
    {
      "id": 1,
      "userId": 1,
      "name": "Chicken Bowl",
      "calories": 650,
      "protein": 45,
      "carbs": 50,
      "fats": 20,
      "loggedAt": "2026-03-28T00:00:00.000Z"
    }
  ]
}
```

`GET /meal-templates` (Bearer token required)

Response:

```json
{
  "mealTemplates": [
    {
      "id": 1,
      "userId": 1,
      "name": "Protein Breakfast",
      "mealType": "breakfast",
      "items": [
        {
          "foodItemId": 1,
          "name": "Greek Yogurt",
          "servingMultiplier": 1,
          "calories": 120,
          "protein": 17,
          "carbs": 8,
          "fats": 0
        }
      ],
      "totals": {
        "calories": 120,
        "protein": 17,
        "carbs": 8,
        "fats": 0
      },
      "createdAt": "2026-05-25T00:00:00.000Z",
      "updatedAt": "2026-05-25T00:00:00.000Z"
    }
  ]
}
```

`POST /meal-templates` (Bearer token required)

Request:

```json
{
  "name": "Protein Breakfast",
  "mealType": "breakfast",
  "items": [
    {
      "foodItemId": 1,
      "servingMultiplier": 1
    }
  ]
}
```

`POST /meal-templates/add-to-log` (Bearer token required)

Request:

```json
{
  "templateId": 1,
  "loggedAt": "2026-05-25T08:00:00.000Z"
}
```

Response:

```json
{
  "meal": {
    "id": 3,
    "userId": 1,
    "name": "Protein Breakfast",
    "calories": 120,
    "protein": 17,
    "carbs": 8,
    "fats": 0,
    "mealType": "breakfast",
    "loggedAt": "2026-05-25T08:00:00.000Z"
  }
}
```

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

Response:

```json
{
  "workouts": [
    {
      "id": 1,
      "userId": 1,
      "name": "Push Day",
      "durationMinutes": 60,
      "caloriesBurned": 350,
      "loggedAt": "2026-03-28T00:00:00.000Z"
    }
  ]
}
```

`GET /workouts/recommendation?date=YYYY-MM-DD` (Bearer token required, `date` optional)

Response:

```json
{
  "recommendation": {
    "date": "2026-05-25",
    "title": "Recovery-focused movement",
    "workoutType": "recovery",
    "durationMinutes": 20,
    "intensity": "low",
    "reason": "Daily check-in suggests lower readiness today."
  }
}
```

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

## Daily Check-Ins

`GET /check-ins/daily?date=YYYY-MM-DD` (Bearer token required, `date` optional)

Response when no check-in exists:

```json
{
  "checkIn": null
}
```

`POST /check-ins/daily` (Bearer token required)

Request:

```json
{
  "date": "2026-05-25",
  "energyLevel": 3,
  "mood": 4,
  "soreness": 2,
  "sleepHours": 7.5,
  "notes": "Light legs soreness."
}
```

Response:

```json
{
  "checkIn": {
    "id": 1,
    "userId": 1,
    "date": "2026-05-25",
    "energyLevel": 3,
    "mood": 4,
    "soreness": 2,
    "sleepHours": 7.5,
    "notes": "Light legs soreness.",
    "createdAt": "2026-05-25T00:00:00.000Z",
    "updatedAt": "2026-05-25T00:00:00.000Z"
  }
}
```

## Recommendations

`GET /recommendations/daily?date=YYYY-MM-DD` (Bearer token required, `date` optional)

Notes:

- response includes at most 4 tips (priority-ranked)
- tip `area` is one of: `nutrition`, `workout`, `recovery`, `consistency`
- all outputs are non-medical wellness guidance and include a fixed non-medical disclaimer
- recommendation source is reported as `rules` (deterministic) or `llm` (LLM-generated)
- set `RECOMMENDATION_ENGINE_MODE=hybrid` (or `llm_hybrid`) to enable LLM generation with deterministic fallback
- local Ollama can be used through the OpenAI-compatible config:

```env
RECOMMENDATION_ENGINE_MODE=hybrid
OPENAI_BASE_URL=http://127.0.0.1:11434/v1
OPENAI_MODEL=llama3.1:8b
OPENAI_API_KEY=
```

- if Ollama is unavailable, times out, returns invalid JSON, or produces unsafe medical content, the backend returns deterministic `rules` recommendations instead
- there is no separate `/ai-coach` or chat endpoint implemented in `backend/src/server.js` yet; Smart Coach UI should consume this route for the current fallback-capable coach surface

Response:

```json
{
  "recommendations": {
    "date": "2026-03-28",
    "source": "rules",
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

## Coach

`POST /coach/meal-suggestions` (Bearer token required)

Request:

```json
{
  "availableIngredients": ["eggs", "oats", "banana"],
  "timeAvailableMinutes": 15,
  "hungerLevel": "medium",
  "budgetPreference": "low"
}
```

Response:

```json
{
  "suggestions": {
    "disclaimer": "General wellness guidance only. This app does not provide medical advice, diagnosis, or treatment.",
    "source": "fallback",
    "suggestions": [
      {
        "title": "eggs balanced breakfast",
        "mealType": "breakfast",
        "description": "Build a simple plate with eggs, banana, and eggs. Keep portions moderate and adjust seasoning to preference.",
        "calories": 500,
        "macros": {
          "protein": 31,
          "carbs": 56,
          "fats": 17
        },
        "ingredients": ["eggs", "banana"],
        "rationale": "Uses available foods and keeps the meal balanced without extreme restriction."
      }
    ]
  }
}
```

`GET /coach/weekly-review?weekStart=YYYY-MM-DD` (Bearer token required, `weekStart` optional)

Response:

```json
{
  "review": {
    "disclaimer": "General wellness guidance only. This app does not provide medical advice, diagnosis, or treatment.",
    "summary": "This week is summarized from logged meals and workouts. Keep the focus on repeatable meals, realistic activity, and consistent tracking.",
    "highlights": ["7 day(s) of progress data reviewed."],
    "risks": ["Avoid extreme calorie cuts or all-or-nothing goals when adjusting next week."],
    "nextWeekFocus": ["Plan simple balanced meals.", "Schedule realistic workout blocks.", "Keep logging consistently."],
    "metrics": {
      "avgCalories": 1850,
      "workoutMinutes": 120,
      "workouts": 3,
      "proteinAvg": null
    },
    "source": "fallback"
  }
}
```

## Reminders

`GET /reminders/settings` (Bearer token required)

Response:

```json
{
  "settings": {
    "userId": 1,
    "enabled": true,
    "reminderTime": "08:30",
    "frequency": "weekdays",
    "updatedAt": "2026-03-28T00:00:00.000Z"
  }
}
```

`PUT /reminders/settings` (Bearer token required)

Request:

```json
{
  "enabled": true,
  "reminderTime": "08:30",
  "frequency": "weekdays"
}
```

Response:

```json
{
  "settings": {
    "userId": 1,
    "enabled": true,
    "reminderTime": "08:30",
    "frequency": "weekdays",
    "updatedAt": "2026-03-28T00:00:00.000Z"
  }
}
```

## Social (Minimal)

`GET /users?query=friend` (Bearer token required)

Searches users by email or profile name for social follow flows. `query` is required and must be at least 2 characters. Results exclude the authenticated user and are capped at 20 users.

Response:

```json
{
  "users": [
    {
      "userId": 2,
      "email": "friend@example.com",
      "name": "Friend"
    }
  ]
}
```

`POST /social/follow` (Bearer token required)

Request:

```json
{
  "targetUserId": 2
}
```

Response:

```json
{
  "followed": true
}
```

`POST /social/unfollow` (Bearer token required)

Request:

```json
{
  "targetUserId": 2
}
```

Response:

```json
{
  "followed": false
}
```

`GET /social/following` (Bearer token required)

Response:

```json
{
  "users": [
    {
      "userId": 2,
      "email": "friend@example.com",
      "name": "Friend"
    }
  ]
}
```

`GET /social/followers` (Bearer token required)

Response:

```json
{
  "users": [
    {
      "userId": 3,
      "email": "follower@example.com",
      "name": "Follower"
    }
  ]
}
```

`POST /social/posts` (Bearer token required)

Creates a meal post from an existing `mealId`, a `templateId`/`mealTemplateId`, a nested `meal`, or top-level meal fields.

Request:

```json
{
  "mealId": 1,
  "caption": "Post-workout lunch",
  "visibility": "friends",
  "privacy": {
    "hideCalories": false,
    "hideMeasurements": true
  }
}
```

Response:

```json
{
  "post": {
    "id": 1,
    "userId": 1,
    "author": {
      "userId": 1,
      "name": "Updated User"
    },
    "caption": "Post-workout lunch",
    "visibility": "friends",
    "privacy": {
      "hideCalories": false,
      "hideMeasurements": true
    },
    "hiddenFields": ["measurements"],
    "meal": {
      "name": "Chicken Bowl",
      "calories": 650,
      "protein": 45,
      "carbs": 50,
      "fats": 20,
      "loggedAt": "2026-03-28T00:00:00.000Z"
    },
    "likeCount": 0,
    "likedByViewer": false,
    "commentCount": 0,
    "comments": [],
    "createdAt": "2026-05-25T00:00:00.000Z"
  }
}
```

`GET /social/feed` (Bearer token required)

Returns visible posts for the authenticated user. Visibility is `public`, `friends` for mutual follows, or the user's own posts.

Response:

```json
{
  "posts": []
}
```

`POST /social/posts/like` (Bearer token required)

Request:

```json
{
  "postId": 1
}
```

Response:

```json
{
  "liked": true,
  "post": {
    "id": 1,
    "userId": 1,
    "author": {
      "userId": 1,
      "name": "Updated User"
    },
    "caption": "Post-workout lunch",
    "visibility": "friends",
    "privacy": {
      "hideCalories": false,
      "hideMeasurements": true
    },
    "hiddenFields": ["measurements"],
    "meal": {
      "name": "Chicken Bowl",
      "calories": 650,
      "protein": 45,
      "carbs": 50,
      "fats": 20,
      "loggedAt": "2026-03-28T00:00:00.000Z"
    },
    "likeCount": 1,
    "likedByViewer": true,
    "commentCount": 0,
    "comments": [],
    "createdAt": "2026-05-25T00:00:00.000Z"
  }
}
```

`POST /social/posts/comment` (Bearer token required)

Request:

```json
{
  "postId": 1,
  "text": "Looks good."
}
```

Response:

```json
{
  "comment": {
    "id": 1,
    "postId": 1,
    "userId": 2,
    "author": {
      "userId": 2,
      "name": "Friend"
    },
    "text": "Looks good.",
    "createdAt": "2026-05-25T00:00:00.000Z"
  },
  "post": {
    "id": 1,
    "likeCount": 1,
    "commentCount": 1
  }
}
```

`POST /social/posts/copy-to-log` (Bearer token required)

Request:

```json
{
  "postId": 1,
  "mealType": "lunch"
}
```

Response:

```json
{
  "meal": {
    "id": 4,
    "userId": 2,
    "name": "Chicken Bowl",
    "calories": 650,
    "protein": 45,
    "carbs": 50,
    "fats": 20,
    "loggedAt": "2026-05-25T00:00:00.000Z",
    "copiedFromPostId": 1,
    "copiedFromUserId": 1,
    "mealType": "lunch"
  }
}
```

## Next API additions (planned only, not implemented)

No additional Batch 2 feature-direction HTTP routes were found unwired in `backend/src/server.js` as of the latest 2026-05-25 inspection. Keep future routes out of mobile helpers until they appear in the server dispatcher.
