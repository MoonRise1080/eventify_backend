import express from "express";
import {
  signupUser,
  loginUser,
  searchUsers,
  getProfile,
  getUserById, // Add this import
  findStudentByIdAndClub,
  getStudentsByClub,
} from "../controllers/UserController.js";
import {
  validateSignup,
  validateLogin,
  authenticateUser,
} from "../middlewares/UserMiddleware.js";

const userRouter = express.Router();

// Public routes
userRouter.post("/signup", validateSignup, signupUser);
userRouter.post("/login", validateLogin, loginUser);

// Protected routes (require authentication)
userRouter.get("/search", authenticateUser, searchUsers);
userRouter.get("/profile", authenticateUser, getProfile);
userRouter.get("/:studentId", authenticateUser, getUserById);
userRouter.get(
  "/:sudentId/club/:clubId",
  authenticateUser,
  findStudentByIdAndClub
);
userRouter.get("/club/:clubId", authenticateUser, getStudentsByClub);

export default userRouter;
