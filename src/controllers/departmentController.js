import { StatusCodes } from "http-status-codes";
import asyncHandler from "../utils/asyncHandler.js";
import { Department } from "../models/index.js";

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find()
    .populate("managerId", "email role")
    .sort({ name: 1 })
    .lean();

  const data = departments.map((department) => ({
    id: String(department._id),
    name: department.name,
    managerId: department.managerId?._id
      ? String(department.managerId._id)
      : department.managerId
        ? String(department.managerId)
        : null,
    manager: department.managerId?._id
      ? {
          id: String(department.managerId._id),
          email: department.managerId.email,
          role: department.managerId.role,
        }
      : null,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  }));

  return res.status(StatusCodes.OK).json({
    success: true,
    data,
  });
});
