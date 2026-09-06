class SaleRepository {
  constructor(db) {
    this.db = db;
  }

  insertSale({ registerId, cashierId, customerId, dateTime, totalAmount }) {
    const result = this.db
      .prepare(
        `INSERT INTO sales (register_id, cashier_id, customer_id, date_time, total_amount)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(registerId, cashierId, customerId || null, dateTime, totalAmount);
    return result.lastInsertRowid;
  }

  insertLineItem({ saleId, productVariantId, quantity, subtotal }) {
    this.db
      .prepare(
        `INSERT INTO sales_line_items (sale_id, product_variant_id, quantity, subtotal)
         VALUES (?, ?, ?, ?)`
      )
      .run(saleId, productVariantId, quantity, subtotal);
  }

  insertPayment({ saleId, amount, method, changeDue }) {
    this.db
      .prepare(
        `INSERT INTO payments (sale_id, amount, method, change_due)
         VALUES (?, ?, ?, ?)`
      )
      .run(saleId, amount, method, changeDue);
  }

  findSaleWithDetails(saleId) {
    const sale = this.db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId);
    if (!sale) return null;
    const lineItems = this.db
      .prepare(
        `SELECT sli.*, pv.sku, pv.size, pv.colour
         FROM sales_line_items sli
         JOIN product_variants pv ON pv.id = sli.product_variant_id
         WHERE sli.sale_id = ?`
      )
      .all(saleId);
    const payment = this.db
      .prepare("SELECT * FROM payments WHERE sale_id = ?")
      .get(saleId);
    return { ...sale, lineItems, payment };
  }
}

module.exports = SaleRepository;
