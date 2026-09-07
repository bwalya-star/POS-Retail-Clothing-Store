class SaleRepository {
  constructor(db) {
    this.db = db;
  }

  async insertSale({ registerId, cashierId, customerId, dateTime, totalAmount }) {
    const { rows } = await this.db.query(
      `INSERT INTO sales (register_id, cashier_id, customer_id, date_time, total_amount)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`,
      [registerId, cashierId, customerId || null, dateTime, totalAmount]
    );
    return rows[0].id;
  }

  async insertLineItem({ saleId, productVariantId, quantity, subtotal }) {
    await this.db.query(
      `INSERT INTO sales_line_items (sale_id, product_variant_id, quantity, subtotal)
       VALUES (?, ?, ?, ?)`,
      [saleId, productVariantId, quantity, subtotal]
    );
  }

  async insertPayment({ saleId, amount, method, changeDue }) {
    await this.db.query(
      `INSERT INTO payments (sale_id, amount, method, change_due)
       VALUES (?, ?, ?, ?)`,
      [saleId, amount, method, changeDue]
    );
  }

  async findSaleWithDetails(saleId) {
    const { rows: saleRows } = await this.db.query("SELECT * FROM sales WHERE id = ?", [saleId]);
    const sale = saleRows[0];
    if (!sale) return null;

    const { rows: lineItems } = await this.db.query(
      `SELECT sli.*, pv.sku, pv.size, pv.colour
       FROM sales_line_items sli
       JOIN product_variants pv ON pv.id = sli.product_variant_id
       WHERE sli.sale_id = ?`,
      [saleId]
    );

    const { rows: paymentRows } = await this.db.query(
      "SELECT * FROM payments WHERE sale_id = ?",
      [saleId]
    );

    return { ...sale, lineItems, payment: paymentRows[0] };
  }

  // UC6: Generate Sales Reports

  async getRevenueSummary({ from, to }) {
    const { rows } = await this.db.query(
      `SELECT
         COALESCE(SUM(total_amount), 0) AS "totalRevenue",
         COUNT(*) AS "saleCount"
       FROM sales
       WHERE date_time BETWEEN ? AND ?`,
      [from, to]
    );
    return rows[0];
  }

  async listSales({ from, to, cashierId }) {
    const params = [from, to];
    let cashierFilter = "";
    if (cashierId) {
      cashierFilter = "AND s.cashier_id = ?";
      params.push(cashierId);
    }

    const { rows } = await this.db.query(
      `SELECT
         s.id,
         s.date_time,
         s.total_amount,
         s.register_id,
         s.cashier_id,
         e.name AS "cashierName",
         p.method AS "paymentMethod",
         (SELECT COUNT(*) FROM sales_line_items sli WHERE sli.sale_id = s.id) AS "itemCount"

       FROM sales s
       JOIN employees e ON e.id = s.cashier_id
       LEFT JOIN payments p ON p.sale_id = s.id

       WHERE s.date_time BETWEEN ? AND ?
       ${cashierFilter}

       ORDER BY s.date_time DESC`,
      params
    );
    return rows;
  }

  async getTopSellingProducts({ from, to, limit }) {
    const { rows } = await this.db.query(
      `SELECT
         pv.id AS "productVariantId",
         pv.sku AS sku,
         ps.name AS "productName",
         SUM(sli.quantity) AS "quantitySold",
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
         "quantitySold" DESC,
         revenue DESC

       LIMIT ?`,
      [from, to, limit]
    );
    return rows;
  }
}

module.exports = SaleRepository;
