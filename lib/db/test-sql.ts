import { db } from "./src/index";
import { sanLuongTable } from "./src/schema/san-luong";
import { sql } from "drizzle-orm";

async function main() {
  const [stats] = await db.select({
    total_sl: sql<number>`coalesce(sum(coalesce((${sanLuongTable.thong_ke_ngay}->>'tong_cong_sp')::numeric, 0) + coalesce((${sanLuongTable.thong_ke_ngay}->>'tong_cong_ho_tro')::numeric, 0)), 0)::float`
  }).from(sanLuongTable);
  console.log(stats);
  process.exit(0);
}
main();
