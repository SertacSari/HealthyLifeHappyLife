const { openaiApiKey, openaiBaseUrl, openaiModel, openaiTimeoutMs } = require("./config");

function isLocalBaseUrl(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url || "");
}

function buildPrompt(summary) {
  const lines = [
    "You are a fitness coaching assistant for a mobile app.",
    "Provide only non-medical wellness guidance.",
    "Never provide diagnosis, treatment, cure, medication, or disease claims.",
    "Create up to 4 practical recommendations for today's meals/workouts.",
    "Return strict JSON with shape:",
    '{ "disclaimer": string, "tips": [{ "area": "nutrition"|"workout"|"recovery"|"consistency", "title": string, "message": string }] }',
    "Keep messages concise and actionable.",
    "",
    `Date: ${summary.date}`,
    `Calories in: ${summary.totalCaloriesIn}`,
    `Calories out: ${summary.totalCaloriesOut}`,
    `Net calories: ${summary.netCalories}`,
    `Workout minutes: ${summary.workoutMinutes}`,
    `Meals count: ${summary.mealsCount}`,
    `Workouts count: ${summary.workoutsCount}`,
    `Macros protein/carbs/fats: ${summary.macros.protein}/${summary.macros.carbs}/${summary.macros.fats}`,
    `Goal calories: ${summary.goals ? summary.goals.goalCalories : "unknown"}`,
    `Goal workouts per week: ${summary.goals ? summary.goals.goalWorkoutsPerWeek : "unknown"}`
  ];

  return lines.join("\n");
}

function sanitizeTips(rawTips) {
  if (!Array.isArray(rawTips)) {
    return [];
  }
  return rawTips
    .map((tip) => ({
      area: typeof tip?.area === "string" ? tip.area.trim() : "",
      title: typeof tip?.title === "string" ? tip.title.trim() : "",
      message: typeof tip?.message === "string" ? tip.message.trim() : ""
    }))
    .filter((tip) => tip.area && tip.title && tip.message)
    .slice(0, 4);
}

function parseJsonResponse(content) {
  if (typeof content !== "string" || content.trim().length === 0) {
    return null;
  }

  // Handle occasional markdown-wrapped JSON.
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return null;
  }
}

async function generateRecommendationsWithLlm(summary) {
  if (!openaiApiKey && !isLocalBaseUrl(openaiBaseUrl)) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), openaiTimeoutMs);
  const headers = {
    "Content-Type": "application/json"
  };
  if (openaiApiKey) {
    headers.Authorization = `Bearer ${openaiApiKey}`;
  }
  try {
    const response = await fetch(`${openaiBaseUrl}/responses`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: openaiModel,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: "Return strict JSON only." }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: buildPrompt(summary) }]
          }
        ],
        text: { format: { type: "json_object" } }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${body}`);
    }

    const data = await response.json();
    const outputText = typeof data?.output_text === "string" ? data.output_text : "";
    const parsed = parseJsonResponse(outputText);
    if (!parsed) {
      throw new Error("OpenAI response was not valid JSON");
    }

    const disclaimer =
      typeof parsed.disclaimer === "string" && parsed.disclaimer.trim().length > 0
        ? parsed.disclaimer.trim()
        : "General wellness guidance only. This app does not provide medical advice, diagnosis, or treatment.";

    const tips = sanitizeTips(parsed.tips);
    if (tips.length === 0) {
      throw new Error("OpenAI response did not include usable tips");
    }

    return {
      date: summary.date,
      disclaimer,
      tips,
      source: "llm"
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateRecommendationsWithLlm
};
