const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Readable } = require("node:stream");
const test = require("node:test");
const assert = require("node:assert/strict");

function clearBackendModuleCache() {
  for (const modulePath of [
    "../src/server",
    "../src/db",
    "../src/services",
    "../src/fatsecretClient",
    "../src/recommendationLlm",
    "../src/aiCoachService",
    "../src/socialFeedService",
    "../src/config"
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
}

async function withTestServer(run, serverOptions = {}) {
  clearBackendModuleCache();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ens492-backend-test-"));
  const dbPath = path.join(tmpDir, "db.json");
  const config = require("../src/config");
  config.dbProvider = "json";
  config.dbFilePath = dbPath;
  config.jwtSecret = "unit-test-secret";
  config.recommendationEngineMode = "rules";

  const { createServer } = require("../src/server");
  const server = createServer(serverOptions);

  try {
    await run(server);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    clearBackendModuleCache();
  }
}

async function requestJson(server, pathName, options = {}) {
  const requestBody = options.body ? Buffer.from(options.body) : null;
  const req = Readable.from(requestBody ? [requestBody] : []);
  req.method = options.method || "GET";
  req.url = pathName;
  const headers = {
    host: "localhost",
    "content-type": "application/json",
    ...(options.headers || {})
  };
  req.headers = Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));

  const response = await new Promise((resolve) => {
    const responseHeaders = {};
    const res = {
      setHeader(name, value) {
        responseHeaders[name.toLowerCase()] = value;
      },
      writeHead(status, nextHeaders = {}) {
        this.statusCode = status;
        for (const [name, value] of Object.entries(nextHeaders)) {
          responseHeaders[name.toLowerCase()] = value;
        }
      },
      end(rawBody = "") {
        resolve({
          status: this.statusCode,
          headers: responseHeaders,
          rawBody: String(rawBody)
        });
      }
    };
    server.emit("request", req, res);
  });

  const body = response.rawBody ? JSON.parse(response.rawBody) : null;
  return { response, body };
}

async function signup(server, email, name) {
  const { response, body } = await requestJson(server, "/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      name,
      password: "StrongPass123"
    })
  });
  assert.equal(response.status, 201);
  assert.equal(typeof body.token, "string");
  return body;
}

function authHeaders(user) {
  return { Authorization: `Bearer ${user.token}` };
}

test("HTTP /users search is authenticated, filtered, and privacy-safe", async () => {
  await withTestServer(async (server) => {
    const alice = await signup(server, "alice@example.com", "Alice Runner");
    await signup(server, "bob@example.com", "Bob Lifter");

    const unauthorized = await requestJson(server, "/users?query=bo");
    assert.equal(unauthorized.response.status, 401);
    assert.equal(unauthorized.body.error, "Unauthorized");

    const missingQuery = await requestJson(server, "/users", {
      headers: { Authorization: `Bearer ${alice.token}` }
    });
    assert.equal(missingQuery.response.status, 400);
    assert.equal(missingQuery.body.error, "Missing query parameter: query");

    const shortQuery = await requestJson(server, "/users?query=b", {
      headers: { Authorization: `Bearer ${alice.token}` }
    });
    assert.equal(shortQuery.response.status, 400);
    assert.equal(shortQuery.body.error, "Query must be at least 2 characters");

    const result = await requestJson(server, "/users?query=bo", {
      headers: { Authorization: `Bearer ${alice.token}` }
    });
    assert.equal(result.response.status, 200);
    assert.deepEqual(result.body.users, [
      {
        userId: 2,
        email: "bob@example.com",
        name: "Bob Lifter"
      }
    ]);
    assert.equal(JSON.stringify(result.body).includes("passwordHash"), false);
    assert.equal(JSON.stringify(result.body).includes("passwordSalt"), false);
    assert.equal(JSON.stringify(result.body).includes("alice@example.com"), false);
  });
});

