import { StatusCodes } from "http-status-codes";
import asyncHandler from "../utils/asyncHandler.js";
import { Department, User } from "../models/index.js";
import sequelize from "../config/database.js";

export const getDepartments = asyncHandler(async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "email", "role"],
        },
      ],
      order: [["name", "ASC"]],
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: departments,
    });
  } catch {
    const [departments] = await sequelize.query(
      "SELECT id, name FROM departments ORDER BY name ASC",
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: departments,
    });
  }
});
