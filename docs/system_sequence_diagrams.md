# System Sequence Diagrams (SSDs) – POS Retail Clothing Store

**UP Phase:** Elaboration – Iteration 1

Per Larman, a System Sequence Diagram treats the whole system as a single black-box object and shows the actor's calls to it and the system's return values for the main success scenario of each use case in [Detailed Use Cases](detailed_use_cases.md). No internal objects appear here — that comes later in the Design Class Diagrams.

---

## SSD1: Login

```mermaid
sequenceDiagram
    actor U as User
    participant S as System

    U->>S: login(username, password)
    S-->>U: authenticationResult(role, sessionToken)
```

---

## SSD2: Process Sale

```mermaid
sequenceDiagram
    actor C as Cashier
    participant S as System

    C->>S: makeNewSale()
    loop for each item
        C->>S: enterItem(sku, quantity)
        S-->>C: itemDescription, price, runningTotal
    end
    C->>S: endSale()
    S-->>C: total(withTax)
    C->>S: enterPayment(amount, method)
    S-->>C: paymentResult(changeDue)
    S-->>C: receipt()
```

---

## SSD3: Manage Inventory – Restock Item

```mermaid
sequenceDiagram
    actor M as Store Manager
    participant S as System

    M->>S: startRestock()
    loop for each received item
        M->>S: enterRestockItem(sku, quantity)
        S-->>M: currentStockLevel
        M->>S: confirmRestock(sku, quantity)
        S-->>M: updatedStockLevel
    end
    M->>S: closeRestock()
    S-->>M: restockSummary()
```

---

These three SSDs correspond one-to-one with the fully dressed use cases (UC1–UC3) documented for this iteration. SSDs for the remaining use cases will be produced in Elaboration Iteration 2 alongside their detailed use case descriptions.
