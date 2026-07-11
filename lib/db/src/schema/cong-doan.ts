import { pgTable, text, serial, numeric, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const congDoanTable = pgTable("cong_doan", {
  id: serial("id").primaryKey(),
  ma_cong_doan: text("ma_cong_doan").notNull(),
  ten_cong_doan: text("ten_cong_doan").notNull(),
  dinh_muc: numeric("dinh_muc", { precision: 10, scale: 2 }).notNull(),
  quy_cach: text("quy_cach").notNull().default(""),
  order: bigint("order", { mode: "number" }).notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCongDoanSchema = createInsertSchema(congDoanTable).omit({ id: true, created_at: true, order: true });
export type InsertCongDoan = z.infer<typeof insertCongDoanSchema>;
export type CongDoan = typeof congDoanTable.$inferSelect;
