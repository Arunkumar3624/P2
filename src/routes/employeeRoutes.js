import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "../controllers/employeeController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import {
  employeeIdParamValidator,
  employeeQueryValidator,
  createEmployeeValidator,
  updateEmployeeValidator,
} from "../validators/employeeValidator.js";

const router = Router();

router.get("/", employeeQueryValidator, validate, getEmployees);

router.use(protect);
router.post(
  "/",
  authorize("Admin", "admin", "user", "hr", "Manager", "employee"),
  createEmployeeValidator,
  validate,
  createEmployee,
);
router.put(
  "/:id",
  authorize("Admin", "admin", "user", "hr", "Manager", "employee"),
  updateEmployeeValidator,
  validate,
  updateEmployee,
);
router.delete(
  "/:id",
  authorize("Admin", "admin", "user", "hr", "Manager", "employee"),
  employeeIdParamValidator,
  validate,
  deleteEmployee,
);

export default router;
