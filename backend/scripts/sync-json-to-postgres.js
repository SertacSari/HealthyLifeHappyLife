const fs = require("node:fs");
const {
  databaseUrl,
  dbFilePath,
  pgSslEnabled,
  pgSslRejectUnauthorized
} = require("../src/config");
const { hydrateDbShape } = require("../src/db");

async function run() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }
  if (!fs.existsSync(dbFilePath)) {
    throw new Error(`JSON database file not found: ${dbFilePath}`);
  }

  const raw = fs.readFileSync(dbFilePath, "utf8");
  const payload = hydrateDbShape(JSON.parse(raw));

  const { Pool } = require("pg");
  const ssl = pgSslEnabled ? { rejectUnauthorized: pgSslRejectUnauthorized } : undefined;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(
      `
        INSERT INTO app_state (id, payload, updated_at)
        VALUES (1, $1::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE
        SET payload = EXCLUDED.payload, updated_at = NOW()
      `,
      [JSON.stringify(payload)]
    );

    console.log("JSON data synced to PostgreSQL app_state.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
