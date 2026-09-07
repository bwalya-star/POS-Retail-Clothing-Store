# POS Retail Clothing Store API Reference

## Base URL

```text
http://localhost:4000/api
```

---

# Authentication

Protected endpoints require a JWT token.

Send the token using:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

# Health

## Check Server Status

### Endpoint

```http
GET /health
```

### Authentication

Not required.

### Success Response

```json
{
  "status": "ok"
}
```

---

# Authentication Endpoints

## Login

### Endpoint

```http
POST /auth/login
```

### Authentication

Not required.

### Request Body

```json
{
  "email": "employee@example.com",
  "password": "password123"
}
```

### Success Response

```json
{
  "token": "eyJhbGciOi...",
  "role": "cashier",
  "name": "Employee Name",
  "registerId": 1
}
```

### Errors

#### Missing Fields

```http
400 Bad Request
```

```json
{
  "error": "email and password are required."
}
```

#### Invalid Credentials

```http
401 Unauthorized
```

```json
{
  "error": "Invalid email or password."
}
```

#### Disabled Account

```http
403 Forbidden
```

```json
{
  "error": "This account has been disabled."
}
```

---

# Employee Endpoints

## Create Employee

### Endpoint

```http
POST /employees
```

### Roles Allowed

```text
manager
superadmin
```

### Request Body

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "employeeNumber": "EMP-0004",
  "password": "password123",
  "role": "cashier"
}
```

### Success Response

```http
201 Created
```

### Possible Errors

```http
400 Bad Request
409 Conflict
500 Internal Server Error
```

---

## List Employees

### Endpoint

```http
GET /employees
```

### Roles Allowed

```text
manager
superadmin
```

### Success Response

```json
[
  {
    "id": 1,
    "store_id": 1,
    "email": "employee@example.com",
    "employee_number": "EMP-0001",
    "name": "Employee Name",
    "role": "cashier",
    "is_active": 1
  }
]
```

---

## Update Employee Details

### Endpoint

```http
PATCH /employees/:id/details
```

### Roles Allowed

```text
manager
superadmin
```

### Request Body

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

---

## Update Employee Role

### Endpoint

```http
PATCH /employees/:id/role
```

### Roles Allowed

```text
manager
superadmin
```

### Request Body

```json
{
  "role": "manager"
}
```

### Valid Roles

```text
cashier
manager
superadmin
```

### Special Rules

* A Super Admin cannot demote themselves.
* The last active Super Admin cannot be demoted.

---

# Inventory Endpoints

## List Inventory

### Endpoint

```http
GET /inventory
```

### Authentication

Required.

---

## Restock Product

### Endpoint

```http
POST /inventory/restock
```

### Roles Allowed

```text
manager
superadmin
```

### Request Body

```json
{
  "sku": "TSH-001-M-BLK",
  "quantity": 10
}
```

### Rules

* SKU must exist.
* Quantity must be greater than zero.

---

## Create Product

### Endpoint

```http
POST /inventory
```

### Roles Allowed

```text
manager
superadmin
```

### Request Body

```json
{
  "styleCode": "TSH-002",
  "productName": "Premium T-Shirt",
  "description": "Premium cotton clothing",
  "basePrice": 20,
  "sku": "TSH-002-M-BLK",
  "size": "M",
  "colour": "Black",
  "unitPrice": 20,
  "quantityOnHand": 10
}
```

### Rules

* SKU must be unique.
* Unit price must be greater than zero.

---

## Update Product

### Endpoint

```http
PATCH /inventory/:sku
```

### Roles Allowed

```text
manager
superadmin
```

### Request Body

```json
{
  "size": "L",
  "colour": "White",
  "unitPrice": 25
}
```

---

## Delete Product

### Endpoint

```http
DELETE /inventory/:sku
```

### Roles Allowed

```text
manager
superadmin
```

### Rules

A product cannot be deleted if it has:

* Sales history
* Stock adjustment history

---

# Sales Endpoints

## Process Sale

### Endpoint

```http
POST /sales
```

### Roles Allowed

```text
cashier
manager
superadmin
```

### Request Body

```json
{
  "registerId": 1,
  "customerId": null,
  "lineItems": [
    {
      "sku": "TSH-001-M-BLK",
      "quantity": 2
    },
    {
      "sku": "JNS-001-32-BLU",
      "quantity": 1
    }
  ],
  "payment": {
    "amount": 65,
    "method": "cash"
  }
}
```

### Validation

The system validates:

* Sale contains line items
* Products exist
* Stock is sufficient
* Payment is sufficient

### Errors

#### Product Not Found

```http
404 Not Found
```

#### Insufficient Stock

```http
409 Conflict
```

#### Underpayment

```http
400 Bad Request
```

---

# Reports Endpoints

## Sales Summary

### Endpoint

```http
GET /reports/summary
```

### Roles Allowed

```text
manager
superadmin
```

### Query Parameters

| Parameter | Description                |
| --------- | -------------------------- |
| period    | today, week, month, or all |

### Example

```http
GET /reports/summary?period=month
```

### Response

```json
{
  "totalRevenue": 1000,
  "saleCount": 20,
  "averageSaleValue": 50
}
```

---

## Top Selling Products

### Endpoint

```http
GET /reports/top-sellers
```

### Roles Allowed

```text
manager
superadmin
```

### Query Parameters

| Parameter | Description                |
| --------- | -------------------------- |
| period    | today, week, month, all    |
| limit     | Maximum number of products |

### Example

```http
GET /reports/top-sellers?period=month&limit=5
```

### Response

```json
[
  {
    "productVariantId": 1,
    "sku": "TSH-001-M-BLK",
    "productName": "Classic T-Shirt",
    "quantitySold": 25,
    "revenue": 375
  }
]

```
