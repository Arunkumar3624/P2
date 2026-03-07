import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Employee extends Model {}

Employee.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "department_id"
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false
    },
    salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("Active", "On-Leave", "Terminated"),
      allowNull: false,
      defaultValue: "Active"
    },
    joiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "joining_date"
    }
  },
  {
    sequelize,
    modelName: "Employee",
    tableName: "employees",
    underscored: true
  }
);

export default Employee;
