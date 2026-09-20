import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const authorization = req.get("authorization");

  if (!authorization) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token || !process.env.JWT_SECRET) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}
