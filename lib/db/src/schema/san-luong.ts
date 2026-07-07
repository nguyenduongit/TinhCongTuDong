import { pgTable, serial, integer, date, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { congDoanTable } from "./cong-doan";

export const sanLuongTable = pgTable("san_luong", {
  id: serial("id").primaryKey(),
  ngay: date("ngay", { mode: "string" }).notNull(),
  cong_doan_id: integer("cong_doan_id").notNull().references(() => congDoanTable.id, { onDelete: "restrict" }),
  so_luong: numeric("so_luong", { precision: 10, scale: 2 }).notNull(),
  thoi_gian: integer("thoi_gian").notNull(), // minutes
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSanLuongSchema = createInsertSchema(sanLuongTable).omit({ id: true, created_at: true });
export type InsertSanLuong = z.infer<typeof insertSanLuongSchema>;
export type SanLuong = typeof sanLuongTable.$inferSelect;
