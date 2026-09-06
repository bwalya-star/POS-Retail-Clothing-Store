const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

function createConnection(dbPath) {
  const isMemory = dbPath === ":memory:";
  if (!isMemory) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);

  // node:sqlite has no built-in transaction() helper (unlike better-sqlite3);
  // wrap BEGIN/COMMIT/ROLLBACK so callers get the same atomic-transaction API.
  db.transaction = function transaction(fn) {
    return (...args) => {
      db.exec("BEGIN");
      try {
        const result = fn(...args);
        db.exec("COMMIT");
        return result;
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    };
  };

  return db;
}

const DEFAULT_DB_PATH = path.join(__dirname, "..", "..", "data", "pos.sqlite3");

let sharedConnection = null;
function getConnection() {
  if (!sharedConnection) {
    sharedConnection = createConnection(process.env.DB_PATH || DEFAULT_DB_PATH);
  }
  return sharedConnection;
}

module.exports = { createConnection, getConnection, DEFAULT_DB_PATH };
