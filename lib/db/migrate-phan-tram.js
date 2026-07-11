import { pgTable, serial, integer, date, numeric, timestamp } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool);

async function main() {
  try {
    await db.execute('ALTER TABLE san_luong ADD COLUMN IF NOT EXISTS phan_tram_dinh_muc INTEGER NOT NULL DEFAULT 100;');
    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

main();
