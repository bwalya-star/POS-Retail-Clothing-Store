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

  test("logs in successfully with valid credentials", () => {
    const result = authService.login("cashier", "cashier123");
    expect(result.role).toBe("cashier");
    expect(typeof result.token).toBe("string");
  });

  test("rejects an unknown username", () => {
    expect(() => authService.login("nobody", "whatever")).toThrow(InvalidCredentialsError);
  });

  test("rejects an incorrect password", () => {
    expect(() => authService.login("cashier", "wrongpassword")).toThrow(InvalidCredentialsError);
  });

  test("locks the account after 5 failed attempts (extension 2a)", () => {
    for (let i = 0; i < 5; i++) {
      expect(() => authService.login("cashier", "wrong")).toThrow(InvalidCredentialsError);
    }
    expect(() => authService.login("cashier", "cashier123")).toThrow(AccountDisabledError);
  });
});