test("HTTP date validation rejects impossible dashboard dates", async () => {
  await withTestServer(async (server) => {
    const user = await signup(server, "date-check@example.com", "Date Check");

    const result = await requestJson(server, "/dashboard/summary?date=2026-02-30", {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    assert.equal(result.response.status, 400);
    assert.equal(result.body.error, "Invalid date. Expected YYYY-MM-DD");
  });
});

test("HTTP /coach/meal-suggestions returns fallback without Ollama", async () => {
  await withTestServer(
    async (server) => {
      const user = await signup(server, "coach@example.com", "Coach User");

      await requestJson(server, "/food-items", {
        method: "POST",
        headers: authHeaders(user),
        body: JSON.stringify({
          name: "Tofu",
          servingSize: "100g",
          calories: 140,
          protein: 16,
          carbs: 4,
          fats: 8
        })
      });

      const result = await requestJson(server, "/coach/meal-suggestions", {
        method: "POST",
        headers: authHeaders(user),
        body: JSON.stringify({
          availableIngredients: ["tofu", "rice", "greens"],
          timeAvailableMinutes: 20,
          hungerLevel: "moderate",
          budgetPreference: "low"
        })
      });

      assert.equal(result.response.status, 200);
      assert.equal(result.body.suggestions.source, "fallback");
      assert.equal(result.body.suggestions.suggestions.length, 3);
      assert.ok(result.body.suggestions.suggestions[0].ingredients.includes("tofu"));
    },
    {
      aiCoachOptions: {
        llmClient: async () => {
          throw new Error("Ollama unavailable in route test");
        }
      }
    }
  );
});

test("HTTP /coach/today-plan returns combined daily coach context", async () => {
  await withTestServer(async (server) => {
    const user = await signup(server, "today-plan@example.com", "Today Plan");

    await requestJson(server, "/profile/onboarding", {
      method: "PUT",
      headers: authHeaders(user),
      body: JSON.stringify({
        name: "Today Plan",
        age: 22,
        sex: "male",
        heightCm: 178,
        weightKg: 78,
        activityLevel: "moderate",
        goalType: "lose_fat",
        dietPreference: "high_protein",
        privacyPreference: "friends",
        goalWorkoutsPerWeek: 4
      })
    });

    await requestJson(server, "/meals", {
      method: "POST",
      headers: authHeaders(user),
      body: JSON.stringify({
        name: "Egg breakfast",
        calories: 420,
        protein: 28,
        carbs: 34,
        fats: 18,
        loggedAt: "2026-05-25T08:00:00.000Z"
      })
    });

    const result = await requestJson(server, "/coach/today-plan?date=2026-05-25&mode=protein", {
      headers: authHeaders(user)
    });

    assert.equal(result.response.status, 200);
    assert.equal(result.body.plan.date, "2026-05-25");
    assert.equal(result.body.plan.mode, "protein");
    assert.equal(result.body.plan.source, "rules");
    assert.equal(result.body.plan.summary.mealsLogged, 1);
    assert.equal(typeof result.body.plan.nextMeal.reason, "string");
    assert.ok(result.body.plan.inputsUsed.includes("profile targets"));
  });
});

test("HTTP social post create, feed, like, comment, and copy-to-log are wired", async () => {
  await withTestServer(async (server) => {
    const owner = await signup(server, "owner-route@example.com", "Owner Route");
    const viewer = await signup(server, "viewer-route@example.com", "Viewer Route");

    const createResult = await requestJson(server, "/social/posts", {
      method: "POST",
      headers: authHeaders(owner),
      body: JSON.stringify({
        caption: "Lunch prep",
        visibility: "public",
        meal: {
          name: "Chicken rice bowl",
          calories: 610,
          protein: 45,
          carbs: 64,
          fats: 16,
          loggedAt: "2026-05-25T12:00:00.000Z"
        }
      })
    });
    assert.equal(createResult.response.status, 201);
    assert.equal(createResult.body.post.meal.name, "Chicken rice bowl");

    const feedResult = await requestJson(server, "/social/feed", {
      headers: authHeaders(viewer)
    });
    assert.equal(feedResult.response.status, 200);
    assert.equal(feedResult.body.posts.length, 1);
    assert.equal(feedResult.body.posts[0].caption, "Lunch prep");

    const likeResult = await requestJson(server, "/social/posts/like", {
      method: "POST",
      headers: authHeaders(viewer),
      body: JSON.stringify({ postId: createResult.body.post.id })
    });
    assert.equal(likeResult.response.status, 200);
    assert.equal(likeResult.body.post.likeCount, 1);
    assert.equal(likeResult.body.liked, true);

    const unlikeResult = await requestJson(server, "/social/posts/like", {
      method: "POST",
      headers: authHeaders(viewer),
      body: JSON.stringify({ postId: createResult.body.post.id })
    });
    assert.equal(unlikeResult.response.status, 200);
    assert.equal(unlikeResult.body.post.likeCount, 0);
    assert.equal(unlikeResult.body.liked, false);

    await requestJson(server, "/social/posts/like", {
      method: "POST",
      headers: authHeaders(viewer),
      body: JSON.stringify({ postId: createResult.body.post.id })
    });

    const commentResult = await requestJson(server, "/social/posts/comment", {
      method: "POST",
      headers: authHeaders(viewer),
      body: JSON.stringify({ postId: createResult.body.post.id, text: "Looks solid." })
    });
    assert.equal(commentResult.response.status, 200);
    assert.equal(commentResult.body.comment.text, "Looks solid.");

    const copyResult = await requestJson(server, "/social/posts/copy-to-log", {
      method: "POST",
      headers: authHeaders(viewer),
      body: JSON.stringify({ postId: createResult.body.post.id, mealType: "lunch" })
    });
    assert.equal(copyResult.response.status, 201);
    assert.equal(copyResult.body.meal.userId, 2);
    assert.equal(copyResult.body.meal.name, "Chicken rice bowl");
    assert.equal(copyResult.body.meal.mealType, "lunch");

    const mealsResult = await requestJson(server, "/meals", {
      headers: authHeaders(viewer)
    });
    assert.equal(mealsResult.body.meals.length, 1);
    assert.equal(mealsResult.body.meals[0].copiedFromPostId, createResult.body.post.id);
  });
});

test("HTTP social feed enforces visibility and calorie privacy", async () => {
  await withTestServer(async (server) => {
    const owner = await signup(server, "private-owner@example.com", "Private Owner");
    const stranger = await signup(server, "private-stranger@example.com", "Private Stranger");

    const privateResult = await requestJson(server, "/social/posts", {
      method: "POST",
      headers: authHeaders(owner),
      body: JSON.stringify({
        visibility: "private",
        meal: {
          name: "Private oats",
          calories: 420,
          protein: 22,
          carbs: 55,
          fats: 11
        }
      })
    });
    assert.equal(privateResult.response.status, 201);

    const publicHiddenResult = await requestJson(server, "/social/posts", {
      method: "POST",
      headers: authHeaders(owner),
      body: JSON.stringify({
        visibility: "public",
        privacy: { hideCalories: true },
        meal: {
          name: "Hidden macro bowl",
          calories: 530,
          protein: 34,
          carbs: 62,
          fats: 14
        }
      })
    });
    assert.equal(publicHiddenResult.response.status, 201);

    const strangerFeed = await requestJson(server, "/social/feed", {
      headers: authHeaders(stranger)
    });
    assert.equal(strangerFeed.response.status, 200);
    assert.equal(strangerFeed.body.posts.length, 1);
    assert.equal(strangerFeed.body.posts[0].meal.name, "Hidden macro bowl");
    assert.equal("calories" in strangerFeed.body.posts[0].meal, false);
    assert.equal("protein" in strangerFeed.body.posts[0].meal, false);

    const ownerFeed = await requestJson(server, "/social/feed", {
      headers: authHeaders(owner)
    });
    assert.equal(ownerFeed.body.posts.length, 2);
  });
});
