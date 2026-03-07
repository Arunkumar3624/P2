import { Router } from "express";
import {
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "../controllers/employeeController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import {
  employeeIdParamValidator,
  employeeQueryValidator,
  updateEmployeeValidator,
} from "../validators/employeeValidator.js";

const router = Router();

router.get("/", employeeQueryValidator, validate, getEmployees);

router.use(protect);
router.put(
  "/:id",
  authorize("Admin", "admin"),
  updateEmployeeValidator,
  validate,
  updateEmployee,
);
router.delete(
  "/:id",
  authorize("Admin", "admin"),
  employeeIdParamValidator,
  validate,
  deleteEmployee,
);

export default router;
