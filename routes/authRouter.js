import { Router } from "express";
import {
  loginUser,
  logout,
  registerUser,
  verifyOtp,
} from "../controllers/authController.js";
import {
  validateLoginInput,
  validateOtpInput,
  validateRegisterInput,
} from "../middleware/validationMiddleware.js";
import { authenticateUser } from "../middleware/authenticationMiddleware.js";

const router = Router();
router.post("/register", validateRegisterInput, registerUser);
router.post("/login", validateLoginInput, loginUser);
router.post("/verify", validateOtpInput, authenticateUser, verifyOtp);
router.post("/logout", logout);

export default router;
