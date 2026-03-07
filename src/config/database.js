import { Sequelize } from "sequelize";
import { env, isProd } from "./env.js";

const useSsl = env.dbSsl || isProd;

const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: env.dbPort,
  dialect: "mysql",
  logging: false,
  dialectOptions: useSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  retry: {
    max: 2,
  },
});

export default sequelize;
