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
  try {
    const transaction = await sequelize.transaction();
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
  } catch {
    // Fallback for ems_db schema where employees use numeric id and camelCase columns.
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return next(
        new ApiError(StatusCodes.BAD_REQUEST, "Invalid employee id."),
      );
    }

    const [[existing]] = await sequelize.query(
      "SELECT id, name, departmentId FROM employees WHERE id = :id LIMIT 1",
      { replacements: { id: idNum } },
    );

    if (!existing) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "Employee not found."));
    }

    if (payload.departmentId) {
      const depIdNum = Number(payload.departmentId);
      const [[dep]] = await sequelize.query(
        "SELECT id FROM departments WHERE id = :id LIMIT 1",
        { replacements: { id: depIdNum } },
      );
      if (!dep) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Department not found."),
        );
      }
    }

    const fullName = (existing.name || "").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const currentFirst = nameParts[0] || "";
    const currentLast =
      nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    const nextFirst = payload.firstName ?? currentFirst;
    const nextLast = payload.lastName ?? currentLast;

    const updates = [];
    const replacements = { id: idNum };

    if (payload.firstName !== undefined || payload.lastName !== undefined) {
      updates.push("name = :name");
      replacements.name = `${nextFirst} ${nextLast}`.trim();
    }
    if (payload.email !== undefined) {
      updates.push("email = :email");
      replacements.email = payload.email;
    }
    if (payload.phone !== undefined) {
      updates.push("phone = :phone");
      replacements.phone = payload.phone;
    }
    if (payload.departmentId !== undefined) {
      updates.push("departmentId = :departmentId");
      replacements.departmentId = Number(payload.departmentId);
    }
    if (payload.designation !== undefined) {
      updates.push("designation = :designation");
      replacements.designation = payload.designation;
    }
    if (payload.salary !== undefined) {
      updates.push("salary = :salary");
      replacements.salary = Number(payload.salary);
    }
    if (payload.status !== undefined) {
      updates.push("status = :status");
      replacements.status = payload.status;
    }
    if (payload.joiningDate !== undefined) {
      updates.push("joiningDate = :joiningDate");
      replacements.joiningDate = payload.joiningDate;
    }

    if (updates.length > 0) {
      updates.push("updatedAt = NOW()");
      await sequelize.query(
        `UPDATE employees SET ${updates.join(", ")} WHERE id = :id`,
        { replacements },
      );
    }

    const [[row]] = await sequelize.query(
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
        WHERE e.id = :id
        LIMIT 1
      `,
      { replacements: { id: idNum } },
    );

    const refreshedName = (row?.name || "").trim();
    const refreshedParts = refreshedName.split(/\s+/).filter(Boolean);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        id: row.id,
        firstName: refreshedParts[0] || "",
        lastName:
          refreshedParts.length > 1 ? refreshedParts.slice(1).join(" ") : "",
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
      },
    });
  }
});

export const deleteEmployee = asyncHandler(async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "Employee not found."));
    }
    await employee.destroy();
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Employee deleted.",
    });
  } catch {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return next(
        new ApiError(StatusCodes.BAD_REQUEST, "Invalid employee id."),
      );
    }

    const [result] = await sequelize.query(
      "DELETE FROM employees WHERE id = :id",
      { replacements: { id: idNum } },
    );

    if (!result?.affectedRows) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "Employee not found."));
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Employee deleted.",
    });
  }
});
