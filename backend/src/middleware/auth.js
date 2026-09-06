const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../services/authService");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing authentication token." });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    const employee = req.app.locals.db
      ?.prepare("SELECT id, is_active FROM employees WHERE id = ?")
      .get(req.user.sub);
    if (!employee || !employee.is_active) {
      return res.status(401).json({ error: "Session is no longer valid. Please log in again." });
    }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
