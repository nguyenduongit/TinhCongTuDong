import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
// Node 22 supports --env-file directly

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool);

async function main() {
  try {
    console.log("Starting migration to new san_luong structure...");
    
    // Step 1: Add new columns
    console.log("Adding new columns...");
    await db.execute(`
      ALTER TABLE san_luong 
      ADD COLUMN IF NOT EXISTS chi_tiet JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS thoi_gian_thuc_hien INTEGER NOT NULL DEFAULT 0;
    `);
    console.log("New columns added");
    
    // Step 2: Migrate existing data
    console.log("Migrating existing data...");
    const result = await db.execute(`
      WITH grouped_data AS (
        SELECT 
          s.ngay,
          jsonb_agg(
            jsonb_build_object(
              'cong_doan', c.ma_cong_doan,
              'so_luong', s.so_luong,
              'phan_tram_dinh_muc', s.phan_tram_dinh_muc
            )
          ) as chi_tiet,
          SUM(s.thoi_gian) as total_time
        FROM san_luong s
        LEFT JOIN cong_doan c ON c.id = s.cong_doan_id
        GROUP BY s.ngay
      )
      UPDATE san_luong s
      SET chi_tiet = g.chi_tiet,
          thoi_gian_thuc_hien = g.total_time
      FROM grouped_data g
      WHERE s.ngay = g.ngay
      AND s.id = (
        SELECT id FROM san_luong s2 
        WHERE s2.ngay = s.ngay 
        ORDER BY s2.created_at ASC 
        LIMIT 1
      );
    `);
    console.log("Data migrated");
    
    // Step 3: Delete duplicate records (keep only one per day)
    console.log("Removing duplicate records...");
    await db.execute(`
      DELETE FROM san_luong s1
      WHERE s1.id NOT IN (
        SELECT MIN(s2.id)
        FROM san_luong s2
        GROUP BY s2.ngay
      );
    `);
    console.log("Duplicate records removed");
    
    // Step 4: Remove old columns
    console.log("Removing old columns...");
    await db.execute(`
      ALTER TABLE san_luong 
      DROP COLUMN IF EXISTS cong_doan_id,
      DROP COLUMN IF EXISTS so_luong,
      DROP COLUMN IF EXISTS thoi_gian,
      DROP COLUMN IF EXISTS phan_tram_dinh_muc;
    `);
    console.log("Old columns removed");
    
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    pool.end();
  }
}

main();
