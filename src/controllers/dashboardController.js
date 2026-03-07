import { fn, col } from "sequelize";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "../utils/asyncHandler.js";
import { Department, Employee, sequelize } from "../models/index.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const totalHeadcount = await Employee.count();

    const deptDistributionRows = await Department.findAll({
      attributes: ["id", "name", [fn("COUNT", col("employees.id")), "count"]],
      include: [{ model: Employee, as: "employees", attributes: [] }],
      group: ["Department.id"],
      raw: true,
    });

    const deptDistribution = deptDistributionRows.map((row) => ({
      departmentId: row.id,
      departmentName: row.name,
      count: Number(row.count),
    }));

    const recentHires = await Employee.findAll({
      attributes: ["id", "firstName", "lastName", "designation", "joiningDate"],
      include: [
        { model: Department, as: "department", attributes: ["id", "name"] },
      ],
      order: [["joiningDate", "DESC"]],
      limit: 5,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        totalHeadcount,
        deptDistribution,
        recentHires,
      },
    });
  } catch {
    // Fallback for ems_db schema where employees/departments use camelCase fields.
    const [[totalRow]] = await sequelize.query(
      "SELECT COUNT(*) AS totalHeadcount FROM employees",
    );

    const [deptDistributionRows] = await sequelize.query(`
      SELECT d.id, d.name, COUNT(e.id) AS count
      FROM departments d
      LEFT JOIN employees e ON e.departmentId = d.id
      GROUP BY d.id, d.name
      ORDER BY d.name ASC
    `);

    const [recentRows] = await sequelize.query(`
      SELECT e.id, e.name, e.designation, e.joiningDate, d.id AS departmentId, d.name AS departmentName
      FROM employees e
      LEFT JOIN departments d ON d.id = e.departmentId
      ORDER BY e.joiningDate DESC
      LIMIT 5
    `);

    const deptDistribution = deptDistributionRows.map((row) => ({
      departmentId: row.id,
      departmentName: row.name,
      count: Number(row.count),
    }));

    const recentHires = recentRows.map((row) => {
      const fullName = (row.name || "").trim();
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || "";
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

      return {
        id: row.id,
        firstName,
        lastName,
        designation: row.designation,
        joiningDate: row.joiningDate,
        department: row.departmentId
          ? { id: row.departmentId, name: row.departmentName }
          : null,
      };
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        totalHeadcount: Number(totalRow.totalHeadcount || 0),
        deptDistribution,
        recentHires,
      },
    });
  }
});
