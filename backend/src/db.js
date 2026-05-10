const { Pool } = require("pg");
const { databaseUrl } = require("./config");

const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

/**
 * Execute a SQL query with optional parameters.
 * @param {string} text - SQL query text
 * @param {any[]} [params] - Query parameters
 * @returns {Promise<import("pg").QueryResult>}
 */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Get a client from the pool for transactions.
 * Remember to call client.release() when done.
 */
async function getClient() {
  return pool.connect();
}

/**
 * Gracefully shut down the pool.
 */
async function closePool() {
  return pool.end();
}

module.exports = {
  query,
  getClient,
  closePool,
  pool
};
