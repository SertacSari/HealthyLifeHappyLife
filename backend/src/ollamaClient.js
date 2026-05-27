const { ollamaBaseUrl, ollamaModel, ollamaTimeoutMs } = require("./config");

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function extractOllamaText(data) {
  if (typeof data?.response === "string") {
    return data.response;
  }
  if (typeof data?.message?.content === "string") {
    return data.message.content;
  }
  return "";
}

async function generateJsonWithOllama(prompt, options = {}) {
  const baseUrl = trimTrailingSlash(options.baseUrl || ollamaBaseUrl);
  const model = options.model || ollamaModel;
  const timeoutMs = Number(options.timeoutMs || ollamaTimeoutMs);
  const fetchImpl = options.fetch || fetch;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${body}`);
    }

    const data = await response.json();
    const text = extractOllamaText(data);
    if (!text) {
      throw new Error("Ollama response did not include JSON text");
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateJsonWithOllama
};
