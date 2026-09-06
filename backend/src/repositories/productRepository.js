class ProductRepository {
  constructor(db) {
    this.db = db;
  }

  findVariantBySku(sku) {
    return this.db
      .prepare("SELECT * FROM product_variants WHERE sku = ?")
      .get(sku);
  }

  findVariantById(id) {
    return this.db
      .prepare("SELECT * FROM product_variants WHERE id = ?")
      .get(id);
  }

  listVariants() {
    return this.db
      .prepare(
        `SELECT pv.*, ps.name AS product_name, ps.style_code
         FROM product_variants pv
         JOIN product_specifications ps ON ps.id = pv.product_specification_id
         ORDER BY ps.name, pv.size, pv.colour`
      )
      .all();
  }

  decrementStock(variantId, quantity) {
    this.db
      .prepare(
        "UPDATE product_variants SET quantity_on_hand = quantity_on_hand - ? WHERE id = ?"
      )
      .run(quantity, variantId);
  }

  incrementStock(variantId, quantity) {
    this.db
      .prepare(
        "UPDATE product_variants SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?"
      )
      .run(quantity, variantId);
  }

  insertStockAdjustment({ productVariantId, managerId, quantityChanged, reason, timestamp }) {
    const result = this.db
      .prepare(
        `INSERT INTO stock_adjustments (product_variant_id, manager_id, quantity_changed, reason, timestamp)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(productVariantId, managerId, quantityChanged, reason, timestamp);
    return result.lastInsertRowid;
  }
}

module.exports = ProductRepository;
