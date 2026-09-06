const bcrypt = require("bcryptjs");
const { getConnection } = require("./connection");

function seed() {
  const db = getConnection();

  db.exec(
    `DELETE FROM stock_adjustments;
     DELETE FROM payments;
     DELETE FROM sales_line_items;
     DELETE FROM sales;
     DELETE FROM customers;
     DELETE FROM product_variants;
     DELETE FROM product_specifications;
     DELETE FROM employees;
     DELETE FROM registers;
     DELETE FROM stores;`
  );

  const storeId = db
    .prepare("INSERT INTO stores (name, address) VALUES (?, ?)")
    .run("Downtown Clothing Store", "12 Cairo Road, Lusaka").lastInsertRowid;

  const registerId = db
    .prepare("INSERT INTO registers (store_id) VALUES (?)")
    .run(storeId).lastInsertRowid;

  const employees = [
    { username: "admin", password: "admin123", name: "System Administrator", role: "admin" },
    { username: "manager", password: "manager123", name: "Store Manager", role: "manager" },
    { username: "cashier", password: "cashier123", name: "Sales Assistant", role: "cashier" },
  ];
  const insertEmployee = db.prepare(
    "INSERT INTO employees (store_id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)"
  );
  for (const e of employees) {
    insertEmployee.run(storeId, e.username, bcrypt.hashSync(e.password, 10), e.name, e.role);
  }

  const specs = [
    { styleCode: "TSH-001", name: "Classic T-Shirt", basePrice: 15.0 },
    { styleCode: "JNS-001", name: "Slim Fit Jeans", basePrice: 35.0 },
    { styleCode: "JKT-001", name: "Denim Jacket", basePrice: 55.0 },
  ];
  const insertSpec = db.prepare(
    "INSERT INTO product_specifications (style_code, name, base_price) VALUES (?, ?, ?)"
  );
  const specIds = specs.map((s) => insertSpec.run(s.styleCode, s.name, s.basePrice).lastInsertRowid);

  const variants = [
    { specIdx: 0, sku: "TSH-001-S-BLK", size: "S", colour: "Black", price: 15.0, qty: 20 },
    { specIdx: 0, sku: "TSH-001-M-BLK", size: "M", colour: "Black", price: 15.0, qty: 25 },
    { specIdx: 0, sku: "TSH-001-M-WHT", size: "M", colour: "White", price: 15.0, qty: 15 },
    { specIdx: 1, sku: "JNS-001-32-BLU", size: "32", colour: "Blue", price: 35.0, qty: 10 },
    { specIdx: 1, sku: "JNS-001-34-BLU", size: "34", colour: "Blue", price: 35.0, qty: 8 },
    { specIdx: 2, sku: "JKT-001-M-BLU", size: "M", colour: "Blue", price: 55.0, qty: 5 },
  ];
  const insertVariant = db.prepare(
    `INSERT INTO product_variants
     (product_specification_id, sku, size, colour, unit_price, quantity_on_hand)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (const v of variants) {
    insertVariant.run(specIds[v.specIdx], v.sku, v.size, v.colour, v.price, v.qty);
  }

  console.log("Seed complete:");
  console.log("  Store:", storeId, "Register:", registerId);
  console.log("  Employees:", employees.map((e) => `${e.username}/${e.password} (${e.role})`).join(", "));
  console.log("  Product variants:", variants.map((v) => v.sku).join(", "));
}

if (require.main === module) {
  seed();
}

module.exports = seed;
