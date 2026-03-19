import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

const sql = neon(process.env.DATABASE_URL);

// Simple SHA-256 hash (sufficient for this use case, no external bcrypt dependency needed)
function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function run() {
  // Set admin email and password
  const email = "nvcudahopper@gmail.com";
  const password = "admin123"; // Default password - user should change this
  const hash = hashPassword(password);

  await sql`UPDATE users SET email = ${email}, password_hash = ${hash} WHERE id = 1`;
  console.log("Admin account updated:");
  console.log("  Email:", email);
  console.log("  Default password: admin123");
  console.log("  (Please change this after first login)");
  
  const user = await sql`SELECT id, name, nickname, email, role FROM users WHERE id = 1`;
  console.log("  User:", JSON.stringify(user[0]));
}

run().catch(e => { console.error(e); process.exit(1); });
