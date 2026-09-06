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
        `SELECT pv.*, ps.name AS product_name, ps.style_code, ps.description
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

  findSpecByStyleCode(styleCode) {
    return this.db
      .prepare("SELECT * FROM product_specifications WHERE style_code = ?")
      .get(styleCode);
  }

  insertSpec({ styleCode, name, description, basePrice }) {
    const result = this.db
      .prepare(
        "INSERT INTO product_specifications (style_code, name, description, base_price) VALUES (?, ?, ?, ?)"
      )
      .run(styleCode, name, description || null, basePrice);
    return result.lastInsertRowid;
  }

  insertVariant({ productSpecificationId, sku, size, colour, unitPrice, quantityOnHand }) {
    const result = this.db
      .prepare(
        `INSERT INTO product_variants
         (product_specification_id, sku, size, colour, unit_price, quantity_on_hand)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(productSpecificationId, sku, size, colour, unitPrice, quantityOnHand);
    return result.lastInsertRowid;
  }

  updateVariant(id, { size, colour, unitPrice }) {
    this.db
      .prepare(
        "UPDATE product_variants SET size = ?, colour = ?, unit_price = ? WHERE id = ?"
      )
      .run(size, colour, unitPrice, id);
  }

  deleteVariant(id) {
    this.db.prepare("DELETE FROM product_variants WHERE id = ?").run(id);
  }

  hasHistory(variantId) {
    const saleRef = this.db
      .prepare("SELECT 1 FROM sales_line_items WHERE product_variant_id = ? LIMIT 1")
      .get(variantId);
    if (saleRef) return true;
    const adjustmentRef = this.db
      .prepare("SELECT 1 FROM stock_adjustments WHERE product_variant_id = ? LIMIT 1")
      .get(variantId);
    return Boolean(adjustmentRef);
  }
}

module.exports = ProductRepository;
