import { DataTypes, Model } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "../config/database.js";

class User extends Model {
  async comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("Admin", "Manager", "admin", "hr", "employee"),
      allowNull: false,
      defaultValue: "employee",
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    underscored: true,
    timestamps: false,
    hooks: {
      async beforeCreate(user) {
        user.password = await bcrypt.hash(user.password, 12);
      },
      async beforeUpdate(user) {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  },
);

export default User;
