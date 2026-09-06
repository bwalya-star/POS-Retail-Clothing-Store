const express = require("express");
const {
  InvalidCredentialsError,
  AccountDisabledError,
} = require("../services/authService");

function buildAuthRouter(authService) {
  const router = express.Router();

  router.post("/login", (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }
    try {
      const result = authService.login(email, password);
      return res.json(result);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return res.status(401).json({ error: err.message });
      }
      if (err instanceof AccountDisabledError) {
        return res.status(403).json({ error: err.message });
      }
      return res.status(500).json({ error: "Login failed." });
    }
  });

  return router;
}

module.exports = buildAuthRouter;
