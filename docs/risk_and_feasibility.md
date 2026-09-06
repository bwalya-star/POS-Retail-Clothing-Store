# Risk List & Feasibility Study – POS Retail Clothing Store

## Risk List

### Technical Risks

| Risk | Description | Mitigation |
|------|-------------|-----------|
| Poor database design | Slow performance and data inconsistency | Proper normalization and indexing |
| Data loss | Loss of sales or inventory records | Backup strategy and transaction logging |
| Security vulnerabilities | Unauthorized system access | Role-based authentication |

### Operational Risks

| Risk | Description | Mitigation |
|------|-------------|-----------|
| Staff resistance | Users may resist system adoption | User training and gradual rollout |
| Lack of technical skills | Team unfamiliar with tools | Early tool selection and training |

### Schedule Risks

| Risk | Description | Mitigation |
|------|-------------|-----------|
| Underestimated timeline | Project delays | Iterative development and milestone tracking |

---

## Feasibility Study

### Technical Feasibility
- Can be built using common technologies (e.g., Java/C#/Web + SQL database).  
- Required infrastructure is readily available.  

### Economic Feasibility
- Reduced operational errors.  
- Improved profitability through better stock management.  
- Long-term cost savings outweigh development cost.  

### Operational Feasibility
- System is user-friendly.  
- Staff training requirements are minimal.

---

## Updated Risk List – Elaboration Iteration 1

Per the UP's risk-driven principle, the highest-risk item from Inception (architecture) was addressed first.

| Risk | Status | Notes |
|------|--------|-------|
| Poor database design | **Mitigated (in progress)** | [Layered architecture](architecture.md) isolates persistence in a Data Access layer; schema to be validated when Process Sale is implemented as the first spike. |
| Security vulnerabilities | **Mitigated (in progress)** | All role-sensitive use cases route through `AuthService` (see [Architecture](architecture.md)); role hierarchy defined in [Domain Model](domain_model.md). |
| Data loss | **Open** | Backup/transaction-logging strategy not yet designed; deferred to Iteration 2 alongside the refined design class diagrams. |
| Staff resistance | **Open** | Unchanged from Inception; to be revisited during Transition (beta testing/user feedback). |
| Lack of technical skills | **Open** | Tooling for the layered architecture (framework/DB choice) needs to be finalized by the Technical Lead before Construction. |
| Underestimated timeline | **New concern** | Only 3 of 8 use cases (Login, Process Sale, Restock Inventory) were fully detailed this iteration; remaining 5 use cases and the refined design class diagrams are scheduled for Iteration 2 (Weeks 6-8) and must not slip further, or Construction (Weeks 9-12) is put at risk. |
