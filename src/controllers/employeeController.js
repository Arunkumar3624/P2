import { StatusCodes } from "http-status-codes";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Department, Employee } from "../models/index.js";

const mapEmployee = (row) => {
  const departmentObj =
    row?.departmentId && typeof row.departmentId === "object"
      ? row.departmentId
      : null;

  return {
    id: String(row._id),
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    departmentId: departmentObj?._id
      ? String(departmentObj._id)
      : String(row.departmentId),
    designation: row.designation,
    salary: row.salary,
    status: row.status,
    joiningDate: row.joiningDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    department: departmentObj?._id
      ? {
          id: String(departmentObj._id),
          name: departmentObj.name,
        }
      : null,
  };
};

export const getEmployees = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const search = (req.query.search || "").trim();

  const sortMap = {
    firstName: "firstName",
    lastName: "lastName",
    email: "email",
    salary: "salary",
    status: "status",
    joiningDate: "joiningDate",
    createdAt: "createdAt",
  };
  const resolvedSort = sortMap[sortBy] || "createdAt";

  const query = search
    ? {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { designation: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [rows, count] = await Promise.all([
    Employee.find(query)
      .populate("departmentId", "name")
      .sort({ [resolvedSort]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    Employee.countDocuments(query),
  ]);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: rows.map(mapEmployee),
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
});

export const createEmployee = asyncHandler(async (req, res, next) => {
  const payload = req.body;

  const existing = await Employee.findOne({
    email: String(payload.email || "").trim().toLowerCase(),
  });
  if (existing) {
    return next(new ApiError(StatusCodes.CONFLICT, "Email is already in use."));
  }

  const department = await Department.findById(payload.departmentId);
  if (!department) {
    return next(new ApiError(StatusCodes.BAD_REQUEST, "Department not found."));
  }

  const employee = await Employee.create({
    ...payload,
    email: String(payload.email || "").trim().toLowerCase(),
  });

  const created = await Employee.findById(employee._id)
    .populate("departmentId", "name")
    .lean();

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: mapEmployee(created),
  });
});

export const updateEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const payload = req.body;

  const employee = await Employee.findById(id);
  if (!employee) {
    return next(new ApiError(StatusCodes.NOT_FOUND, "Employee not found."));
  }

  if (payload.departmentId) {
    const department = await Department.findById(payload.departmentId);
    if (!department) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Department not found."));
    }
  }

  if (payload.email) {
    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const existing = await Employee.findOne({ email: normalizedEmail });
    if (existing && String(existing._id) !== String(employee._id)) {
      return next(new ApiError(StatusCodes.CONFLICT, "Email is already in use."));
    }
    employee.email = normalizedEmail;
  }

  const updatableFields = [
    "firstName",
    "lastName",
    "phone",
    "departmentId",
    "designation",
    "salary",
    "status",
    "joiningDate",
  ];

  updatableFields.forEach((field) => {
    if (payload[field] !== undefined) {
      employee[field] = payload[field];
    }
  });

  await employee.save();

  const refreshed = await Employee.findById(id)
    .populate("departmentId", "name")
    .lean();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: mapEmployee(refreshed),
  });
});

export const deleteEmployee = asyncHandler(async (req, res, next) => {
  const deleted = await Employee.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return next(new ApiError(StatusCodes.NOT_FOUND, "Employee not found."));
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Employee deleted.",
  });
});
