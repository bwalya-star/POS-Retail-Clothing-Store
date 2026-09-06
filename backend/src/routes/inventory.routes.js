const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { UnknownSkuError } = require("../services/inventoryService");

function buildInventoryRouter(inventoryService, productRepository) {
  const router = express.Router();

  router.get("/", requireAuth, (req, res) => {
    return res.json(productRepository.listVariants());
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
      if (err instanceof UnknownSkuError) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: "Failed to restock item." });
    }
  });

  return router;
}

module.exports = buildInventoryRouter;
