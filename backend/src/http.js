const { URL } = require("node:url");

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendNotFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

function sendMethodNotAllowed(res) {
  sendJson(res, 405, { error: "Method not allowed" });
}

function parseUrl(req) {
  return new URL(req.url, `http://${req.headers.host || "localhost"}`);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

module.exports = {
  sendJson,
  sendNotFound,
  sendMethodNotAllowed,
  parseUrl,
  readJsonBody
};

