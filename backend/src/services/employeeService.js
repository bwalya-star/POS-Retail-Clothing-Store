const bcrypt = require("bcryptjs");

const VALID_ROLES = ["cashier", "manager", "superadmin"];
const MIN_PASSWORD_LENGTH = 8;

class EmailTakenError extends Error {}
class EmployeeNumberTakenError extends Error {}
class InvalidEmployeeDetailsError extends Error {}
class InvalidRoleError extends Error {}
class WeakPasswordError extends Error {}
class EmployeeNotFoundError extends Error {}
class SelfDemotionError extends Error {}
class LastSuperAdminError extends Error {}

class EmployeeService {
  constructor(employeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  onboardEmployee({ name, email, employeeNumber, password, role, storeId }) {
    if (!VALID_ROLES.includes(role)) {
      throw new InvalidRoleError(
        `Role must be one of: ${VALID_ROLES.join(", ")}.`
      );
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new WeakPasswordError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
    }

    const existing = this.employeeRepository.findByEmail(email);
    if (existing) {
      throw new EmailTakenError(`Email "${email}" is already registered.`);
    }

    const requestedNumber = employeeNumber?.trim();
    if (requestedNumber && this.employeeRepository.findByEmployeeNumber(requestedNumber)) {
      throw new EmployeeNumberTakenError(
        `Employee number "${requestedNumber}" is already in use.`
      );
    }
    employeeNumber = requestedNumber || this.employeeRepository.getNextEmployeeNumber();

    const passwordHash = bcrypt.hashSync(password, 10);
    const employeeId = this.employeeRepository.insert({
      storeId,
      email,
      employeeNumber,
      name,
      passwordHash,
      role,
    });

    return this.employeeRepository.findById(employeeId);
  }

  assignRole({ employeeId, role, requestingAdminId }) {
    if (!VALID_ROLES.includes(role)) {
      throw new InvalidRoleError(
        `Role must be one of: ${VALID_ROLES.join(", ")}.`
      );
    }

    const target = this.employeeRepository.findById(employeeId);
    if (!target) {
      throw new EmployeeNotFoundError(`No employee found with id ${employeeId}.`);
    }

    if (target.role === "superadmin" && role !== "superadmin") {
      if (
        requestingAdminId != null &&
        Number(requestingAdminId) === Number(employeeId)
      ) {
        throw new SelfDemotionError(
          "You cannot change your own Super Admin role."
        );
      }

      const activeSuperAdmins = this.employeeRepository.countActiveByRole(
        "superadmin"
      );
      if (activeSuperAdmins <= 1) {
        throw new LastSuperAdminError(
          "Cannot change this role: at least one active Super Admin must remain."
        );
      }
    }

    this.employeeRepository.updateRole(employeeId, role);
    return this.employeeRepository.findById(employeeId);
  }

  updateDetails({ employeeId, name, email }) {
    const employee = this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new EmployeeNotFoundError(`No employee found with id ${employeeId}.`);
    }
    if (!name || !email) {
      throw new InvalidEmployeeDetailsError("Name and email are required.");
    }
    if (this.employeeRepository.findByEmailExcludingId(email, employeeId)) {
      throw new EmailTakenError(`Email "${email}" is already registered.`);
    }
    this.employeeRepository.updateDetails(employeeId, name, email);
    return this.employeeRepository.findById(employeeId);
  }

  listEmployees() {
    return this.employeeRepository.listAll();
  }
}

module.exports = {
  EmployeeService,
  EmailTakenError,
  EmployeeNumberTakenError,
  InvalidRoleError,
  WeakPasswordError,
  EmployeeNotFoundError,
  SelfDemotionError,
  LastSuperAdminError,
  InvalidEmployeeDetailsError,
};
