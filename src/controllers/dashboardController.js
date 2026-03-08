import { StatusCodes } from "http-status-codes";
import asyncHandler from "../utils/asyncHandler.js";
import { Department, Employee } from "../models/index.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalHeadcount = await Employee.countDocuments();
  const departments = await Department.find().select("name").lean();
  const grouped = await Employee.aggregate([
    { $group: { _id: "$departmentId", count: { $sum: 1 } } },
  ]);

  const groupedMap = new Map(grouped.map((row) => [String(row._id), row.count]));

  const deptDistribution = departments.map((department) => ({
    departmentId: String(department._id),
    departmentName: department.name,
    count: Number(groupedMap.get(String(department._id)) || 0),
  }));

  const recentRows = await Employee.find()
    .select("firstName lastName designation joiningDate departmentId")
    .populate("departmentId", "name")
    .sort({ joiningDate: -1 })
    .limit(5)
    .lean();

  const recentHires = recentRows.map((row) => ({
    id: String(row._id),
    firstName: row.firstName,
    lastName: row.lastName,
    designation: row.designation,
    joiningDate: row.joiningDate,
    department: row.departmentId?._id
      ? { id: String(row.departmentId._id), name: row.departmentId.name }
      : null,
  }));

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      totalHeadcount,
      deptDistribution,
      recentHires,
    },
  });
});
