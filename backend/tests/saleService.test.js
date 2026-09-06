const { makeTestDb } = require("./testDb");
const ProductRepository = require("../src/repositories/productRepository");
const SaleRepository = require("../src/repositories/saleRepository");
const {
  SaleService,
  ItemNotFoundError,
  InsufficientStockError,
  UnderpaymentError,
} = require("../src/services/saleService");

describe("SaleService (UC2: Process Sale)", () => {
  let db, saleService, registerId, cashierId, productRepository;

  beforeEach(() => {
    const ctx = makeTestDb();
    db = ctx.db;
    registerId = ctx.registerId;
    cashierId = ctx.cashierId;
    productRepository = new ProductRepository(db);
    saleService = new SaleService(db, new SaleRepository(db), productRepository);
  });

  test("processes a multi-item sale, decrements stock, and returns change due", () => {
    const sale = saleService.processSale({
      registerId,
      cashierId,
      lineItems: [{ sku: "TSH-001-M-BLK", quantity: 3 }],
      payment: { amount: 50, method: "cash" },
    });

    expect(sale.total_amount).toBe(45);
    expect(sale.changeDue).toBe(5);
    expect(sale.lineItems).toHaveLength(1);

    const variant = productRepository.findVariantBySku("TSH-001-M-BLK");
    expect(variant.quantity_on_hand).toBe(7); // 10 - 3
  });

  test("throws ItemNotFoundError for an unknown SKU (extension 3a)", () => {
    expect(() =>
      saleService.processSale({
        registerId,
        cashierId,
        lineItems: [{ sku: "DOES-NOT-EXIST", quantity: 1 }],
        payment: { amount: 100, method: "cash" },
      })
    ).toThrow(ItemNotFoundError);
  });

  test("throws InsufficientStockError when requested quantity exceeds stock (extension 3b)", () => {
    expect(() =>
      saleService.processSale({
        registerId,
        cashierId,
        lineItems: [{ sku: "TSH-001-S-BLK", quantity: 1 }], // seeded with 0 stock
        payment: { amount: 100, method: "cash" },
      })
    ).toThrow(InsufficientStockError);
  });

  test("throws UnderpaymentError when payment is less than total (extension 7a)", () => {
    expect(() =>
      saleService.processSale({
        registerId,
        cashierId,
        lineItems: [{ sku: "TSH-001-M-BLK", quantity: 2 }],
        payment: { amount: 1, method: "cash" },
      })
    ).toThrow(UnderpaymentError);
  });

  test("rolls back stock changes entirely when the sale fails partway (extension 8a)", () => {
    const before = productRepository.findVariantBySku("TSH-001-M-BLK").quantity_on_hand;

    expect(() =>
      saleService.processSale({
        registerId,
        cashierId,
        lineItems: [
          { sku: "TSH-001-M-BLK", quantity: 1 },
          { sku: "DOES-NOT-EXIST", quantity: 1 },
        ],
        payment: { amount: 100, method: "cash" },
      })
    ).toThrow(ItemNotFoundError);

    const after = productRepository.findVariantBySku("TSH-001-M-BLK").quantity_on_hand;
    expect(after).toBe(before); // no partial stock decrement
  });
});
