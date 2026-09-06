# POS – Retail Clothing Store

**About This Project**  
**POS-Retail-Clothing-Store** is a **Point of Sale system for a clothing store**.  
It is designed to streamline retail operations including sales, inventory management, reporting, and employee management. The system is user-friendly, efficient, and scalable, aiming to improve operational efficiency and reduce errors in daily retail activities.

---

## Table of Contents

### Inception
- [Inception Report](docs/inception_report.md)  
- [Problem Statement](docs/problem_statement.md)  
- [Risk And Feasibility Study](docs/risk_and_feasibility.md)   
- [High Level Requirements](docs/high_level_requirements.md)   

### Elaboration – Iteration 1
- [Detailed Use Cases (30%)](docs/detailed_use_cases.md)
- [System Sequence Diagrams](docs/system_sequence_diagrams.md)
- [Domain Model](docs/domain_model.md)
- [Architectural Proof-of-Concept](docs/architecture.md)

---

## Getting Started (Construction Iteration 1)

Implements Login, Process Sale, and Restock Inventory (UC1-UC3) end-to-end: Node/Express + `node:sqlite` backend, React (Vite) frontend.

```bash
# Backend
cd backend
npm install
npm run seed   # creates demo store, employees, and product variants
npm run dev    # starts API on http://localhost:4000
npm test       # runs the Jest unit test suite

# Frontend (separate terminal)
cd frontend
npm install
npm run dev    # starts the app, printed URL (e.g. http://localhost:5173)
```

Demo accounts (created by `npm run seed`): `cashier/cashier123`, `manager/manager123`, `superadmin/superadmin123`.

Requires Node.js >= 22.5 (uses the built-in `node:sqlite` module, no native build step needed).

---

## Credits

**Team Members and Roles:**  
- **Bwalya Mwansa** – Technical Lead  
- **Moses Kaluba** – Documentation Lead  
- **Martin** – Quality Assurance  
- **Bwanga Nyirenda** – Presenter  
- **Rooney** – Coordinator
