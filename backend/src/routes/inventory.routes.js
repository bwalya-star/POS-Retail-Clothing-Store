const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  UnknownSkuError,
  DuplicateSkuError,
  InvalidPriceError,
  VariantInUseError,
} = require("../services/inventoryService");

function mapInventoryError(err, res) {
  if (err instanceof UnknownSkuError) return res.status(404).json({ error: err.message });
  if (err instanceof DuplicateSkuError) return res.status(409).json({ error: err.message });
  if (err instanceof InvalidPriceError) return res.status(400).json({ error: err.message });
  if (err instanceof VariantInUseError) return res.status(409).json({ error: err.message });
  return res.status(500).json({ error: "Inventory operation failed." });
}

function buildInventoryRouter(inventoryService) {
  const router = express.Router();

  router.get("/", requireAuth, (req, res) => {
    return res.json(inventoryService.listProducts());
  });

  router.post("/restock", requireAuth, requireRole("manager", "superadmin"), (req, res) => {
    const { sku, quantity } = req.body || {};
    if (!sku || !quantity) {
      return res.status(400).json({ error: "sku and quantity are required." });
    }
    try {
      const variant = inventoryService.restockItem({
        sku,
        quantity,
        managerId: req.user.sub,
      });
      return res.json(variant);
    } catch (err) {
      return mapInventoryError(err, res);
    }
  });

  // UC5: Manage Products - Add
  router.post("/", requireAuth, requireRole("manager", "superadmin"), (req, res) => {
    const { styleCode, productName, description, basePrice, sku, size, colour, unitPrice, quantityOnHand } = req.body || {};
    if (!styleCode || !productName || !sku || !size || !colour || !unitPrice) {
      return res.status(400).json({
        error: "styleCode, productName, sku, size, colour, and unitPrice are required.",
      });
    }
    try {
      const variant = inventoryService.createProduct({
        styleCode,
        productName,
        description,
        basePrice,
        sku,
        size,
        colour,
        unitPrice: Number(unitPrice),
        quantityOnHand: Number(quantityOnHand) || 0,
      });
      return res.status(201).json(variant);
    } catch (err) {
      return mapInventoryError(err, res);
    }
  });

  // UC5: Manage Products - Edit (Alternate Flow A)
  router.patch("/:sku", requireAuth, requireRole("manager", "superadmin"), (req, res) => {
    const { size, colour, unitPrice } = req.body || {};
    if (unitPrice === undefined) {
      return res.status(400).json({ error: "unitPrice is required." });
    }
    try {
      const variant = inventoryService.updateProduct({
        sku: req.params.sku,
        size,
        colour,
        unitPrice: Number(unitPrice),
      });
      return res.json(variant);
    } catch (err) {
      return mapInventoryError(err, res);
    }
  });

  // UC5: Manage Products - Remove (Alternate Flow B)
  router.delete("/:sku", requireAuth, requireRole("manager", "superadmin"), (req, res) => {
    try {
      inventoryService.deleteProduct({ sku: req.params.sku });
      return res.status(204).end();
    } catch (err) {
      return mapInventoryError(err, res);
    }
  });

  return router;
}

module.exports = buildInventoryRouter;
