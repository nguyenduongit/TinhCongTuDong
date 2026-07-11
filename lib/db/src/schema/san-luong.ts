import { pgTable, serial, integer, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sanLuongTable = pgTable("san_luong", {
  id: serial("id").primaryKey(),
  ngay: date("ngay", { mode: "string" }).notNull(),
  chi_tiet: jsonb("chi_tiet").notNull().$type<{
    cong_doan: string;
    so_luong: number;
    phan_tram_dinh_muc: number;
    cong_sp?: number;
  }[]>(),
  thong_ke_ngay: jsonb("thong_ke_ngay").$type<{
    cong_nhat: number;
    tong_cong_sp: number;
    tong_cong_ho_tro?: number;
    chi_tiet_cong?: Record<string, number>;
  }>(),
  thoi_gian_thuc_hien: integer("thoi_gian_thuc_hien").notNull(), // minutes
  thoi_gian_ho_tro: integer("thoi_gian_ho_tro").default(0), // minutes
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSanLuongSchema = createInsertSchema(sanLuongTable).omit({ id: true, created_at: true });
export type InsertSanLuong = z.infer<typeof insertSanLuongSchema>;
export type SanLuong = typeof sanLuongTable.$inferSelect;
