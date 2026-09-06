const express = require("express");
const {
  InvalidCredentialsError,
  AccountDisabledError,
} = require("../services/authService");

function buildAuthRouter(authService) {
  const router = express.Router();

  router.post("/login", (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required." });
    }
    try {
      const result = authService.login(username, password);
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
