class EmployeeRepository {
  constructor(db) {
    this.db = db;
  }

  findByUsername(username) {
    return this.db
      .prepare("SELECT * FROM employees WHERE username = ?")
      .get(username);
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

  insert({ storeId, username, passwordHash, name, role }) {
    const result = this.db
      .prepare(
        `INSERT INTO employees (store_id, username, password_hash, name, role)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(storeId, username, passwordHash, name, role);
    return result.lastInsertRowid;
  }

  updateRole(id, role) {
    this.db.prepare("UPDATE employees SET role = ? WHERE id = ?").run(role, id);
  }

  listAll() {
    return this.db
      .prepare(
        "SELECT id, store_id, username, name, role, is_active FROM employees ORDER BY name"
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
