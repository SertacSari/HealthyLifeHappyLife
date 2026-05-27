const {
  fatsecretClientId,
  fatsecretClientSecret,
  fatsecretScope,
  fatsecretOauthUrl,
  fatsecretApiBaseUrl,
  fatsecretRegion,
  fatsecretLanguage,
  fatsecretTimeoutMs
} = require("./config");

let cachedToken = null;

function createFatsecretError(message, status = 502) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function parseFoodDescription(description) {
  if (typeof description !== "string" || description.trim().length === 0) {
    return {
      servingDescription: "",
      calories: null,
      protein: null,
      carbs: null,
      fats: null
    };
  }

  const [servingPart, nutritionPart = ""] = description.split(/\s+-\s+/, 2);
  const normalized = nutritionPart || description;
  const findValue = (label) => {
    const match = normalized.match(new RegExp(`${label}:\\s*([0-9]+(?:\\.[0-9]+)?)`, "i"));
    return match ? toNumber(match[1]) : null;
  };

  return {
    servingDescription: servingPart.trim(),
    calories: findValue("Calories"),
    protein: findValue("Protein"),
    carbs: findValue("Carbs"),
    fats: findValue("Fat")
  };
}

async function fetchJson(url, options, timeoutMs = fatsecretTimeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    const text = await response.text();
    let body = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (_error) {
        throw createFatsecretError("FatSecret returned an invalid JSON response");
      }
    }
    if (!response.ok) {
      const message = body.error_description || body.error || `FatSecret request failed with status ${response.status}`;
      throw createFatsecretError(message, response.status >= 500 ? 502 : response.status);
    }
    return body;
  } catch (error) {
    if (error.name === "AbortError") {
      throw createFatsecretError("FatSecret request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function getAccessToken() {
  if (!fatsecretClientId || !fatsecretClientSecret) {
    throw createFatsecretError("FatSecret credentials are not configured", 503);
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const credentials = Buffer.from(`${fatsecretClientId}:${fatsecretClientSecret}`, "utf8").toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: fatsecretScope
  });

  const data = await fetchJson(fatsecretOauthUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!data.access_token) {
    throw createFatsecretError("FatSecret token response did not include an access token");
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + Number(data.expires_in || 86400) * 1000
  };
  return cachedToken.accessToken;
}

function normalizeFood(food) {
  const parsedDescription = parseFoodDescription(food.food_description);
  return {
    foodId: String(food.food_id || ""),
    name: food.food_name || "",
    brandName: food.brand_name || "",
    type: food.food_type || "",
    url: food.food_url || "",
    description: food.food_description || "",
    servingDescription: parsedDescription.servingDescription,
    calories: parsedDescription.calories,
    protein: parsedDescription.protein,
    carbs: parsedDescription.carbs,
    fats: parsedDescription.fats
  };
}

function parseInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

async function searchFoods(query, options = {}) {
  if (typeof query !== "string" || query.trim().length < 2 || query.length > 120) {
    throw createFatsecretError("Query must be between 2 and 120 characters", 400);
  }

  const pageNumber = Math.max(0, parseInteger(options.pageNumber, 0));
  const maxResults = Math.min(25, Math.max(1, parseInteger(options.maxResults, 10)));
  const token = await getAccessToken();
  const url = new URL(`${fatsecretApiBaseUrl.replace(/\/$/, "")}/foods/search/v1`);
  url.searchParams.set("search_expression", query.trim());
  url.searchParams.set("page_number", String(pageNumber));
  url.searchParams.set("max_results", String(maxResults));
  url.searchParams.set("format", "json");
  if (fatsecretRegion) {
    url.searchParams.set("region", fatsecretRegion);
  }
  if (fatsecretLanguage) {
    url.searchParams.set("language", fatsecretLanguage);
  }

  const data = await fetchJson(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const foods = data.foods || {};
  return {
    query: query.trim(),
    pageNumber: parseInteger(foods.page_number, pageNumber),
    maxResults: parseInteger(foods.max_results, maxResults),
    totalResults: parseInteger(foods.total_results, 0),
    foods: normalizeArray(foods.food).map(normalizeFood).filter((food) => food.foodId && food.name)
  };
}

module.exports = {
  parseFoodDescription,
  searchFoods
};
