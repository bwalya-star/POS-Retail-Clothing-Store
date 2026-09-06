class UnknownSkuError extends Error {}
class DuplicateSkuError extends Error {}
class InvalidPriceError extends Error {}
class VariantInUseError extends Error {}

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

  listProducts() {
    return this.productRepository.listVariants();
  }

  // UC5: Manage Products - Add Product Variant
  createProduct({ styleCode, productName, basePrice, sku, size, colour, unitPrice, quantityOnHand }) {
    if (this.productRepository.findVariantBySku(sku)) {
      throw new DuplicateSkuError(`SKU "${sku}" is already in use.`);
    }
    if (unitPrice <= 0) {
      throw new InvalidPriceError("Unit price must be greater than 0.");
    }

    let spec = this.productRepository.findSpecByStyleCode(styleCode);
    if (!spec) {
      const specId = this.productRepository.insertSpec({
        styleCode,
        name: productName,
        basePrice: basePrice ?? unitPrice,
      });
      spec = this.productRepository.findSpecByStyleCode(styleCode);
      spec.id = specId;
    }

    const variantId = this.productRepository.insertVariant({
      productSpecificationId: spec.id,
      sku,
      size,
      colour,
      unitPrice,
      quantityOnHand: quantityOnHand || 0,
    });

    return this.productRepository.findVariantById(variantId);
  }

  // UC5: Manage Products - Edit Product Variant (Alternate Flow A)
  updateProduct({ sku, size, colour, unitPrice }) {
    const variant = this.productRepository.findVariantBySku(sku);
    if (!variant) {
      throw new UnknownSkuError(`No product variant found for SKU "${sku}".`);
    }
    if (unitPrice <= 0) {
      throw new InvalidPriceError("Unit price must be greater than 0.");
    }

    this.productRepository.updateVariant(variant.id, {
      size: size ?? variant.size,
      colour: colour ?? variant.colour,
      unitPrice,
    });

    return this.productRepository.findVariantById(variant.id);
  }

  // UC5: Manage Products - Remove Product Variant (Alternate Flow B)
  deleteProduct({ sku }) {
    const variant = this.productRepository.findVariantBySku(sku);
    if (!variant) {
      throw new UnknownSkuError(`No product variant found for SKU "${sku}".`);
    }
    if (this.productRepository.hasHistory(variant.id)) {
      // Extension 2a (Remove): preserve the audit trail sales/adjustments depend on.
      throw new VariantInUseError(
        `Cannot remove "${sku}" - it has sales or stock-adjustment history. Edit it instead.`
      );
    }

    this.productRepository.deleteVariant(variant.id);
  }
}

module.exports = {
  InventoryService,
  UnknownSkuError,
  DuplicateSkuError,
  InvalidPriceError,
  VariantInUseError,
};
