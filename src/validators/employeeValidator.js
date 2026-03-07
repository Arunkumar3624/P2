import { body, param, query } from "express-validator";

export const employeeQueryValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100."),
  query("sortBy")
    .optional()
    .isIn([
      "firstName",
      "lastName",
      "email",
      "salary",
      "status",
      "joiningDate",
      "createdAt"
    ])
    .withMessage("Invalid sortBy field."),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc.")
];

export const updateEmployeeValidator = [
  param("id").isUUID().withMessage("Employee id must be a valid UUID."),
  body("firstName").optional().isString().trim().notEmpty(),
  body("lastName").optional().isString().trim().notEmpty(),
  body("email").optional().isEmail().withMessage("Invalid email."),
  body("phone").optional().isString().trim().notEmpty(),
  body("departmentId").optional().isUUID().withMessage("Invalid departmentId."),
  body("designation").optional().isString().trim().notEmpty(),
  body("salary")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Salary must be positive."),
  body("status")
    .optional()
    .isIn(["Active", "On-Leave", "Terminated"])
    .withMessage("Invalid status."),
  body("joiningDate").optional().isISO8601().withMessage("Invalid joiningDate.")
];

export const employeeIdParamValidator = [
  param("id").isUUID().withMessage("Employee id must be a valid UUID.")
];
