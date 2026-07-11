import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'san_luong' ORDER BY ordinal_position");
  console.log("Columns:", JSON.stringify(res.rows, null, 2));
  
  const data = await pool.query("SELECT * FROM san_luong LIMIT 5");
  console.log("Sample data:", JSON.stringify(data.rows, null, 2));
  
  const count = await pool.query("SELECT count(*) FROM san_luong");
  console.log("Total rows:", count.rows[0].count);
  
  pool.end();
}

main();
