import { Router } from "express";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../controllers/departmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import {
  createDepartmentValidator,
  departmentIdParamValidator,
  updateDepartmentValidator,
} from "../validators/departmentValidator.js";

const router = Router();

router.get("/", protect, getDepartments);
router.post("/", protect, createDepartmentValidator, validate, createDepartment);
router.put("/:id", protect, updateDepartmentValidator, validate, updateDepartment);
router.delete("/:id", protect, departmentIdParamValidator, validate, deleteDepartment);

export default router;
