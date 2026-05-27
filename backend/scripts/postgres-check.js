const { dbProvider, databaseUrl, pgSslEnabled, pgSslRejectUnauthorized } = require("../src/config");

async function run() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const { Pool } = require("pg");
  const ssl = pgSslEnabled ? { rejectUnauthorized: pgSslRejectUnauthorized } : undefined;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl
  });

  try {
    const result = await pool.query("SELECT current_database() AS db_name, NOW() AS now");
    const row = result.rows[0];
    console.log(
      JSON.stringify(
        {
          ok: true,
          dbProvider,
          dbName: row.db_name,
          serverTime: row.now
        },
        null,
        2
      )
    );
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
