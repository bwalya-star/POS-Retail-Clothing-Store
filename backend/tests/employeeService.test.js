const bcrypt = require("bcryptjs");
const { makeTestDb } = require("./testDb");
const EmployeeRepository = require("../src/repositories/employeeRepository");
const {
  EmployeeService,
<<<<<<< HEAD
  UsernameTakenError,
=======
  EmailTakenError,
  EmployeeNumberTakenError,
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
  InvalidRoleError,
  WeakPasswordError,
  EmployeeNotFoundError,
  SelfDemotionError,
  LastSuperAdminError,
} = require("../src/services/employeeService");

<<<<<<< HEAD
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
=======
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
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
  let db, storeId, employeeRepository, employeeService, superAdminId;

  beforeEach(() => {
    const ctx = makeTestDb();
    db = ctx.db;
    storeId = ctx.storeId;
    employeeRepository = new EmployeeRepository(db);
    employeeService = new EmployeeService(employeeRepository);
<<<<<<< HEAD

    superAdminId = insertRawEmployee(db, storeId, {
      username: "superadmin1",
=======
    superAdminId = insertRawEmployee(db, storeId, {
      employeeNumber: "TEST-0003",
      email: "superadmin1@test.local",
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
      name: "Super One",
      role: "superadmin",
    });
  });

<<<<<<< HEAD
  test("onboards a new employee with a hashed password and the given role", () => {
    const employee = employeeService.onboardEmployee({
      name: "New Hire",
      username: "newhire",
=======
  test("onboards an employee with a generated ID and hashed password", () => {
    const employee = employeeService.onboardEmployee({
      name: "New Hire",
      email: "newhire@test.local",
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
      password: "password123",
      role: "cashier",
      storeId,
    });
<<<<<<< HEAD

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
=======
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
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
    const updated = employeeService.assignRole({
      employeeId: cashier.id,
      role: "manager",
      requestingAdminId: superAdminId,
    });
    expect(updated.role).toBe("manager");
<<<<<<< HEAD
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
=======
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
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
  });
});
