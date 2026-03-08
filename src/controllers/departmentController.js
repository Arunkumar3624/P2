import { StatusCodes } from "http-status-codes";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Department, Employee } from "../models/index.js";

const mapDepartment = (department) => ({
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
});

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find()
    .populate("managerId", "email role")
    .sort({ name: 1 })
    .lean();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: departments.map(mapDepartment),
  });
});

export const createDepartment = asyncHandler(async (req, res, next) => {
  const normalizedName = String(req.body.name || "").trim();
  const managerId = req.body.managerId || null;

  const existing = await Department.findOne({
    name: { $regex: `^${normalizedName}$`, $options: "i" },
  });
  if (existing) {
    return next(new ApiError(StatusCodes.CONFLICT, "Department name already exists."));
  }

  const created = await Department.create({
    name: normalizedName,
    managerId: managerId || null,
  });

  const department = await Department.findById(created._id)
    .populate("managerId", "email role")
    .lean();

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: mapDepartment(department),
  });
});

export const updateDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const department = await Department.findById(id);

  if (!department) {
    return next(new ApiError(StatusCodes.NOT_FOUND, "Department not found."));
  }

  if (req.body.name !== undefined) {
    const normalizedName = String(req.body.name).trim();
    const existing = await Department.findOne({
      name: { $regex: `^${normalizedName}$`, $options: "i" },
    });
    if (existing && String(existing._id) !== String(department._id)) {
      return next(new ApiError(StatusCodes.CONFLICT, "Department name already exists."));
    }
    department.name = normalizedName;
  }

  if (req.body.managerId !== undefined) {
    department.managerId = req.body.managerId || null;
  }

  await department.save();

  const refreshed = await Department.findById(department._id)
    .populate("managerId", "email role")
    .lean();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: mapDepartment(refreshed),
  });
});

export const deleteDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const department = await Department.findById(id);

  if (!department) {
    return next(new ApiError(StatusCodes.NOT_FOUND, "Department not found."));
  }

  const linkedEmployees = await Employee.countDocuments({ departmentId: id });
  if (linkedEmployees > 0) {
    return next(
      new ApiError(
        StatusCodes.CONFLICT,
        "Cannot delete department with linked employees.",
      ),
    );
  }

  await Department.findByIdAndDelete(id);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Department deleted.",
  });
});
