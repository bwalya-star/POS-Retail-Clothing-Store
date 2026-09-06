# Detailed Use Cases (30%) – POS Retail Clothing Store

**UP Phase:** Elaboration – Iteration 1
**Format:** Fully dressed (per Larman, *Applying UML and Patterns*, 3rd Ed.)

This document expands 3 of the 8 use cases identified in the [High-Level Requirements](high_level_requirements.md) into fully dressed descriptions. These three were chosen because they are the highest-risk, architecturally significant use cases (Risk-Driven principle of the UP): authentication gates every other use case, Process Sale is the core revenue transaction, and Manage Inventory (Restock) exercises the stock model that Process Sale depends on.

---

## UC1: Login

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Cashier, Store Manager, Super Admin
- **Stakeholders and Interests:**
  - *Store Manager:* Wants assurance that only authorized staff can access sales and inventory functions.
  - *Super Admin:* Wants centralized control over accounts and access levels.
  - *Cashier:* Wants quick, reliable access to start serving customers.
- **Preconditions:** User has a valid account provisioned by a Super Admin.
- **Success Guarantee (Postconditions):** User is authenticated and granted a session scoped to their role (Cashier, Store Manager, or Super Admin).

### Main Success Scenario
1. User enters username and password at the login screen.
2. System validates credentials against stored account records.
3. System determines the user's role.
4. System starts a session and displays the home screen appropriate to the user's role.

### Extensions
- **2a. Invalid credentials:**
  1. System displays an error message.
  2. System returns to step 1. After 5 consecutive failed attempts, the account is locked and the Super Admin is notified.
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
  - *Super Admin:* Wants inventory changes attributable to an authenticated, authorized user.
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
- **2a. SKU not found:** Manager is prompted to register a new product variant (style, size, colour, price) before restocking it — see UC5 below.
- **4a. Manager cancels the item:** System discards the pending adjustment for that item and returns to step 2.

---

## UC5: Manage Products (Add / Edit / Remove)

Fulfills the "add/update/delete items" half of the Manage Inventory functional requirement from [High-Level Requirements](high_level_requirements.md) — UC3 above covers the other half (receiving stock for an item that already exists in the catalog).

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Store Manager, Super Admin
- **Stakeholders and Interests:**
  - *Store Manager:* Wants to add new styles/sizes/colours to the catalog and correct prices without engineering help.
  - *Cashier:* Depends on the catalog being accurate so Process Sale (UC2) never sells a discontinued or mispriced item.
  - *Super Admin:* Wants catalog changes attributable to an authenticated, authorized user, same as UC3.
- **Preconditions:** Actor is logged in as Store Manager or Super Admin.
- **Success Guarantee (Postconditions):** The product variant catalog reflects the add/edit/removal; a removed variant cannot subsequently be sold or restocked.

### Main Success Scenario (Add Product Variant)
1. Actor selects "Add Product."
2. Actor enters a style code, product name, and base price (only required if the style code is new), plus the variant's SKU, size, colour, unit price, and initial quantity on hand.
3. System validates the SKU is not already in use.
4. System creates the product specification if the style code is new, then creates the product variant.
5. System confirms creation.

### Alternate Flow A: Edit Product Variant
1. Actor selects an existing product variant.
2. Actor edits size, colour, and/or unit price. (SKU is immutable — a size/colour/style change is a new variant, not an edit, to keep historical sales records unambiguous. Quantity is not edited here — see UC3 for receiving stock.)
3. System validates the new values and saves them.
4. System confirms the update.

### Alternate Flow B: Remove Product Variant
1. Actor selects an existing product variant and requests removal.
2. System checks whether any sale or stock adjustment references this variant.
3. If none exist, system deletes the variant and confirms.
4. If the variant has sales/adjustment history, system rejects the removal (extension 2a) to preserve the audit trail those records depend on.

### Extensions
- **3a (Add).** Duplicate SKU -> System rejects; actor picks a different SKU.
- **3a (Edit).** Unit price ≤ 0 -> System rejects.
- **2a (Remove).** Variant has sales or stock-adjustment history -> System rejects deletion with an explanatory message. (This iteration has no "discontinue without deleting" flag; that's a reasonable follow-up if this extension is hit often in practice.)

---

## UC4: Manage Employees (Onboard / Edit / Assign Role / Remove)

- **Scope:** POS Retail Clothing Store System
- **Level:** User goal
- **Primary Actor:** Super Admin
- **Stakeholders and Interests:**
  - *Super Admin:* Wants a fast, reliable way to bring a new hire into the system with the correct permissions, correct their details or role later, and remove someone who has left.
  - *Store Manager:* Wants new cashiers usable on the register on their first shift.
  - *New Employee:* Wants working credentials from day one.
- **Preconditions:** Actor is logged in as Super Admin (see UC1: Login).
- **Success Guarantee (Postconditions):** The employee record reflects the create/edit/role-change/removal. A newly onboarded employee can immediately log in with their role's permissions; a removed employee can no longer log in.

### Main Success Scenario (Onboard)
1. Super Admin selects "Onboard Employee."
2. Super Admin enters the new employee's name, a unique username, an initial password, and selects a role.
3. System validates the username is not already taken and the role is one of the three valid roles.
4. System hashes the password, creates the employee record, and confirms creation to the Super Admin.
5. Super Admin communicates the initial credentials to the new employee out of band (this system does not email credentials in this iteration).

### Alternate Flow A: Edit Employee Details
1. Super Admin selects an existing employee from the employee list.
2. Super Admin edits the employee's name and/or username.
3. System validates (e.g. username still unique) and saves the changes.
4. System confirms.

### Alternate Flow B: Assign/Change Role
1. Super Admin selects an existing employee from the employee list.
2. Super Admin selects a new role for that employee.
3. System updates the employee's role and confirms.

### Alternate Flow C: Remove Employee
1. Super Admin selects an existing employee and requests removal.
2. System deactivates the employee's account (soft delete — `is_active = 0`, not a hard delete) so their historical sales/stock-adjustment records remain intact and attributable.
3. System confirms; the employee can no longer log in (UC1 extension 2b already handles a disabled account at login).

### Extensions
- **3a (Onboard).** Username already taken -> System rejects the request; Super Admin picks a different username.
- **3b (Onboard).** Invalid role value -> System rejects the request; only `cashier`, `manager`, `superadmin` are accepted.
- **3c (Onboard).** Weak/empty password -> System rejects the request with a minimum-length requirement (suggest: 8+ characters, matching typical course-project security expectations).
- **3a (Edit).** New username already taken by another employee -> System rejects.
- **1a (Assign/Change Role, Remove).** Super Admin targets their own account (self-demotion or self-removal), or the last remaining active Super Admin -> System warns and requires confirmation, since it can strand the store with no Super Admin. Deciding the exact safeguard is an open design question for whoever implements this (see the design note below).

### Design Note for Implementer
This use case's design should also serve as the specification for the role-based access control already enforced (by convention) across UC1-UC3 — i.e., implementing this is a good forcing function to double check every existing route's `requireRole(...)` list against [Domain Model](domain_model.md)'s "Super Admin has access to all roles" rule.

---

## Remaining Use Cases (70%)

UC4 and UC5 above are now detailed. The remaining 3 use cases from the high-level requirements — **View Stock Levels, Generate Sales Reports, and Register Customer** — are still deferred to later Elaboration/Construction iterations.
