class ItemNotFoundError extends Error {}
class InsufficientStockError extends Error {}
class UnderpaymentError extends Error {}

class SaleService {
  constructor(db, saleRepository, productRepository) {
    this.db = db;
    this.saleRepository = saleRepository;
    this.productRepository = productRepository;
  }

  findRegisterIdByStoreId(storeId) {
    const register = this.db
      .prepare("SELECT id FROM registers WHERE store_id = ? ORDER BY id LIMIT 1")
      .get(storeId);
    return register ? register.id : null;
  }

  // UC2: Process Sale
  processSale({ registerId, cashierId, customerId, lineItems, payment }) {
    if (!lineItems || lineItems.length === 0) {
      throw new Error("A sale must contain at least one line item.");
    }

    // Resolve variants and validate stock (extensions 3a/3b) before touching the DB.
    const resolvedItems = lineItems.map(({ sku, quantity }) => {
      const variant = this.productRepository.findVariantBySku(sku);
      if (!variant) {
        throw new ItemNotFoundError(`No product found for SKU "${sku}".`);
      }
      if (variant.quantity_on_hand < quantity) {
        throw new InsufficientStockError(
          `Only ${variant.quantity_on_hand} unit(s) of "${sku}" available, requested ${quantity}.`
        );
      }
      const subtotal = Number((variant.unit_price * quantity).toFixed(2));
      return { variant, quantity, subtotal };
    });

    const totalAmount = Number(
      resolvedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
    );

    // Extension 7a: cash tendered less than total.
    if (payment.amount < totalAmount) {
      throw new UnderpaymentError(
        `Payment of ${payment.amount} is less than the total due of ${totalAmount}.`
      );
    }
    const changeDue = Number((payment.amount - totalAmount).toFixed(2));

    // Extension 8a: commit everything atomically, or roll back entirely.
    const runTransaction = this.db.transaction(() => {
      const saleId = this.saleRepository.insertSale({
        registerId,
        cashierId,
        customerId,
        dateTime: new Date().toISOString(),
        totalAmount,
      });

      for (const item of resolvedItems) {
        this.saleRepository.insertLineItem({
          saleId,
          productVariantId: item.variant.id,
          quantity: item.quantity,
          subtotal: item.subtotal,
        });
        this.productRepository.decrementStock(item.variant.id, item.quantity);
      }

      this.saleRepository.insertPayment({
        saleId,
        amount: payment.amount,
        method: payment.method,
        changeDue,
      });

      return saleId;
    });

    const saleId = runTransaction();
    return { ...this.saleRepository.findSaleWithDetails(saleId), changeDue };
  }
}

module.exports = {
  SaleService,
  ItemNotFoundError,
  InsufficientStockError,
  UnderpaymentError,
};
