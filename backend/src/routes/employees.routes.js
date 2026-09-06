const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  EmailTakenError,
  EmployeeNumberTakenError,
  InvalidEmployeeDetailsError,
  InvalidRoleError,
  WeakPasswordError,
  EmployeeNotFoundError,
  SelfDemotionError,
  LastSuperAdminError,
} = require("../services/employeeService");

function buildEmployeesRouter(employeeService) {
  const router = express.Router();

  router.post("/", requireAuth, requireRole("manager", "superadmin"), (req, res) => {
    const { name, email, employeeNumber, password, role } = req.body || {};
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "name, email, password, and role are required." });
    }

    const storeId = req.user.storeId;

    try {
      const employee = employeeService.onboardEmployee({
        name,
        email,
        employeeNumber,
        password,
        role,
        storeId,
      });
      return res.status(201).json(employee);
    } catch (err) {
      if (err instanceof EmailTakenError || err instanceof EmployeeNumberTakenError) {
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof InvalidRoleError || err instanceof WeakPasswordError) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: "Failed to onboard employee." });
    }
  });

  router.get("/", requireAuth, requireRole("manager", "superadmin"), (req, res) => {
    try {
      const employees = employeeService.listEmployees();
      return res.json(employees);
    } catch (err) {
      return res.status(500).json({ error: "Failed to list employees." });
    }
  });

  router.patch("/:id/details", requireAuth, requireRole("manager", "superadmin"), (req, res) => {
    const { name, email } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required." });
    }
    try {
      return res.json(employeeService.updateDetails({
        employeeId: Number(req.params.id),
        name,
        email,
      }));
    } catch (err) {
      if (err instanceof EmployeeNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof EmailTakenError) {
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof InvalidEmployeeDetailsError) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: "Failed to update employee details." });
    }
  });

  router.patch(
    "/:id/role",
    requireAuth,
    requireRole("manager", "superadmin"),
    (req, res) => {
      const { role } = req.body || {};
      if (!role) {
        return res.status(400).json({ error: "role is required." });
      }

      try {
        const employee = employeeService.assignRole({
          employeeId: Number(req.params.id),
          role,
          requestingAdminId: req.user.sub,
        });
        return res.json(employee);
      } catch (err) {
        if (err instanceof EmployeeNotFoundError) {
          return res.status(404).json({ error: err.message });
        }
        if (err instanceof InvalidRoleError) {
          return res.status(400).json({ error: err.message });
        }
        if (err instanceof SelfDemotionError) {
          return res.status(403).json({ error: err.message });
        }
        if (err instanceof LastSuperAdminError) {
          return res.status(409).json({ error: err.message });
        }
        return res.status(500).json({ error: "Failed to update role." });
      }
    }
  );

  return router;
}

module.exports = buildEmployeesRouter;
