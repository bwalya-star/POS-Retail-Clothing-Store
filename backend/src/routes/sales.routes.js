const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  ItemNotFoundError,
  InsufficientStockError,
  UnderpaymentError,
} = require("../services/saleService");

function buildSalesRouter(saleService) {
  const router = express.Router();

  router.post("/", requireAuth, requireRole("cashier", "manager", "superadmin"), (req, res) => {
    const { registerId, customerId, lineItems, payment } = req.body || {};
    if (!registerId || !Array.isArray(lineItems) || !payment) {
      return res
        .status(400)
        .json({ error: "registerId, lineItems[], and payment are required." });
    }
    try {
      const sale = saleService.processSale({
        registerId,
        cashierId: req.user.sub,
        customerId,
        lineItems,
        payment,
      });
      return res.status(201).json(sale);
    } catch (err) {
      if (err instanceof ItemNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof InsufficientStockError) {
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof UnderpaymentError) {
        return res.status(400).json({ error: err.message });
      }
      console.error("POST /api/sales failed:", err);
      return res.status(500).json({ error: "Failed to process sale." });
    }
  });

  return router;
}

module.exports = buildSalesRouter;
