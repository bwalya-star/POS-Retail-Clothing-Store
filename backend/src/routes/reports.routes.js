const express = require("express");

const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");

const {
  InvalidPeriodError,
} = require("../services/salesReportService");


function buildReportsRouter(salesReportService) {
  const router = express.Router();


  router.get(
    "/summary",
    requireAuth,
    requireRole("manager", "superadmin"),
    (req, res) => {
      const { period = "month" } = req.query;

      try {
        const summary =
          salesReportService.getSummary({
            period,
          });

        return res.json(summary);

      } catch (err) {
        if (err instanceof InvalidPeriodError) {
          return res.status(400).json({
            error: err.message,
          });
        }

        return res.status(500).json({
          error: "Failed to generate sales summary.",
        });
      }
    }
  );


  router.get(
    "/top-sellers",
    requireAuth,
    requireRole("manager", "superadmin"),
    (req, res) => {
      const { period = "month" } = req.query;

      const limit = req.query.limit
        ? Number(req.query.limit)
        : 5;

      try {
        const products =
          salesReportService.getTopSellers({
            period,
            limit,
          });

        return res.json(products);

      } catch (err) {
        if (err instanceof InvalidPeriodError) {
          return res.status(400).json({
            error: err.message,
          });
        }

        return res.status(500).json({
          error: "Failed to generate top sellers.",
        });
      }
    }
  );


  return router;
}

module.exports = buildReportsRouter;