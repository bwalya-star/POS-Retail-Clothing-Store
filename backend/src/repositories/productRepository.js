class ProductRepository {
  constructor(db) {
    this.db = db;
  }

  async findVariantBySku(sku) {
    const { rows } = await this.db.query("SELECT * FROM product_variants WHERE sku = ?", [sku]);
    return rows[0];
  }

  async findVariantById(id) {
    const { rows } = await this.db.query("SELECT * FROM product_variants WHERE id = ?", [id]);
    return rows[0];
  }

  async listVariants() {
    const { rows } = await this.db.query(
      `SELECT pv.*, ps.name AS product_name, ps.style_code, ps.description
       FROM product_variants pv
       JOIN product_specifications ps ON ps.id = pv.product_specification_id
       ORDER BY ps.name, pv.size, pv.colour`
    );
    return rows;
  }

  async decrementStock(variantId, quantity) {
    await this.db.query(
      "UPDATE product_variants SET quantity_on_hand = quantity_on_hand - ? WHERE id = ?",
      [quantity, variantId]
    );
  }

  async incrementStock(variantId, quantity) {
    await this.db.query(
      "UPDATE product_variants SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?",
      [quantity, variantId]
    );
  }

  async insertStockAdjustment({ productVariantId, managerId, quantityChanged, reason, timestamp }) {
    const { rows } = await this.db.query(
      `INSERT INTO stock_adjustments (product_variant_id, manager_id, quantity_changed, reason, timestamp)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`,
      [productVariantId, managerId, quantityChanged, reason, timestamp]
    );
    return rows[0].id;
  }

  async findSpecByStyleCode(styleCode) {
    const { rows } = await this.db.query(
      "SELECT * FROM product_specifications WHERE style_code = ?",
      [styleCode]
    );
    return rows[0];
  }

  async insertSpec({ styleCode, name, description, basePrice }) {
    const { rows } = await this.db.query(
      "INSERT INTO product_specifications (style_code, name, description, base_price) VALUES (?, ?, ?, ?) RETURNING id",
      [styleCode, name, description || null, basePrice]
    );
    return rows[0].id;
  }

  async insertVariant({ productSpecificationId, sku, size, colour, unitPrice, quantityOnHand }) {
    const { rows } = await this.db.query(
      `INSERT INTO product_variants
       (product_specification_id, sku, size, colour, unit_price, quantity_on_hand)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id`,
      [productSpecificationId, sku, size, colour, unitPrice, quantityOnHand]
    );
    return rows[0].id;
  }

  async updateVariant(id, { size, colour, unitPrice }) {
    await this.db.query(
      "UPDATE product_variants SET size = ?, colour = ?, unit_price = ? WHERE id = ?",
      [size, colour, unitPrice, id]
    );
  }

  async deleteVariant(id) {
    await this.db.query("DELETE FROM product_variants WHERE id = ?", [id]);
  }

  async hasHistory(variantId) {
    const saleRef = await this.db.query(
      "SELECT 1 FROM sales_line_items WHERE product_variant_id = ? LIMIT 1",
      [variantId]
    );
    if (saleRef.rows.length) return true;
    const adjustmentRef = await this.db.query(
      "SELECT 1 FROM stock_adjustments WHERE product_variant_id = ? LIMIT 1",
      [variantId]
    );
    return adjustmentRef.rows.length > 0;
  }
}

module.exports = ProductRepository;
