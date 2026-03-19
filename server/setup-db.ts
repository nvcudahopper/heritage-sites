import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = "postgresql://neondb_owner:npg_7xPlZCq5BkFY@ep-bold-glade-a1e0w900-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function runStatements(content: string, label: string) {
  // Remove comment-only lines
  const cleaned = content
    .split("\n")
    .map(line => line.startsWith("--") ? "" : line)
    .join("\n");
  
  // Split on semicolons followed by newline (to avoid splitting inside values)
  const stmts = cleaned
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  console.log(`${label}: ${stmts.length} statements`);
  
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i];
    // Remove trailing semicolon if present
    const cleanStmt = stmt.endsWith(";") ? stmt.slice(0, -1) : stmt;
    try {
      await sql.query(cleanStmt);
      const preview = cleanStmt.replace(/\n/g, " ").substring(0, 80);
      console.log(`  [${i+1}/${stmts.length}] OK: ${preview}...`);
    } catch (e: any) {
      const preview = cleanStmt.replace(/\n/g, " ").substring(0, 80);
      console.error(`  [${i+1}/${stmts.length}] FAIL: ${preview}...`);
      console.error(`    Error: ${e.message}`);
    }
  }
}

async function setup() {
  console.log("=== Setting up Heritage Sites Database ===\n");
  
  // Drop existing tables first to start fresh
  console.log("Dropping existing tables...");
  const drops = [
    "DROP TABLE IF EXISTS site_tags CASCADE",
    "DROP TABLE IF EXISTS checkin_photos CASCADE",
    "DROP TABLE IF EXISTS checkins CASCADE",
    "DROP TABLE IF EXISTS news_links CASCADE",
    "DROP TABLE IF EXISTS site_media CASCADE",
    "DROP TABLE IF EXISTS site_events CASCADE",
    "DROP TABLE IF EXISTS site_relations CASCADE",
    "DROP TABLE IF EXISTS sites CASCADE",
    "DROP TABLE IF EXISTS users CASCADE",
    "DROP TABLE IF EXISTS tags CASCADE",
  ];
  for (const d of drops) {
    await sql.query(d);
  }
  console.log("Done.\n");
  
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await runStatements(schema, "Schema");
  
  console.log("");
  const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf-8");
  await runStatements(seed, "Seed");
  
  // Verify
  console.log("\n=== Verification ===");
  const sites = await sql`SELECT id, name, type FROM sites ORDER BY id`;
  console.log(`Sites: ${sites.length}`);
  for (const s of sites) {
    console.log(`  [${s.id}] ${s.name} (${s.type})`);
  }

  const tags = await sql`SELECT COUNT(*) as count FROM tags`;
  console.log(`Tags: ${tags[0].count}`);
  const siteTags = await sql`SELECT COUNT(*) as count FROM site_tags`;
  console.log(`Site-Tag links: ${siteTags[0].count}`);
  const checkins = await sql`SELECT COUNT(*) as count FROM checkins`;
  console.log(`Checkins: ${checkins[0].count}`);
  const events = await sql`SELECT COUNT(*) as count FROM site_events`;
  console.log(`Events: ${events[0].count}`);
  const news = await sql`SELECT COUNT(*) as count FROM news_links`;
  console.log(`News: ${news[0].count}`);
  const rels = await sql`SELECT COUNT(*) as count FROM site_relations`;
  console.log(`Relations: ${rels[0].count}`);
  
  console.log("\nDone!");
}

setup().catch(console.error);
