const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
<<<<<<< HEAD
  UsernameTakenError,
=======
  EmailTakenError,
  EmployeeNumberTakenError,
  InvalidEmployeeDetailsError,
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
  InvalidRoleError,
  WeakPasswordError,
  EmployeeNotFoundError,
  SelfDemotionError,
  LastSuperAdminError,
} = require("../services/employeeService");

function buildEmployeesRouter(employeeService) {
  const router = express.Router();

<<<<<<< HEAD
  router.post("/", requireAuth, requireRole("superadmin"), (req, res) => {
    const { name, username, password, role } = req.body || {};
    if (!name || !username || !password || !role) {
      return res
        .status(400)
        .json({ error: "name, username, password, and role are required." });
=======
  router.post("/", requireAuth, requireRole("manager", "superadmin"), (req, res) => {
    const { name, email, employeeNumber, password, role } = req.body || {};
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "name, email, password, and role are required." });
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
    }

    const storeId = req.user.storeId;

    try {
      const employee = employeeService.onboardEmployee({
        name,
<<<<<<< HEAD
        username,
=======
        email,
        employeeNumber,
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
        password,
        role,
        storeId,
      });
      return res.status(201).json(employee);
    } catch (err) {
<<<<<<< HEAD
      if (err instanceof UsernameTakenError) {
=======
      if (err instanceof EmailTakenError || err instanceof EmployeeNumberTakenError) {
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof InvalidRoleError || err instanceof WeakPasswordError) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: "Failed to onboard employee." });
    }
  });

<<<<<<< HEAD
  router.get("/", requireAuth, requireRole("superadmin"), (req, res) => {
=======
  router.get("/", requireAuth, requireRole("manager", "superadmin"), (req, res) => {
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
    try {
      const employees = employeeService.listEmployees();
      return res.json(employees);
    } catch (err) {
      return res.status(500).json({ error: "Failed to list employees." });
    }
  });

<<<<<<< HEAD
  router.patch(
    "/:id/role",
    requireAuth,
    requireRole("superadmin"),
=======
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
>>>>>>> 7afd5a9c4f889c8bffa21472ae20ef3fdbb5561b
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
