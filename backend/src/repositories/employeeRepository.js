class EmployeeRepository {
  constructor(db) {
    this.db = db;
  }

  findByEmail(email) {
    return this.db
      .prepare("SELECT * FROM employees WHERE email = ?")
      .get(email);
  }

  findByEmployeeNumber(employeeNumber) {
    return this.db
      .prepare("SELECT * FROM employees WHERE employee_number = ?")
      .get(employeeNumber);
  }

  getNextEmployeeNumber() {
    const result = this.db
      .prepare(
        `SELECT MAX(CAST(SUBSTR(employee_number, 5) AS INTEGER)) AS highest
         FROM employees
         WHERE employee_number GLOB 'EMP-[0-9]*'`
      )
      .get();
    const nextNumber = (result.highest || 0) + 1;
    return `EMP-${String(nextNumber).padStart(4, "0")}`;
  }

  findById(id) {
    return this.db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  }

  incrementFailedAttempts(id) {
    this.db
      .prepare(
        "UPDATE employees SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?"
      )
      .run(id);
  }

  resetFailedAttempts(id) {
    this.db
      .prepare("UPDATE employees SET failed_login_attempts = 0 WHERE id = ?")
      .run(id);
  }

  deactivate(id) {
    this.db.prepare("UPDATE employees SET is_active = 0 WHERE id = ?").run(id);
  }

<<<<<<< HEAD
  insert({ storeId, username, passwordHash, name, role }) {
    const result = this.db
      .prepare(
        `INSERT INTO employees (store_id, username, password_hash, name, role)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(storeId, username, passwordHash, name, role);
=======
  insert({ storeId, email, employeeNumber, name, passwordHash, role }) {
    const result = this.db
      .prepare(
        `INSERT INTO employees
         (store_id, email, employee_number, government_name, username, password_hash, name, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        storeId,
        email,
        employeeNumber,
        name,
        email,
        passwordHash,
        name,
        role
      );
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
    return result.lastInsertRowid;
  }

  updateRole(id, role) {
    this.db.prepare("UPDATE employees SET role = ? WHERE id = ?").run(role, id);
  }

<<<<<<< HEAD
  listAll() {
    return this.db
      .prepare(
        "SELECT id, store_id, username, name, role, is_active FROM employees ORDER BY name"
=======
  findByEmailExcludingId(email, id) {
    return this.db
      .prepare("SELECT * FROM employees WHERE email = ? AND id != ?")
      .get(email, id);
  }

  updateDetails(id, name, email) {
    this.db
      .prepare(
        `UPDATE employees
         SET name = ?, government_name = ?, email = ?, username = ?
         WHERE id = ?`
      )
      .run(name, name, email, email, id);
  }

  listAll() {
    return this.db
      .prepare(
        `SELECT id, store_id, email, employee_number, name, role, is_active
         FROM employees ORDER BY name`
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
      )
      .all();
  }

  countActiveByRole(role) {
    return this.db
      .prepare(
        "SELECT COUNT(*) as count FROM employees WHERE role = ? AND is_active = 1"
      )
      .get(role).count;
  }
}

module.exports = EmployeeRepository;
