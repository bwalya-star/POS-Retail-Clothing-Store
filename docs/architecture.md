# Architectural Proof-of-Concept & Baseline – POS Retail Clothing Store

**UP Phase:** Elaboration Phase  
**Milestone:** Lifecycle Architecture Baseline (LCA)

---

## 1. Architectural Overview & 3-Tier Layering

The system follows a strict **3-Tier Layered Architecture** separating **Presentation**, **Domain / Application**, and **Data Access** concerns. This design directly mitigates high-priority technical risks: poor database performance, security breaches, and untestable business logic.

```mermaid
flowchart TB
    subgraph Presentation["Presentation Layer (React + Vite)"]
        UI1["POS Terminal Page (`POSTerminalPage.jsx`)"]
        UI2["Inventory Page (`InventoryPage.jsx`)"]
        UI3["Employees Page (`EmployeesPage.jsx`)"]
        UI4["Reports Page (`ManagerPage.jsx`)"]
        UI5["Login Page (`LoginPage.jsx`)"]
    end

    subgraph API_Routes["API Routing & Security Middleware"]
        R1["`/api/sales`"]
        R2["`/api/inventory`"]
        R3["`/api/employees`"]
        R4["`/api/reports`"]
        R5["`/api/auth`"]
        MW["Auth & Role Middleware (`requireAuth`, `requireRole`)"]
    end

    subgraph Domain["Domain / Application Layer (Node.js Services)"]
        SaleSvc["`SaleService`"]
        InvSvc["`InventoryService`"]
        RptSvc["`SalesReportService`"]
        AuthSvc["`AuthService`"]
        EmpSvc["`EmployeeService`"]
    end

    subgraph DataAccess["Data Access Layer (Repositories & SQLite)"]
        SaleRepo["`SaleRepository`"]
        ProductRepo["`ProductRepository`"]
        EmpRepo["`EmployeeRepository`"]
        DB[(SQLite Database - `pos.sqlite3`)]
    end

    UI1 --> R1
    UI2 --> R2
    UI3 --> R3
    UI4 --> R4
    UI5 --> R5

    R1 --> MW --> SaleSvc
    R2 --> MW --> InvSvc
    R3 --> MW --> EmpSvc
    R4 --> MW --> RptSvc
    R5 --> AuthSvc

    SaleSvc --> SaleRepo
    SaleSvc --> ProductRepo
    InvSvc --> ProductRepo
    EmpSvc --> EmpRepo
    AuthSvc --> EmpRepo
    RptSvc --> SaleRepo

    SaleRepo --> DB
    ProductRepo --> DB
    EmpRepo --> DB
```

---

## 2. Layer Responsibilities & Design Rules

| Layer | Component Scope | Design Rules & Responsibilities |
|---|---|---|
| **Presentation** | React components (`src/pages`, `src/context`) | Handles UI rendering, user interaction, client state (`AuthContext`, `ThemeContext`), and calls HTTP client API endpoints. Contains zero business logic or SQL statements. |
| **API / Middleware** | Express routes & middleware (`backend/src/routes`, `middleware`) | Intercepts HTTP requests, validates request payloads, executes `requireRole(...)` authentication/authorization middleware, and forwards calls to application services. |
| **Domain / Application** | Services (`backend/src/services`) | Implements core use-case logic (`processSale`, `restockItem`, `authenticate`, `onboardEmployee`, `generateReport`). Orchestrates business transaction boundaries and rule enforcement. |
| **Data Access** | Repositories (`backend/src/repositories`) | Encapsulates database persistence operations (`node:sqlite`). Translates raw SQL rows into domain structures. Isolates SQL queries from services. |
| **Persistence Layer** | Relational Database (`backend/data/pos.sqlite3`) | Stores normalized relational tables: `employees`, `product_specifications`, `product_variants`, `sales`, `sales_line_items`, `payments`, `customers`, and `stock_adjustments`. |

---

## 3. Comprehensive REST API Endpoints Specification

| Method | Endpoint Path | Target Service | Allowed Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | `AuthService` | Public | Authenticate employee credentials; returns session token & role |
| `POST` | `/api/sales` | `SaleService` | `cashier`, `manager`, `superadmin` | Process and record a completed sale atomically |
| `GET` | `/api/inventory` | `InventoryService` | All Roles | Fetch list of product variants, prices, and quantities on hand |
| `POST` | `/api/inventory/restock` | `InventoryService` | `manager`, `superadmin` | Adjust stock quantity received and record audit log |
| `POST` | `/api/inventory/products` | `InventoryService` | `manager`, `superadmin` | Add new product variant (style, SKU, size, color, price) |
| `GET` | `/api/employees` | `EmployeeService` | `superadmin` | Retrieve complete list of store employees |
| `POST` | `/api/employees` | `EmployeeService` | `superadmin` | Onboard new employee with role credentials |
| `PATCH` | `/api/employees/:id/role` | `EmployeeService` | `superadmin` | Change role assignment for existing employee |
| `DELETE` | `/api/employees/:id` | `EmployeeService` | `superadmin` | Soft delete employee account (`is_active = 0`) |
| `GET` | `/api/reports/sales` | `SalesReportService` | `manager`, `superadmin` | Generate aggregated sales analytics and summary totals |

---

## 4. Architectural Proof-of-Concept Spike Verification

The architectural proof-of-concept verified that:
1. **Vertical Integration:** A request initiated from `POSTerminalPage` accurately hits `/api/sales`, passes `requireAuth` middleware, triggers `saleService.processSale()`, executes SQL transactions via `saleRepository`, and updates `productRepository` stock levels atomically.
2. **Security Isolation:** Route middleware rejects requests lacking valid authorization headers or targeting endpoints above the user's role privilege.
3. **Testability:** Unit tests (`saleService.test.js`, `authService.test.js`, `inventoryService.test.js`, `employeeService.test.js`) verify domain services using isolated mock repositories without requiring live UI interaction.
