# Detailed Use Cases (100% Complete) – POS Retail Clothing Store

**UP Phase:** Elaboration Phase  
**Format:** Fully dressed (per Larman, *Applying UML and Patterns*, 3rd Ed.)

This document contains fully dressed descriptions for all 8 use cases identified in [High-Level Requirements](high_level_requirements.md).

---

## UC1: Login

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Cashier, Store Manager, Super Admin
- **Stakeholders and Interests:**
  - *Store Manager:* Wants assurance that only authorized staff access store management tools.
  - *Super Admin:* Wants centralized control over account provisioning and security auditing.
  - *Cashier:* Wants fast, seamless login access to open the register terminal.
- **Preconditions:** User has an active employee account with valid credentials provisioned by a Super Admin.
- **Success Guarantee (Postconditions):** User is authenticated, issued a session token, and directed to their role-authorized dashboard.

### Main Success Scenario
1. User enters username and password at the login screen.
2. System validates credentials against stored employee accounts.
3. System determines the user's role (`cashier`, `manager`, `superadmin`).
4. System creates an authenticated session token and loads the role-appropriate UI dashboard.

### Extensions
- **2a. Invalid credentials:**
  1. System displays an "Invalid username or password" error.
  2. System increments failed login attempt counter.
  3. After 5 consecutive failed attempts, system locks account and notifies Super Admin.
- **2b. Account disabled:**
  1. System detects `is_active = 0` status, denies access, and displays "Account disabled. Contact administrator."

---

## UC2: Process Sale

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Cashier
- **Stakeholders and Interests:**
  - *Cashier:* Wants fast, error-free transaction checkout with minimal manual input.
  - *Store Manager:* Wants exact stock deduction and accurate financial logging per transaction.
  - *Customer:* Wants fast checkout, accurate receipt, and correct change.
- **Preconditions:** Cashier is logged in; sales register is active.
- **Success Guarantee (Postconditions):** Sale record created, line items saved, inventory quantities decremented per SKU, payment recorded, customer assigned (optional), and receipt generated.

### Main Success Scenario
1. Cashier initiates a new sale.
2. Cashier enters/scans a product variant SKU and quantity.
3. System validates SKU, checks stock availability, retrieves unit price and variant details (size, color, style name), calculates line subtotal, and appends to sale summary.
4. Cashier repeats steps 2–3 for each item.
5. (Optional) Cashier attaches customer record (see UC6).
6. Cashier signals completion of item entry.
7. System calculates grand total including sales tax.
8. Cashier enters payment method (Cash/Card) and tendered amount.
9. System validates payment, records transaction atomically, decrements stock quantity for each line item SKU, calculates change due, and issues receipt.

### Extensions
- **3a. SKU not found:** System alerts Cashier; Cashier re-enters or verifies barcode.
- **3b. Insufficient stock:** System notifies Cashier of max available stock; Cashier adjusts quantity or removes item.
- **8a. Tendered cash less than total:** System rejects payment submission; requests sufficient cash.
- **9a. Database commit failure:** System rolls back entire transaction; alerts Cashier to retry.

---

## UC3: Restock Inventory

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Store Manager
- **Stakeholders and Interests:**
  - *Store Manager:* Wants stock counts to accurately reflect newly received shipments.
  - *Cashier:* Depends on accurate stock levels to avoid overselling items.
- **Preconditions:** Manager is logged in as Store Manager or Super Admin.
- **Success Guarantee (Postconditions):** Quantity on hand for each variant SKU is updated and a audit stock adjustment record is logged.

### Main Success Scenario
1. Manager selects "Restock Inventory."
2. Manager enters/scans product variant SKU and received quantity.
3. System displays current stock level, product details, and calculated new total stock.
4. Manager confirms restock entry.
5. System updates quantity on hand in database and creates a `StockAdjustment` audit record.
6. Manager repeats steps 2–5 for received items and closes session.

### Extensions
- **2a. SKU does not exist:** System prompts Manager to create new product variant first (UC5).
- **4a. Manager cancels item:** System discards pending adjustment and returns to step 2.

