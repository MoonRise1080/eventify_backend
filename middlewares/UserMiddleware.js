import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Import your User model

// Validation for signup with new fields
export const validateSignup = (req, res, next) => {
  const { name, email, studentId, password, confirmPassword, university } =
    req.body;

  if (
    !name ||
    !email ||
    !studentId ||
    !password ||
    !confirmPassword ||
    !university
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // Validate student ID format if needed
  const idRegex = /^[A-Za-z0-9\-_]+$/;
  if (!idRegex.test(studentId)) {
    return res.status(400).json({
      message:
        "Student ID can only contain letters, numbers, hyphens, and underscores",
    });
  }

  next(); // Move to the next function (controller)
};

// Login validation remains the same
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password are required" });
  }

  next(); // Move to the next function (controller)
};

// Authentication middleware (simplified version)
export const authenticateUser = (req, res, next) => {
  const authHeader = req.header("Authorization");

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Protect middleware updated for new User model
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by email (from the token)
      req.user = await User.findOne({ email: decoded.email }).select(
        "-password"
      );

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "User not found, not authorized" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
