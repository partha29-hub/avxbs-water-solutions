import jwt from "jsonwebtoken";

export const requireAdmin = (req, res, next) => {
  try {
    let token = req.cookies?.admin_token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Admin token is missing.",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT_SECRET missing.",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded.adminId || decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Admin access required.",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin session. Please log in again.",
    });
  }
};

