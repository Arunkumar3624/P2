import sequelize from "../config/database.js";
import User from "./User.js";
import Department from "./Department.js";
import Employee from "./Employee.js";

Department.belongsTo(User, {
  foreignKey: "managerId",
  as: "manager"
});

User.hasMany(Department, {
  foreignKey: "managerId",
  as: "managedDepartments"
});

Department.hasMany(Employee, {
  foreignKey: "departmentId",
  as: "employees"
});

Employee.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department"
});

export { sequelize, User, Department, Employee };
