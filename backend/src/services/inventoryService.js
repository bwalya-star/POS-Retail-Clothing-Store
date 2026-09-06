class UnknownSkuError extends Error {}

class InventoryService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  // UC3: Manage Inventory - Restock Item
  restockItem({ sku, quantity, managerId }) {
    if (quantity <= 0) {
      throw new Error("Restock quantity must be positive.");
    }

    const variant = this.productRepository.findVariantBySku(sku);
    if (!variant) {
      // Extension 2a: SKU not found - caller should prompt to register a new variant.
      throw new UnknownSkuError(
        `No product variant found for SKU "${sku}". Register it before restocking.`
      );
    }

    this.productRepository.incrementStock(variant.id, quantity);
    this.productRepository.insertStockAdjustment({
      productVariantId: variant.id,
      managerId,
      quantityChanged: quantity,
      reason: "restock",
      timestamp: new Date().toISOString(),
    });

    return this.productRepository.findVariantById(variant.id);
  }
}

module.exports = { InventoryService, UnknownSkuError };
