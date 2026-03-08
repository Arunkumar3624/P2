import { body, param } from "express-validator";

export const createDepartmentValidator = [
  body("name")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Department name is required."),
  body("managerId")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("managerId must be a valid ObjectId."),
];

export const updateDepartmentValidator = [
  param("id")
    .isMongoId()
    .withMessage("Department id must be a valid ObjectId."),
  body("name")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Department name cannot be empty."),
  body("managerId")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("managerId must be a valid ObjectId."),
];

export const departmentIdParamValidator = [
  param("id")
    .isMongoId()
    .withMessage("Department id must be a valid ObjectId."),
];
