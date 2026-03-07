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
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM("Admin", "Manager"),
      allowNull: false,
      defaultValue: "Manager"
    }
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    underscored: true,
    hooks: {
      async beforeCreate(user) {
        user.password = await bcrypt.hash(user.password, 12);
      },
      async beforeUpdate(user) {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  }
);

export default User;
