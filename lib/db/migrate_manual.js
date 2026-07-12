import pkg from 'pg';
const { Client } = pkg;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  await client.connect();

  const sql = `
ALTER TABLE "san_luong" ADD CONSTRAINT "san_luong_ngay_user_id_unique" UNIQUE("ngay","user_id");
CREATE INDEX IF NOT EXISTS "cong_doan_user_id_idx" ON "cong_doan" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "san_luong_ngay_idx" ON "san_luong" USING btree ("ngay");
CREATE INDEX IF NOT EXISTS "san_luong_user_id_idx" ON "san_luong" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "lich_trinh_user_id_ngay_idx" ON "lich_trinh" USING btree ("user_id","ngay");
  `;

  try {
    await client.query(sql);
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

main();
