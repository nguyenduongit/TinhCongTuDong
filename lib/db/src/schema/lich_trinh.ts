import { pgTable, serial, integer, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const lichTrinhTable = pgTable("lich_trinh", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => usersTable.id),
  ngay: date("ngay").notNull(), // 'YYYY-MM-DD'
  loai: text("loai", { enum: ['tang_ca', 'nghi_phep'] }).notNull(),
  so_phut: integer("so_phut").notNull(), // Phút làm thêm hoặc phút nghỉ
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    userIdNgayIdx: index("lich_trinh_user_id_ngay_idx").on(table.user_id, table.ngay),
  };
});

export const insertLichTrinhSchema = createInsertSchema(lichTrinhTable).omit({ 
  id: true, 
  created_at: true,
  updated_at: true,
  user_id: true, // Will be set by backend
});
export type InsertLichTrinh = z.infer<typeof insertLichTrinhSchema>;
export type LichTrinh = typeof lichTrinhTable.$inferSelect;
