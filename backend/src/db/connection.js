const path = require("path");
const fs = require("fs");
const { Client } = require("pg");

function toPositional(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function createConnection(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();

  const db = {
    async query(sql, params = []) {
      return client.query(toPositional(sql), params);
    },
    async close() {
      await client.end();
    },
    // node:sqlite (and better-sqlite3) have a synchronous transaction()
    // helper; this async equivalent preserves the same call shape
    // (`db.transaction(fn)` returns a function you then invoke) so callers
    // didn't need to change when the driver did.
    transaction(fn) {
      return async (...args) => {
        await client.query("BEGIN");
        try {
          const result = await fn(...args);
          await client.query("COMMIT");
          return result;
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        }
      };
    },
  };

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await client.query(schema);

  return db;
}

let sharedConnection = null;
async function getConnection() {
  if (!sharedConnection) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required.");
    }
    sharedConnection = await createConnection(connectionString);
  }
  return sharedConnection;
}

module.exports = { createConnection, getConnection };
