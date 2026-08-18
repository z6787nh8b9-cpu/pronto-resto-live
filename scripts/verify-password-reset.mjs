import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import mysql from "mysql2/promise";

const databaseUrl = new URL(process.env.DATABASE_URL);
const connection = await mysql.createConnection({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
});

const suffix = Date.now();
const email = `reset-verification-${suffix}@example.test`;
const secret = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(secret).digest("hex");
let ownerId = null;

try {
  const passwordHash = await bcrypt.hash("OriginalPassword2026", 10);
  const [ownerResult] = await connection.execute(
    "INSERT INTO restaurant_owners (email, name, provider, passwordHash, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, 'email', ?, NOW(), NOW(), NOW())",
    [email, "Reset verification", passwordHash],
  );
  ownerId = ownerResult.insertId;
  await connection.execute(
    "INSERT INTO password_reset_tokens (ownerId, tokenHash, expiresAt, createdAt) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW())",
    [ownerId, tokenHash],
  );

  const response = await fetch("http://127.0.0.1:3000/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: secret, newPassword: "RecoveredPassword2026" }),
  });
  if (!response.ok) throw new Error(`Reset endpoint returned ${response.status}`);

  const [owners] = await connection.execute("SELECT passwordHash FROM restaurant_owners WHERE id = ?", [ownerId]);
  const [tokens] = await connection.execute("SELECT usedAt FROM password_reset_tokens WHERE ownerId = ?", [ownerId]);
  if (!(await bcrypt.compare("RecoveredPassword2026", owners[0].passwordHash))) throw new Error("Password hash was not updated");
  if (!tokens[0].usedAt) throw new Error("Token was not marked as used");

  const secondResponse = await fetch("http://127.0.0.1:3000/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: secret, newPassword: "AnotherPassword2026" }),
  });
  if (secondResponse.status !== 400) throw new Error("Used token was unexpectedly accepted");
  console.log("Password reset integration verification passed");
} finally {
  if (ownerId) {
    await connection.execute("DELETE FROM password_reset_tokens WHERE ownerId = ?", [ownerId]);
    await connection.execute("DELETE FROM restaurant_owners WHERE id = ?", [ownerId]);
  }
  await connection.end();
  process.exit(0);
}