---

## UC4: Manage Employees

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Super Admin
- **Stakeholders and Interests:**
  - *Super Admin:* Wants to onboard new staff, edit account info, reassign roles, and disable former staff.
  - *Store Manager & Cashiers:* Require active credentials to perform daily work.
- **Preconditions:** User is logged in with `superadmin` role.
- **Success Guarantee (Postconditions):** Employee account created, updated, or soft-deleted (`is_active = 0`).

### Main Success Scenario (Onboard Employee)
1. Super Admin navigates to Employee Management and selects "Onboard New Employee."
2. Super Admin provides employee name, unique username, password, and selects role (`cashier`, `manager`, `superadmin`).
3. System verifies username uniqueness and password strength requirements.
4. System securely hashes password (bcrypt), saves employee record, and confirms creation.

### Alternate Flows
- **Edit Employee Details:** Admin modifies employee name or username; system validates and updates.
- **Reassign Role:** Admin selects new role for employee; system updates access permissions immediately.
- **Disable Employee:** Admin deactivates employee; system sets `is_active = 0` so user can no longer log in.

### Extensions
- **3a. Username already taken:** System rejects creation and prompts for unique username.
- **3b. Self-deactivation attempt:** System blocks Super Admin from deactivating their own active account.

---

## UC5: Manage Products (Add / Edit / Remove)

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Store Manager, Super Admin
- **Stakeholders and Interests:**
  - *Store Manager:* Wants full control to add new seasonal clothing lines and update prices.
- **Preconditions:** Manager or Super Admin is logged in.
- **Success Guarantee (Postconditions):** Product specification and variant records created, modified, or removed.

### Main Success Scenario (Add Variant)
1. User selects "Add Product Variant."
2. User enters style code, product name, base price, variant SKU, size, color, unit price, and initial stock.
3. System validates SKU uniqueness.
4. System creates product specification (if new) and variant record.
5. System displays success confirmation.

### Alternate Flows
- **Edit Variant Price/Details:** User updates unit price, size, or color; system updates catalog.
- **Delete Variant:** User requests variant removal; system verifies no sales history exists for variant before deletion.

---

## UC6: Register Customer

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Cashier, Store Manager
- **Stakeholders and Interests:**
  - *Customer:* Wants store membership benefits and receipt tracking.
  - *Store Manager:* Wants customer demographics to analyze sales trends.
- **Preconditions:** Cashier or Manager is logged in.
- **Success Guarantee (Postconditions):** New customer profile saved with customer ID, name, email, and phone.

### Main Success Scenario
1. User opens Customer Registration form.
2. User enters customer name, phone number, and email address.
3. System checks for existing customer record by phone/email.
4. System creates customer record and returns customer ID for immediate attachment to sale.

### Extensions
- **3a. Duplicate customer found:** System alerts user and displays existing profile for selection.

---

## UC7: View Stock Levels

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Store Manager, Super Admin, Cashier
- **Stakeholders and Interests:**
  - *Store Manager:* Wants real-time inventory visibility and low-stock alerts.
- **Preconditions:** User is authenticated.
- **Success Guarantee (Postconditions):** Current stock levels, low-stock indicators, and product variant specs displayed.

### Main Success Scenario
1. User accesses Inventory / Stock Levels view.
2. User filters stock by category, style name, size, color, or low-stock threshold.
3. System retrieves real-time stock levels and highlights items below threshold (e.g. quantity < 5).

---

## UC8: Generate Sales Reports

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Store Manager, Super Admin
- **Stakeholders and Interests:**
  - *Store Manager:* Wants accurate revenue reports, transaction totals, and top-selling item metrics.
- **Preconditions:** User is logged in as Store Manager or Super Admin.
- **Success Guarantee (Postconditions):** Aggregated sales report generated for specified date range.

### Main Success Scenario
1. User selects "Sales Reports."
2. User selects date range (Daily, Weekly, Monthly, or Custom Range).
3. System aggregates transaction count, total sales revenue, average transaction value, and top product variants sold.
4. System renders summary charts and detailed transaction breakdown table.
