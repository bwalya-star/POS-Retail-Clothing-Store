const { makeTestDb } = require("./testDb");
const ProductRepository = require("../src/repositories/productRepository");
const {
  InventoryService,
  UnknownSkuError,
  DuplicateSkuError,
  InvalidPriceError,
  VariantInUseError,
} = require("../src/services/inventoryService");

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

describe("InventoryService (UC5: Manage Products)", () => {
  let inventoryService, productRepository, managerId;

  beforeEach(() => {
    const ctx = makeTestDb();
    managerId = ctx.managerId;
    productRepository = new ProductRepository(ctx.db);
    inventoryService = new InventoryService(productRepository);
  });

  test("creates a new variant under a new product specification", () => {
    const variant = inventoryService.createProduct({
      styleCode: "HAT-001",
      productName: "Sun Hat",
      basePrice: 20,
      sku: "HAT-001-OS-TAN",
      size: "OS",
      colour: "Tan",
      unitPrice: 20,
      quantityOnHand: 5,
    });
    expect(variant.sku).toBe("HAT-001-OS-TAN");
    expect(variant.quantity_on_hand).toBe(5);
  });

  test("creates a new variant under an existing product specification", () => {
    inventoryService.createProduct({
      styleCode: "TSH-001",
      productName: "Classic T-Shirt",
      sku: "TSH-001-L-BLK",
      size: "L",
      colour: "Black",
      unitPrice: 15,
      quantityOnHand: 8,
    });
    const listed = inventoryService.listProducts().find((v) => v.sku === "TSH-001-L-BLK");
    expect(listed.product_name).toBe("Classic T-Shirt");
  });

  test("throws DuplicateSkuError for an existing SKU (extension 3a)", () => {
    expect(() =>
      inventoryService.createProduct({
        styleCode: "TSH-001",
        productName: "Classic T-Shirt",
        sku: "TSH-001-M-BLK", // already seeded
        size: "M",
        colour: "Black",
        unitPrice: 15,
        quantityOnHand: 1,
      })
    ).toThrow(DuplicateSkuError);
  });

  test("throws InvalidPriceError for a non-positive price on create", () => {
    expect(() =>
      inventoryService.createProduct({
        styleCode: "HAT-001",
        productName: "Sun Hat",
        sku: "HAT-001-OS-TAN",
        size: "OS",
        colour: "Tan",
        unitPrice: 0,
        quantityOnHand: 1,
      })
    ).toThrow(InvalidPriceError);
  });

  test("edits an existing variant's price/size/colour", () => {
    const updated = inventoryService.updateProduct({
      sku: "TSH-001-M-BLK",
      size: "M",
      colour: "Charcoal",
      unitPrice: 18,
    });
    expect(updated.colour).toBe("Charcoal");
    expect(updated.unit_price).toBe(18);
  });

  test("throws UnknownSkuError when editing a SKU that doesn't exist", () => {
    expect(() =>
      inventoryService.updateProduct({ sku: "NOPE", unitPrice: 10 })
    ).toThrow(UnknownSkuError);
  });

  test("removes a variant with no sales/adjustment history", () => {
    inventoryService.deleteProduct({ sku: "TSH-001-S-BLK" }); // seeded with 0 stock, no history
    expect(inventoryService.listProducts().find((v) => v.sku === "TSH-001-S-BLK")).toBeUndefined();
  });

  test("throws VariantInUseError when removing a variant with restock history (extension 2a)", () => {
    inventoryService.restockItem({ sku: "TSH-001-S-BLK", quantity: 1, managerId });
    expect(() => inventoryService.deleteProduct({ sku: "TSH-001-S-BLK" })).toThrow(VariantInUseError);
  });
});
