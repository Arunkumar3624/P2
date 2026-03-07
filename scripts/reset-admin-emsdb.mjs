import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const DB_URL = "mysql://root:1234@localhost:3306/ems_db";
const ADMIN_EMAIL = "admin@ems.com";
const ADMIN_PASSWORD = "Admin@123";

const conn = await mysql.createConnection(DB_URL);

try {
  const [cols] = await conn.query("SHOW COLUMNS FROM users");
  const names = new Set(cols.map((c) => c.Field));

  if (!names.has("created_at")) {
    await conn.query("ALTER TABLE users ADD COLUMN created_at DATETIME NULL");
  }

  if (!names.has("updated_at")) {
    await conn.query("ALTER TABLE users ADD COLUMN updated_at DATETIME NULL");
  }

  const roleCol = cols.find((c) => c.Field === "role");
  const roleType = roleCol?.Type || "";
  // Prefer an admin-like role that already exists in current enum definition.
  const adminRole = roleType.includes("'admin'")
    ? "admin"
    : roleType.includes("'Admin'")
      ? "Admin"
      : roleType.includes("'Manager'")
        ? "Manager"
        : "employee";

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [existing] = await conn.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [ADMIN_EMAIL],
  );

  if (existing.length > 0) {
    await conn.query(
      "UPDATE users SET password = ?, role = ?, updated_at = NOW() WHERE email = ?",
      [passwordHash, adminRole, ADMIN_EMAIL],
    );
  } else {
    await conn.query(
      "INSERT INTO users (email, password, role, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [ADMIN_EMAIL, passwordHash, adminRole],
    );
  }

  const [userRows] = await conn.query(
    "SELECT id, email, role, created_at, updated_at FROM users WHERE email = ?",
    [ADMIN_EMAIL],
  );

  console.log(JSON.stringify(userRows, null, 2));
} finally {
  await conn.end();
}
