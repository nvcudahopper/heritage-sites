import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  // Step 1: Add columns one by one
  console.log("Adding role column...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'guest'`;
  console.log("OK");

  console.log("Adding password_hash column...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
  console.log("OK");

  console.log("Adding is_active column...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`;
  console.log("OK");

  console.log("Adding created_at column...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  console.log("OK");

  // Step 2: Update existing users
  console.log("Setting user 1 as admin...");
  await sql`UPDATE users SET role = 'admin', name = '管理员', nickname = '管理员' WHERE id = 1`;
  console.log("OK");

  console.log("Setting user 2 as regular user...");
  await sql`UPDATE users SET role = 'user' WHERE id = 2`;
  console.log("OK");

  // Verify
  const users = await sql`SELECT id, name, nickname, role, is_active FROM users`;
  console.log("Users after migration:", JSON.stringify(users, null, 2));
}

run().catch(e => { console.error(e); process.exit(1); });
