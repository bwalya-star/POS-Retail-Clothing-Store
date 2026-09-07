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
  async login(email, password) {
    const employee = await this.employeeRepository.findByEmail(email);
    if (!employee) {
      throw new InvalidCredentialsError("Invalid email or password.");
    }

    if (!employee.is_active) {
      throw new AccountDisabledError("This account has been disabled.");
    }

    const passwordMatches = bcrypt.compareSync(password, employee.password_hash);
    if (!passwordMatches) {
      await this.employeeRepository.incrementFailedAttempts(employee.id);
      const updated = await this.employeeRepository.findById(employee.id);
      if (updated.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
        await this.employeeRepository.deactivate(employee.id);
      }
      throw new InvalidCredentialsError("Invalid email or password.");
    }

    await this.employeeRepository.resetFailedAttempts(employee.id);
    const registerId = await this.employeeRepository.findRegisterIdByStoreId(employee.store_id);

    const token = jwt.sign(
      {
        sub: employee.id,
        role: employee.role,
        name: employee.government_name,
        storeId: employee.store_id,
        registerId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return { token, role: employee.role, name: employee.government_name, registerId };
  }
}

module.exports = { AuthService, InvalidCredentialsError, AccountDisabledError, JWT_SECRET };
