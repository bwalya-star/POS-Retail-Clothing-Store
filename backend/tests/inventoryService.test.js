const { makeTestDb } = require("./testDb");
const ProductRepository = require("../src/repositories/productRepository");
const { InventoryService, UnknownSkuError } = require("../src/services/inventoryService");

describe("InventoryService (UC3: Manage Inventory - Restock Item)", () => {
  let inventoryService, productRepository, managerId;

  beforeEach(() => {
    const ctx = makeTestDb();
    managerId = ctx.managerId;
    productRepository = new ProductRepository(ctx.db);
    inventoryService = new InventoryService(productRepository);
  });

  test("increases stock and logs a stock adjustment", () => {
    const updated = inventoryService.restockItem({
      sku: "TSH-001-M-BLK",
      quantity: 5,
      managerId,
    });
    expect(updated.quantity_on_hand).toBe(15); // 10 + 5
  });

  test("throws UnknownSkuError for a SKU that doesn't exist (extension 2a)", () => {
    expect(() =>
      inventoryService.restockItem({ sku: "NOPE", quantity: 5, managerId })
    ).toThrow(UnknownSkuError);
  });

  test("rejects a non-positive quantity", () => {
    expect(() =>
      inventoryService.restockItem({ sku: "TSH-001-M-BLK", quantity: 0, managerId })
    ).toThrow();
  });
});
