/**
 * Session-based auth guard.
 * Redirects unauthenticated requests to the login page.
 * For API calls (Accept: application/json), returns 401 JSON instead.
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  const wantsJson =
    req.headers.accept && req.headers.accept.includes("application/json");

  if (wantsJson) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated." });
  }

  return res.redirect("/index.html");
};

module.exports = { requireAuth };
