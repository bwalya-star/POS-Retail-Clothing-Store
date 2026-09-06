const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const MAX_FAILED_ATTEMPTS = 5;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRY = "8h";

class InvalidCredentialsError extends Error {}
class AccountDisabledError extends Error {}

class AuthService {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  // UC1: Login
  login(username, password) {
    const employee = this.employeeRepository.findByUsername(username);
    if (!employee) {
      throw new InvalidCredentialsError("Invalid username or password.");
    }

    if (!employee.is_active) {
      throw new AccountDisabledError("This account has been disabled.");
    }

    const passwordMatches = bcrypt.compareSync(password, employee.password_hash);
    if (!passwordMatches) {
      this.employeeRepository.incrementFailedAttempts(employee.id);
      const updated = this.employeeRepository.findById(employee.id);
      if (updated.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
        this.employeeRepository.deactivate(employee.id);
      }
      throw new InvalidCredentialsError("Invalid username or password.");
    }

    this.employeeRepository.resetFailedAttempts(employee.id);

    const token = jwt.sign(
      { sub: employee.id, role: employee.role, name: employee.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return { token, role: employee.role, name: employee.name };
  }
}

module.exports = { AuthService, InvalidCredentialsError, AccountDisabledError, JWT_SECRET };
