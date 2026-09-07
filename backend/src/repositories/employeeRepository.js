class EmployeeRepository {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const { rows } = await this.db.query("SELECT * FROM employees WHERE email = ?", [email]);
    return rows[0];
  }

  async findByEmployeeNumber(employeeNumber) {
    const { rows } = await this.db.query(
      "SELECT * FROM employees WHERE employee_number = ?",
      [employeeNumber]
    );
    return rows[0];
  }

  async findRegisterIdByStoreId(storeId) {
    const { rows } = await this.db.query(
      "SELECT id FROM registers WHERE store_id = ? ORDER BY id LIMIT 1",
      [storeId]
    );
    return rows[0] ? rows[0].id : null;
  }

  async getNextEmployeeNumber() {
    const { rows } = await this.db.query(
      `SELECT MAX(CAST(SUBSTR(employee_number, 5) AS INTEGER)) AS highest
       FROM employees
       WHERE employee_number ~ '^EMP-[0-9]+$'`
    );
    const nextNumber = (rows[0].highest || 0) + 1;
    return `EMP-${String(nextNumber).padStart(4, "0")}`;
  }

  async findById(id) {
    const { rows } = await this.db.query("SELECT * FROM employees WHERE id = ?", [id]);
    return rows[0];
  }

  async incrementFailedAttempts(id) {
    await this.db.query(
      "UPDATE employees SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?",
      [id]
    );
  }

  async resetFailedAttempts(id) {
    await this.db.query("UPDATE employees SET failed_login_attempts = 0 WHERE id = ?", [id]);
  }

  async deactivate(id) {
    await this.db.query("UPDATE employees SET is_active = 0 WHERE id = ?", [id]);
  }

  async insert({ storeId, email, employeeNumber, name, passwordHash, role }) {
    const { rows } = await this.db.query(
      `INSERT INTO employees
       (store_id, email, employee_number, government_name, username, password_hash, name, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
      [storeId, email, employeeNumber, name, email, passwordHash, name, role]
    );
    return rows[0].id;
  }

  async updateRole(id, role) {
    await this.db.query("UPDATE employees SET role = ? WHERE id = ?", [role, id]);
  }

  async findByEmailExcludingId(email, id) {
    const { rows } = await this.db.query(
      "SELECT * FROM employees WHERE email = ? AND id != ?",
      [email, id]
    );
    return rows[0];
  }

  async updateDetails(id, name, email) {
    await this.db.query(
      `UPDATE employees
       SET name = ?, government_name = ?, email = ?, username = ?
       WHERE id = ?`,
      [name, name, email, email, id]
    );
  }

  async listAll() {
    const { rows } = await this.db.query(
      `SELECT id, store_id, email, employee_number, name, role, is_active
       FROM employees ORDER BY name`
    );
    return rows;
  }

  async countActiveByRole(role) {
    const { rows } = await this.db.query(
      "SELECT COUNT(*) as count FROM employees WHERE role = ? AND is_active = 1",
      [role]
    );
    return Number(rows[0].count);
  }
}

module.exports = EmployeeRepository;
