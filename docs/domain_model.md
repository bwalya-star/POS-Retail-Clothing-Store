# Domain Model – POS Retail Clothing Store

**UP Phase:** Elaboration – Iteration 1

Per Larman, the Domain Model is a visualization of **conceptual classes** in the problem domain — it contains no operations/methods and is not a software design. Classes below were identified by noun-phrase analysis of the [Problem Statement](problem_statement.md) and the [Detailed Use Cases](detailed_use_cases.md).

## Conceptual Class Diagram

```mermaid
classDiagram
    class Store {
        name
        address
    }
    class Register {
        registerID
    }
    class Employee {
        employeeID
        name
        role
    }
    class Cashier
    class StoreManager
    class SuperAdmin {
        <<has access to all roles>>
    }
    class Sale {
        dateTime
        totalAmount
    }
    class SalesLineItem {
        quantity
        subtotal
    }
    class ProductSpecification {
        styleCode
        name
        basePrice
    }
    class ProductVariant {
        sku
        size
        colour
        unitPrice
        quantityOnHand
    }
    class Payment {
        amount
        method
    }
    class Customer {
        customerID
        name
        contactInfo
    }
    class StockAdjustment {
        quantityChanged
        timestamp
        reason
    }
    class SalesReport {
        periodStart
        periodEnd
    }

    Employee <|-- Cashier
    Employee <|-- StoreManager
    Employee <|-- SuperAdmin

    Store "1" -- "1..*" Register : has
    Store "1" -- "1..*" Employee : employs
    Register "1" -- "0..*" Sale : records
    Cashier "1" -- "0..*" Sale : handles
    Sale "0..1" -- "0..1" Customer : for
    Sale "1" -- "1..*" SalesLineItem : contains
    SalesLineItem "*" -- "1" ProductVariant : describes
    ProductVariant "*" -- "1" ProductSpecification : variant-of
    Sale "1" -- "1" Payment : paid-by
    StoreManager "1" -- "0..*" StockAdjustment : authorizes
    StockAdjustment "*" -- "1" ProductVariant : adjusts
    Sale "0..*" --> "1" SalesReport : aggregated-in
    SuperAdmin "1" -- "0..*" Employee : onboards & assigns role to
```

## Notes on Key Conceptual Classes

- **ProductSpecification vs. ProductVariant** — Larman's original POS model has a single `ProductSpecification`. A clothing store needs the extra `ProductVariant` layer because stock, price, and SKU are tracked per *size + colour* combination of a style, not per style alone.
- **Sale / SalesLineItem / Payment** — kept identical in spirit to Larman's canonical POS domain model; this is the same transaction pattern (Sale is a whole, SalesLineItems are its parts, Payment closes it).
- **StockAdjustment** — new concept (not in Larman's original) needed to support the Restock and future Returns use cases, and to provide an audit trail for inventory changes.
- **Employee generalization** — `Cashier`, `StoreManager`, `SuperAdmin` share identity/role attributes but have different permissions, motivating a role hierarchy rather than a single flat `User` class.
- **SuperAdmin** — a single, most-privileged role with access to every capability of every other role (Cashier and StoreManager included), and the *sole* actor responsible for onboarding new employees and assigning their role. This centralizes account provisioning, which is a deliberate trade-off: simpler access control at the cost of a single point of failure (see the updated Risk List in [Risk and Feasibility](risk_and_feasibility.md)).

This model will be refined into a **Design Class Diagram** (with methods, visibility, and navigability) in Elaboration Iteration 2, once responsibilities are assigned via GRASP patterns against the SSDs above.
