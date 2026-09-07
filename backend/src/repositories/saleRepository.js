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
    const sale = this.db
      .prepare("SELECT * FROM sales WHERE id = ?")
      .get(saleId);

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
      .prepare(
        "SELECT * FROM payments WHERE sale_id = ?"
      )
      .get(saleId);

    return { ...sale, lineItems, payment };
  }


  // UC6: Generate Sales Reports

  getRevenueSummary({ from, to }) {
    const result = this.db
      .prepare(
        `SELECT
           COALESCE(SUM(total_amount), 0) AS totalRevenue,
           COUNT(*) AS saleCount
         FROM sales
         WHERE date_time BETWEEN ? AND ?`
      )
      .get(from, to);

    return result;
  }


  listSales({ from, to, cashierId }) {
    const params = [from, to];
    let cashierFilter = "";
    if (cashierId) {
      cashierFilter = "AND s.cashier_id = ?";
      params.push(cashierId);
    }

    return this.db
      .prepare(
        `SELECT
           s.id,
           s.date_time,
           s.total_amount,
           s.register_id,
           s.cashier_id,
           e.name AS cashierName,
           p.method AS paymentMethod,
           (SELECT COUNT(*) FROM sales_line_items sli WHERE sli.sale_id = s.id) AS itemCount

         FROM sales s
         JOIN employees e ON e.id = s.cashier_id
         LEFT JOIN payments p ON p.sale_id = s.id

         WHERE s.date_time BETWEEN ? AND ?
         ${cashierFilter}

         ORDER BY s.date_time DESC`
      )
      .all(...params);
  }

  getTopSellingProducts({ from, to, limit }) {
    return this.db
      .prepare(
        `SELECT
           pv.id AS productVariantId,
           pv.sku AS sku,
           ps.name AS productName,
           SUM(sli.quantity) AS quantitySold,
           SUM(sli.subtotal) AS revenue

         FROM sales_line_items sli

         JOIN sales s
           ON s.id = sli.sale_id

         JOIN product_variants pv
           ON pv.id = sli.product_variant_id

         JOIN product_specifications ps
           ON ps.id = pv.product_specification_id

         WHERE s.date_time BETWEEN ? AND ?

         GROUP BY
           pv.id,
           pv.sku,
           ps.name

         ORDER BY
           quantitySold DESC,
           revenue DESC

         LIMIT ?`
      )
      .all(from, to, limit);
  }
}

module.exports = SaleRepository;
