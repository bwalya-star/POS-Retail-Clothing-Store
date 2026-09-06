const { makeTestDb } = require("./testDb");
const EmployeeRepository = require("../src/repositories/employeeRepository");
const {
  AuthService,
  InvalidCredentialsError,
  AccountDisabledError,
} = require("../src/services/authService");

describe("AuthService (UC1: Login)", () => {
  let authService;

  beforeEach(() => {
    const { db } = makeTestDb();
    authService = new AuthService(new EmployeeRepository(db));
  });

  test("logs in successfully with email credentials", () => {
    const result = authService.login("grace.mulenga@test.local", "cashier123");
    expect(result.role).toBe("cashier");
    expect(typeof result.token).toBe("string");
  });

  test("rejects an unknown email", () => {
    expect(() => authService.login("nobody@example.com", "whatever")).toThrow(InvalidCredentialsError);
  });

  test("rejects an incorrect password", () => {
    expect(() => authService.login("grace.mulenga@test.local", "wrongpassword")).toThrow(InvalidCredentialsError);
  });

  test("locks the account after 5 failed attempts (extension 2a)", () => {
    for (let i = 0; i < 5; i++) {
      expect(() => authService.login("grace.mulenga@test.local", "wrong")).toThrow(InvalidCredentialsError);
    }
    expect(() => authService.login("grace.mulenga@test.local", "cashier123")).toThrow(AccountDisabledError);
  });
});
