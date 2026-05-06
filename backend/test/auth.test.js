const test = require("node:test");
const assert = require("node:assert/strict");
const { createSalt, hashPassword, verifyPassword, createToken, verifyToken } = require("../src/auth");

test("hash and verify password", () => {
  const salt = createSalt();
  const hash = hashPassword("StrongPass123", salt);
  assert.equal(verifyPassword("StrongPass123", salt, hash), true);
  assert.equal(verifyPassword("WrongPass123", salt, hash), false);
});

test("create and verify token", () => {
  const token = createToken({ userId: 42 }, "unit-test-secret", 3600);
  const decoded = verifyToken(token, "unit-test-secret");
  assert.equal(decoded.valid, true);
  assert.equal(decoded.payload.userId, 42);
});

