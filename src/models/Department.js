import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Department extends Model {}

Department.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "manager_id"
    }
  },
  {
    sequelize,
    modelName: "Department",
    tableName: "departments",
    underscored: true
  }
);

export default Department;
