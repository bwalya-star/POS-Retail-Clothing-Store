const bcrypt = require("bcryptjs");
const { makeTestDb } = require("./testDb");
const EmployeeRepository = require("../src/repositories/employeeRepository");
const {
  EmployeeService,
  EmailTakenError,
  EmployeeNumberTakenError,
  InvalidRoleError,
  WeakPasswordError,
  EmployeeNotFoundError,
  SelfDemotionError,
  LastSuperAdminError,
} = require("../src/services/employeeService");

function insertRawEmployee(db, storeId, { employeeNumber, email, name, role }) {
  return db
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
      bcrypt.hashSync("password123", 10),
      name,
      role
    ).lastInsertRowid;
}

describe("EmployeeService (UC4)", () => {
  let db, storeId, employeeRepository, employeeService, superAdminId;

  beforeEach(() => {
    const ctx = makeTestDb();
    db = ctx.db;
    storeId = ctx.storeId;
    employeeRepository = new EmployeeRepository(db);
    employeeService = new EmployeeService(employeeRepository);
    superAdminId = insertRawEmployee(db, storeId, {
      employeeNumber: "TEST-0003",
      email: "superadmin1@test.local",
      name: "Super One",
      role: "superadmin",
    });
  });

  test("onboards an employee with a generated ID and hashed password", () => {
    const employee = employeeService.onboardEmployee({
      name: "New Hire",
      email: "newhire@test.local",
      password: "password123",
      role: "cashier",
      storeId,
    });
    expect(employee.email).toBe("newhire@test.local");
    expect(employee.employee_number).toBe("EMP-0001");
    expect(employee.name).toBe("New Hire");
    expect(bcrypt.compareSync("password123", employee.password_hash)).toBe(true);
  });

  test("rejects a duplicate email", () => {
    expect(() => employeeService.onboardEmployee({
      name: "Dupe Email",
      email: "superadmin1@test.local",
      password: "password123",
      role: "cashier",
      storeId,
    })).toThrow(EmailTakenError);
  });

  test("accepts a custom employee ID and rejects an existing ID", () => {
    const employee = employeeService.onboardEmployee({
      name: "Custom ID Employee",
      email: "custom.id@test.local",
      employeeNumber: "EMP-9000",
      password: "password123",
      role: "cashier",
      storeId,
    });
    expect(employee.employee_number).toBe("EMP-9000");
    expect(() => employeeService.onboardEmployee({
      name: "Duplicate ID",
      email: "duplicate.id@test.local",
      employeeNumber: "EMP-9000",
      password: "password123",
      role: "cashier",
      storeId,
    })).toThrow(EmployeeNumberTakenError);
  });

  test("rejects invalid roles and weak passwords", () => {
    expect(() => employeeService.onboardEmployee({
      name: "Bad Role",
      email: "badrole@test.local",
      password: "password123",
      role: "owner",
      storeId,
    })).toThrow(InvalidRoleError);
    expect(() => employeeService.onboardEmployee({
      name: "Weak",
      email: "weak@test.local",
      password: "short",
      role: "cashier",
      storeId,
    })).toThrow(WeakPasswordError);
  });

  test("assigns a role and rejects missing employees", () => {
    const cashier = employeeRepository.findByEmail("grace.mulenga@test.local");
    const updated = employeeService.assignRole({
      employeeId: cashier.id,
      role: "manager",
      requestingAdminId: superAdminId,
    });
    expect(updated.role).toBe("manager");
    expect(() => employeeService.assignRole({
      employeeId: 999999,
      role: "manager",
    })).toThrow(EmployeeNotFoundError);
  });

  test("guards self-demotion and the last active superadmin", () => {
    expect(() => employeeService.assignRole({
      employeeId: superAdminId,
      role: "manager",
      requestingAdminId: superAdminId,
    })).toThrow(SelfDemotionError);

    const otherId = insertRawEmployee(db, storeId, {
      employeeNumber: "TEST-0004",
      email: "other@test.local",
      name: "Other",
      role: "cashier",
    });
    expect(() => employeeService.assignRole({
      employeeId: superAdminId,
      role: "manager",
      requestingAdminId: otherId,
    })).toThrow(LastSuperAdminError);
  });

  test("lists employees with name, email, and employee number", () => {
    const employees = employeeService.listEmployees();
    expect(employees.some((employee) => employee.email === "superadmin1@test.local")).toBe(true);
    expect(employees.some((employee) => employee.name === "Super One")).toBe(true);
    expect(employees.some((employee) => employee.employee_number === "TEST-0003")).toBe(true);
  });

  test("allows updating an employee's name and email", () => {
    const cashier = employeeRepository.findByEmail("grace.mulenga@test.local");
    const updated = employeeService.updateDetails({
      employeeId: cashier.id,
      name: "Grace Mulenga",
      email: "grace.mulenga@pos.local",
    });
    expect(updated.name).toBe("Grace Mulenga");
    expect(updated.email).toBe("grace.mulenga@pos.local");
  });
});
