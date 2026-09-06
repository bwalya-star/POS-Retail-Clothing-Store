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
}

module.exports = EmployeeRepository;
