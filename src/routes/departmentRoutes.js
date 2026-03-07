import { Router } from "express";
import { getDepartments } from "../controllers/departmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getDepartments);

export default router;
