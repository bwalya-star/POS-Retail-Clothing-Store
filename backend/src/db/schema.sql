-- Mirrors the conceptual classes in docs/domain_model.md
-- Postgres dialect (see docs/database_design.md for the ERD).

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT
);

CREATE TABLE IF NOT EXISTS registers (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id)
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  email TEXT UNIQUE,
  employee_number TEXT UNIQUE,
  government_name TEXT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('cashier', 'manager', 'superadmin')),
  is_active INTEGER NOT NULL DEFAULT 1,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_specifications (
  id SERIAL PRIMARY KEY,
  style_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  base_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_specification_id INTEGER NOT NULL REFERENCES product_specifications(id),
  sku TEXT NOT NULL UNIQUE,
  size TEXT NOT NULL,
  colour TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_info TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  register_id INTEGER NOT NULL REFERENCES registers(id),
  cashier_id INTEGER NOT NULL REFERENCES employees(id),
  customer_id INTEGER REFERENCES customers(id),
  date_time TEXT NOT NULL,
  total_amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_line_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  product_variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  change_due REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id SERIAL PRIMARY KEY,
  product_variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  manager_id INTEGER NOT NULL REFERENCES employees(id),
  quantity_changed INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'restock',
  timestamp TEXT NOT NULL
);
