import { pgTable, text, serial, numeric, timestamp, bigint, integer, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const congDoanTable = pgTable("cong_doan", {
  id: serial("id").primaryKey(),
  ma_cong_doan: text("ma_cong_doan").notNull(),
  ten_cong_doan: text("ten_cong_doan").notNull(),
  dinh_muc: numeric("dinh_muc", { precision: 10, scale: 2 }).notNull(),
  quy_cach: text("quy_cach").notNull().default(""),
  order: bigint("order", { mode: "number" }).notNull().default(0),
  user_id: integer("user_id").notNull().references(() => usersTable.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    userIdIdx: index("cong_doan_user_id_idx").on(table.user_id),
  };
});

export const insertCongDoanSchema = createInsertSchema(congDoanTable).omit({ id: true, created_at: true, updated_at: true, order: true });
export type InsertCongDoan = z.infer<typeof insertCongDoanSchema>;
export type CongDoan = typeof congDoanTable.$inferSelect;
