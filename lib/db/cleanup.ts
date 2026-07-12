import { eq } from "drizzle-orm";
import { db, sanLuongTable } from "./src/index";

async function main() {
  const all = await db.select().from(sanLuongTable);
  const map = new Map();
  const toDelete = [];

  for (const row of all) {
    const key = `${row.user_id}-${row.ngay}`;
    if (!map.has(key)) {
      map.set(key, row);
    } else {
      const existing = map.get(key);
      if (new Date(row.created_at) > new Date(existing.created_at)) {
        toDelete.push(existing.id);
        map.set(key, row);
      } else {
        toDelete.push(row.id);
      }
    }
  }

  if (toDelete.length > 0) {
    console.log(`Found ${toDelete.length} duplicates. Deleting...`);
    for (const id of toDelete) {
      await db.delete(sanLuongTable).where(eq(sanLuongTable.id, id));
      console.log(`Deleted id: ${id}`);
    }
  } else {
    console.log("No duplicates found.");
  }
  process.exit(0);
}

main().catch(console.error);
