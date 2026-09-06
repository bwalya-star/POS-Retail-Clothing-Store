# Detailed Use Cases (30%) – POS Retail Clothing Store

**UP Phase:** Elaboration – Iteration 1
**Format:** Fully dressed (per Larman, *Applying UML and Patterns*, 3rd Ed.)

This document expands 3 of the 8 use cases identified in the [High-Level Requirements](high_level_requirements.md) into fully dressed descriptions. These three were chosen because they are the highest-risk, architecturally significant use cases (Risk-Driven principle of the UP): authentication gates every other use case, Process Sale is the core revenue transaction, and Manage Inventory (Restock) exercises the stock model that Process Sale depends on.

---

## UC1: Login

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Cashier, Store Manager, System Administrator
- **Stakeholders and Interests:**
  - *Store Manager:* Wants assurance that only authorized staff can access sales and inventory functions.
  - *System Administrator:* Wants centralized control over accounts and access levels.
  - *Cashier:* Wants quick, reliable access to start serving customers.
- **Preconditions:** User has a valid account provisioned by a System Administrator.
- **Success Guarantee (Postconditions):** User is authenticated and granted a session scoped to their role (Cashier, Manager, Administrator).

### Main Success Scenario
1. User enters username and password at the login screen.
2. System validates credentials against stored account records.
3. System determines the user's role.
4. System starts a session and displays the home screen appropriate to the user's role.

### Extensions
- **2a. Invalid credentials:**
  1. System displays an error message.
  2. System returns to step 1. After 5 consecutive failed attempts, the account is locked and the System Administrator is notified.
- **2b. Account disabled/locked:**
  1. System displays an "account disabled" message and denies access.

---

## UC2: Process Sale

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Sales Assistant (Cashier)
- **Stakeholders and Interests:**
  - *Cashier:* Wants a fast, accurate, low-effort way to complete a transaction.
  - *Store Manager:* Wants accurate sales records and automatic inventory updates.
  - *Customer:* Wants a fast, correct checkout with a receipt.
- **Preconditions:** Cashier is logged in; register is open.
- **Success Guarantee (Postconditions):** Sale is recorded, inventory quantities for each sold variant are decremented, payment is recorded, and a receipt is generated.

### Main Success Scenario
1. Cashier starts a new sale.
2. Cashier enters/scans an item identifier (SKU) and quantity for each item the customer is purchasing (size and colour are part of the SKU).
3. System retrieves the item's description, price, and current stock level, and adds a line item to the sale, displaying the running total.
4. Cashier repeats step 2–3 for each item.
5. Cashier signals end of sale.
6. System calculates and displays the total, including applicable tax.
7. Cashier enters the payment amount/method.
8. System validates payment, records the sale and payment, decrements stock for each line item, and generates a receipt.
9. System presents the receipt to the Cashier for the customer.

### Extensions
- **3a. Item SKU not found:** System notifies Cashier; Cashier re-enters or removes the item.
- **3b. Insufficient stock for requested quantity:** System warns Cashier of available quantity; Cashier adjusts quantity or removes the item.
- **7a. Cash tendered is less than total:** System rejects payment and requests a corrected amount.
- **7b. Card/mobile payment declined:** System notifies Cashier; Cashier requests an alternate payment method.
- **8a. System failure during commit:** Sale is rolled back entirely (no partial stock decrement, no partial payment record); Cashier is notified to retry.

### Special Requirements
- Line-item entry and running-total feedback should complete in under 1 second to keep checkout fast (informs the architecture's layering and data-access design).

---

## UC3: Manage Inventory – Restock Item

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Store Manager
- **Stakeholders and Interests:**
  - *Store Manager:* Wants stock counts to reflect newly received merchandise accurately.
  - *System Administrator:* Wants inventory changes attributable to an authenticated, authorized user.
  - *Cashier:* Depends on accurate stock levels to avoid overselling.
- **Preconditions:** Manager is logged in.
- **Success Guarantee (Postconditions):** Stock quantity for each restocked product variant (style + size + colour) is increased and a stock-adjustment record is created.

### Main Success Scenario
1. Manager selects "Restock Inventory."
2. Manager enters/scans a product variant SKU and the quantity received.
3. System displays the product's current stock level.
4. Manager confirms the quantity to add.
5. System updates the stock level and logs a stock-adjustment record (item, quantity, manager, timestamp).
6. Manager repeats steps 2–5 for each received item.
7. Manager closes the restock session; system displays a summary of items adjusted.

### Extensions
- **2a. SKU not found:** Manager is prompted to register a new product variant (style, size, colour, price) before restocking it.
- **4a. Manager cancels the item:** System discards the pending adjustment for that item and returns to step 2.

---

## Remaining Use Cases (70%)

The remaining 5 use cases from the high-level requirements — **View Stock Levels, Generate Sales Reports, Manage Employees, Register Customer, Manage Users** — are deferred to Elaboration Iteration 2, per the course's iteration plan.
