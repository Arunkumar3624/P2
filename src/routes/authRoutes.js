import { Router } from "express";
import { login, logout, me, register } from "../controllers/authController.js";
import { loginValidator, registerValidator } from "../validators/authValidator.js";
import validate from "../middleware/validateMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/me", protect, me);
router.post("/logout", protect, logout);

export default router;
