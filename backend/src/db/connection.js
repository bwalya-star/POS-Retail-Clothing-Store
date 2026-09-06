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
  migrateEmployeeIdentity(db);
  migrateProductDescription(db);

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

function migrateEmployeeIdentity(db) {
  const columns = db.prepare("PRAGMA table_info(employees)").all();
  const names = new Set(columns.map((column) => column.name));

  if (!names.has("email")) db.exec("ALTER TABLE employees ADD COLUMN email TEXT");
  if (!names.has("employee_number")) {
    db.exec("ALTER TABLE employees ADD COLUMN employee_number TEXT");
  }
  if (!names.has("government_name")) {
    db.exec("ALTER TABLE employees ADD COLUMN government_name TEXT");
  }

  db.exec(
    `UPDATE employees
     SET email = COALESCE(email, username || '@local.invalid'),
         employee_number = COALESCE(employee_number, 'LEGACY-' || id),
         government_name = COALESCE(government_name, name)
     WHERE email IS NULL OR employee_number IS NULL OR government_name IS NULL;
     CREATE UNIQUE INDEX IF NOT EXISTS employees_email_unique ON employees(email);
     CREATE UNIQUE INDEX IF NOT EXISTS employees_number_unique ON employees(employee_number);`
  );
}

function migrateProductDescription(db) {
  const columns = db.prepare("PRAGMA table_info(product_specifications)").all();
  const names = new Set(columns.map((column) => column.name));

  if (!names.has("description")) {
    db.exec("ALTER TABLE product_specifications ADD COLUMN description TEXT");
  }
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
