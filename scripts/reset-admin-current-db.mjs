import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

dotenv.config();

const DB_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = "admin@ems.com";
const ADMIN_PASSWORD = "Admin@123";

if (!DB_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const conn = await mysql.createConnection(DB_URL);

const enumValues = (type) => {
  const m = /^enum\((.*)\)$/i.exec(type || "");
  if (!m) return [];
  return m[1]
    .split(",")
    .map((v) => v.trim().replace(/^'/, "").replace(/'$/, ""));
};

try {
  const [cols] = await conn.query("SHOW COLUMNS FROM users");
  const byName = new Map(cols.map((c) => [c.Field, c]));

  const roleCol = byName.get("role");
  const roles = enumValues(roleCol?.Type);
  const adminRole = roles.includes("Admin")
    ? "Admin"
    : roles.includes("admin")
      ? "admin"
      : roles[0] || "Manager";

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [existing] = await conn.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [ADMIN_EMAIL],
  );

  const hasCreatedAt = byName.has("created_at");
  const hasUpdatedAt = byName.has("updated_at");
  const hasCreatedAtCamel = byName.has("createdAt");
  const hasUpdatedAtCamel = byName.has("updatedAt");

  if (existing.length > 0) {
    const updates = ["password = ?", "role = ?"];
    const params = [passwordHash, adminRole];

    if (hasUpdatedAt) updates.push("updated_at = NOW()");
    if (hasUpdatedAtCamel) updates.push("updatedAt = NOW()");

    params.push(ADMIN_EMAIL);

    await conn.query(
      `UPDATE users SET ${updates.join(", ")} WHERE email = ?`,
      params,
    );
  } else {
    const fields = ["email", "password", "role"];
    const values = ["?", "?", "?"];
    const params = [ADMIN_EMAIL, passwordHash, adminRole];

    const idCol = byName.get("id");
    const idNeedsValue =
      idCol &&
      idCol.Null === "NO" &&
      !String(idCol.Extra || "").includes("auto_increment") &&
      (idCol.Default === null || idCol.Default === undefined);

    if (idNeedsValue) {
      if (String(idCol.Type || "").includes("char")) {
        fields.unshift("id");
        values.unshift("UUID()");
      }
    }

    if (hasCreatedAt) {
      fields.push("created_at");
      values.push("NOW()");
    }
    if (hasUpdatedAt) {
      fields.push("updated_at");
      values.push("NOW()");
    }
    if (hasCreatedAtCamel) {
      fields.push("createdAt");
      values.push("NOW()");
    }
    if (hasUpdatedAtCamel) {
      fields.push("updatedAt");
      values.push("NOW()");
    }

    await conn.query(
      `INSERT INTO users (${fields.join(",")}) VALUES (${values.join(",")})`,
      params,
    );
  }

  const [userRows] = await conn.query(
    "SELECT id, email, role FROM users WHERE email = ?",
    [ADMIN_EMAIL],
  );

  console.log(
    JSON.stringify(
      {
        database: DB_URL,
        email: ADMIN_EMAIL,
        roleUsed: adminRole,
        user: userRows[0] || null,
      },
      null,
      2,
    ),
  );
} finally {
  await conn.end();
}
