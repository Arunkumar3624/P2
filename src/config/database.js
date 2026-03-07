import { Sequelize } from "sequelize";
import { env, isProd } from "./env.js";

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "mysql",
  logging: false,
  dialectOptions: isProd
    ? {
        ssl: { rejectUnauthorized: false }
      }
    : {}
});

export default sequelize;
