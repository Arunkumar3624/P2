import { Op } from "sequelize";
import { StatusCodes } from "http-status-codes";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Department, Employee, sequelize } from "../models/index.js";

export const getEmployees = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = (req.query.sortOrder || "desc").toUpperCase();
  const search = (req.query.search || "").trim();

  const searchFilter = search
    ? {
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { designation: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  try {
    const { rows, count } = await Employee.findAndCountAll({
      where: searchFilter,
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: rows,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch {
    // Fallback for ems_db schema where employees use camelCase columns.
    const orderMap = {
      firstName: "e.name",
      lastName: "e.name",
      email: "e.email",
      salary: "e.salary",
      status: "e.status",
      joiningDate: "e.joiningDate",
      createdAt: "e.createdAt",
    };

    const orderBy = orderMap[sortBy] || "e.createdAt";
    const orderDir = sortOrder === "ASC" ? "ASC" : "DESC";
    const likeSearch = `%${search}%`;

    const whereSql = search
      ? "WHERE (e.name LIKE :search OR e.email LIKE :search OR e.designation LIKE :search)"
      : "";

    const [[countRow]] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM employees e ${whereSql}`,
      {
        replacements: { search: likeSearch },
      },
    );

    const [rows] = await sequelize.query(
      `
        SELECT
          e.id,
          e.name,
          e.email,
          e.phone,
          e.departmentId,
          e.designation,
          e.salary,
          e.status,
          e.joiningDate,
          e.createdAt,
          e.updatedAt,
          d.id AS department_id,
          d.name AS department_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.departmentId
        ${whereSql}
        ORDER BY ${orderBy} ${orderDir}
        LIMIT :limit OFFSET :offset
      `,
      {
        replacements: {
          search: likeSearch,
          limit,
          offset,
        },
      },
    );

    const data = rows.map((row) => {
      const fullName = (row.name || "").trim();
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || "";
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

      return {
        id: row.id,
        firstName,
        lastName,
        email: row.email,
        phone: row.phone,
        departmentId: row.departmentId,
        designation: row.designation,
        salary: row.salary,
        status: row.status,
        joiningDate: row.joiningDate,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        department: row.department_id
          ? { id: row.department_id, name: row.department_name }
          : null,
      };
    });

    const total = Number(countRow.total || 0);

    return res.status(StatusCodes.OK).json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
});

export const updateEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const payload = req.body;

  const transaction = await sequelize.transaction();

  try {
    const employee = await Employee.findByPk(id, { transaction });
    if (!employee) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found.");
    }

    if (payload.departmentId) {
      const department = await Department.findByPk(payload.departmentId, {
        transaction,
      });
      if (!department) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Department not found.");
      }
    }

    await employee.update(payload, { transaction });
    await transaction.commit();

    const refreshed = await Employee.findByPk(id, {
      include: [
        { model: Department, as: "department", attributes: ["id", "name"] },
      ],
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: refreshed,
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
});

export const deleteEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findByPk(req.params.id);
  if (!employee) {
    return next(new ApiError(StatusCodes.NOT_FOUND, "Employee not found."));
  }
  await employee.destroy();
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Employee deleted.",
  });
});
