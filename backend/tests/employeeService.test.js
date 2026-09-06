const bcrypt = require("bcryptjs");
const { makeTestDb } = require("./testDb");
const EmployeeRepository = require("../src/repositories/employeeRepository");
const {
  EmployeeService,
  UsernameTakenError,
  InvalidRoleError,
  WeakPasswordError,
  EmployeeNotFoundError,
  SelfDemotionError,
  LastSuperAdminError,
} = require("../src/services/employeeService");

function insertRawEmployee(
  db,
  storeId,
  { username, name, role, password = "password123" }
) {
  return db
    .prepare(
      `INSERT INTO employees (store_id, username, password_hash, name, role)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(storeId, username, bcrypt.hashSync(password, 10), name, role)
    .lastInsertRowid;
}

describe("EmployeeService (UC4: Onboard Employee & Assign Role)", () => {
  let db, storeId, employeeRepository, employeeService, superAdminId;

  beforeEach(() => {
    const ctx = makeTestDb();
    db = ctx.db;
    storeId = ctx.storeId;
    employeeRepository = new EmployeeRepository(db);
    employeeService = new EmployeeService(employeeRepository);

    superAdminId = insertRawEmployee(db, storeId, {
      username: "superadmin1",
      name: "Super One",
      role: "superadmin",
    });
  });

  test("onboards a new employee with a hashed password and the given role", () => {
    const employee = employeeService.onboardEmployee({
      name: "New Hire",
      username: "newhire",
      password: "password123",
      role: "cashier",
      storeId,
    });

    expect(employee.username).toBe("newhire");
    expect(employee.role).toBe("cashier");
    expect(employee.password_hash).not.toBe("password123");
    expect(bcrypt.compareSync("password123", employee.password_hash)).toBe(true);
  });

  test("throws UsernameTakenError when the username already exists", () => {
    expect(() =>
      employeeService.onboardEmployee({
        name: "Dupe",
        username: "superadmin1",
        password: "password123",
        role: "cashier",
        storeId,
      })
    ).toThrow(UsernameTakenError);
  });

  test("throws InvalidRoleError for an unrecognized role on onboarding", () => {
    expect(() =>
      employeeService.onboardEmployee({
        name: "Bad Role",
        username: "badrole",
        password: "password123",
        role: "owner",
        storeId,
      })
    ).toThrow(InvalidRoleError);
  });

  test("throws WeakPasswordError for a password under 8 characters", () => {
    expect(() =>
      employeeService.onboardEmployee({
        name: "Weak Pw",
        username: "weakpw",
        password: "abc123",
        role: "cashier",
        storeId,
      })
    ).toThrow(WeakPasswordError);
  });

  test("throws WeakPasswordError for an empty password", () => {
    expect(() =>
      employeeService.onboardEmployee({
        name: "No Pw",
        username: "nopw",
        password: "",
        role: "cashier",
        storeId,
      })
    ).toThrow(WeakPasswordError);
  });

  test("updates an existing employee's role", () => {
    const cashier = employeeRepository.findByUsername("cashier");
    const updated = employeeService.assignRole({
      employeeId: cashier.id,
      role: "manager",
      requestingAdminId: superAdminId,
    });
    expect(updated.role).toBe("manager");
  });

  test("throws InvalidRoleError when assigning an unrecognized role", () => {
    const cashier = employeeRepository.findByUsername("cashier");
    expect(() =>
      employeeService.assignRole({
        employeeId: cashier.id,
        role: "owner",
        requestingAdminId: superAdminId,
      })
    ).toThrow(InvalidRoleError);
  });

  test("throws EmployeeNotFoundError when the employee doesn't exist", () => {
    expect(() =>
      employeeService.assignRole({
        employeeId: 999999,
        role: "manager",
        requestingAdminId: superAdminId,
      })
    ).toThrow(EmployeeNotFoundError);
  });

  test("throws SelfDemotionError when a Super Admin tries to change their own role", () => {
    expect(() =>
      employeeService.assignRole({
        employeeId: superAdminId,
        role: "manager",
        requestingAdminId: superAdminId,
      })
    ).toThrow(SelfDemotionError);
  });

  test("throws LastSuperAdminError when demoting the only Super Admin, even by a different admin", () => {
    const otherAdminId = insertRawEmployee(db, storeId, {
      username: "acting-admin",
      name: "Acting Admin",
      role: "cashier",
    });

    expect(() =>
      employeeService.assignRole({
        employeeId: superAdminId,
        role: "manager",
        requestingAdminId: otherAdminId,
      })
    ).toThrow(LastSuperAdminError);
  });

  test("allows demoting a Super Admin when another active Super Admin remains", () => {
    const secondSuperAdminId = insertRawEmployee(db, storeId, {
      username: "superadmin2",
      name: "Super Two",
      role: "superadmin",
    });

    const updated = employeeService.assignRole({
      employeeId: superAdminId,
      role: "manager",
      requestingAdminId: secondSuperAdminId,
    });
    expect(updated.role).toBe("manager");
  });

  test("does not block re-assigning superadmin -> superadmin on yourself", () => {
    const updated = employeeService.assignRole({
      employeeId: superAdminId,
      role: "superadmin",
      requestingAdminId: superAdminId,
    });
    expect(updated.role).toBe("superadmin");
  });

  test("listEmployees returns all employees for the list UI", () => {
    const all = employeeService.listEmployees();
    expect(all.length).toBeGreaterThanOrEqual(3);
    expect(all.some((employee) => employee.username === "superadmin1")).toBe(true);
  });
});
