const bcrypt = require("bcryptjs");
const { createConnection } = require("../src/db/connection");

function makeTestDb() {
  const db = createConnection(":memory:");

  const storeId = db
    .prepare("INSERT INTO stores (name, address) VALUES (?, ?)")
    .run("Test Store", "Test Address").lastInsertRowid;
  const registerId = db
    .prepare("INSERT INTO registers (store_id) VALUES (?)")
    .run(storeId).lastInsertRowid;

  const insertEmployee = db.prepare(
    "INSERT INTO employees (store_id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)"
  );
  const cashierId = insertEmployee.run(
    storeId, "cashier", bcrypt.hashSync("cashier123", 10), "Test Cashier", "cashier"
  ).lastInsertRowid;
  const managerId = insertEmployee.run(
    storeId, "manager", bcrypt.hashSync("manager123", 10), "Test Manager", "manager"
  ).lastInsertRowid;

  const specId = db
    .prepare("INSERT INTO product_specifications (style_code, name, base_price) VALUES (?, ?, ?)")
    .run("TSH-001", "Classic T-Shirt", 15.0).lastInsertRowid;

  const insertVariant = db.prepare(
    `INSERT INTO product_variants (product_specification_id, sku, size, colour, unit_price, quantity_on_hand)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  insertVariant.run(specId, "TSH-001-M-BLK", "M", "Black", 15.0, 10);
  insertVariant.run(specId, "TSH-001-S-BLK", "S", "Black", 15.0, 0);

  return { db, storeId, registerId, cashierId, managerId };
}

module.exports = { makeTestDb };
