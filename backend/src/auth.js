const crypto = require("node:crypto");

function createSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password, salt, hash) {
  const attempt = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(attempt, "hex"), Buffer.from(hash, "hex"));
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(text, secret) {
  return crypto.createHmac("sha256", secret).update(text).digest("base64url");
}

function createToken(payload, secret, ttlSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  const issuedAt = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(content, secret);
  return `${content}.${signature}`;
}

function verifyToken(token, secret) {
  if (!token || token.split(".").length !== 3) {
    return { valid: false, reason: "Malformed token" };
  }
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  const content = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(content, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (actualBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: "Invalid signature" };
  }
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return { valid: false, reason: "Invalid signature" };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: "Token expired" };
    }
    return { valid: true, payload };
  } catch (_error) {
    return { valid: false, reason: "Invalid payload" };
  }
}

module.exports = {
  createSalt,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken
};
