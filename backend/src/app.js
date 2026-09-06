const express = require("express");
const cors = require("cors");

const EmployeeRepository = require("./repositories/employeeRepository");
const ProductRepository = require("./repositories/productRepository");
const SaleRepository = require("./repositories/saleRepository");

const { AuthService } = require("./services/authService");
const { EmployeeService } = require("./services/employeeService");
const { SaleService } = require("./services/saleService");
const { InventoryService } = require("./services/inventoryService");

const buildAuthRouter = require("./routes/auth.routes");
const buildEmployeesRouter = require("./routes/employees.routes");
const buildSalesRouter = require("./routes/sales.routes");
const buildInventoryRouter = require("./routes/inventory.routes");

function createApp(db) {
  const employeeRepository = new EmployeeRepository(db);
  const productRepository = new ProductRepository(db);
  const saleRepository = new SaleRepository(db);

  const authService = new AuthService(employeeRepository);
  const employeeService = new EmployeeService(employeeRepository);
  const saleService = new SaleService(db, saleRepository, productRepository);
  const inventoryService = new InventoryService(productRepository);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", buildAuthRouter(authService));
  app.use("/api/employees", buildEmployeesRouter(employeeService));
  app.use("/api/sales", buildSalesRouter(saleService));
  app.use("/api/inventory", buildInventoryRouter(inventoryService, productRepository));

  return app;
}

module.exports = createApp;
