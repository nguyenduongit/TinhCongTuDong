import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, sanLuongTable, congDoanTable } from "@workspace/db";
import {
  CreateSanLuongBody,
  UpdateSanLuongBody,
  UpdateSanLuongParams,
  DeleteSanLuongParams,
  ListSanLuongQueryParams,
  ListSanLuongResponse,
  CreateSanLuongResponse,
  UpdateSanLuongResponse,
  GetSanLuongTodayResponse,
  GetSanLuongStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatRow(sl: typeof sanLuongTable.$inferSelect & { cong_doan?: typeof congDoanTable.$inferSelect | null }) {
  return {
    ...sl,
    so_luong: Number(sl.so_luong),
    created_at: sl.created_at.toISOString(),
    cong_doan: sl.cong_doan
      ? {
          ...sl.cong_doan,
          dinh_muc: Number(sl.cong_doan.dinh_muc),
          created_at: sl.cong_doan.created_at.toISOString(),
        }
      : undefined,
  };
}

router.get("/san-luong/today", async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db
    .select({
      id: sanLuongTable.id,
      ngay: sanLuongTable.ngay,
      cong_doan_id: sanLuongTable.cong_doan_id,
      so_luong: sanLuongTable.so_luong,
      thoi_gian: sanLuongTable.thoi_gian,
      created_at: sanLuongTable.created_at,
      cong_doan: congDoanTable,
    })
    .from(sanLuongTable)
    .leftJoin(congDoanTable, eq(sanLuongTable.cong_doan_id, congDoanTable.id))
    .where(eq(sanLuongTable.ngay, today))
    .orderBy(sanLuongTable.created_at);

  res.json(GetSanLuongTodayResponse.parse(rows.map(formatRow)));
});

router.get("/san-luong/stats", async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [todayStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total_time: sql<number>`coalesce(sum(${sanLuongTable.thoi_gian}), 0)::int`,
      total_sl: sql<number>`coalesce(sum(${sanLuongTable.so_luong}::numeric), 0)::float`,
    })
    .from(sanLuongTable)
    .where(eq(sanLuongTable.ngay, today));

  const [monthStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total_time: sql<number>`coalesce(sum(${sanLuongTable.thoi_gian}), 0)::int`,
      total_sl: sql<number>`coalesce(sum(${sanLuongTable.so_luong}::numeric), 0)::float`,
    })
    .from(sanLuongTable)
    .where(sql`${sanLuongTable.ngay} >= ${monthStart}`);

  res.json(
    GetSanLuongStatsResponse.parse({
      today_count: todayStats?.count ?? 0,
      today_total_time: todayStats?.total_time ?? 0,
      today_total_sl: todayStats?.total_sl ?? 0,
      month_count: monthStats?.count ?? 0,
      month_total_time: monthStats?.total_time ?? 0,
      month_total_sl: monthStats?.total_sl ?? 0,
    })
  );
});

router.get("/san-luong", async (req, res): Promise<void> => {
  const queryParsed = ListSanLuongQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  const conditions = queryParsed.data.ngay
    ? [eq(sanLuongTable.ngay, queryParsed.data.ngay)]
    : [];

  const rows = await db
    .select({
      id: sanLuongTable.id,
      ngay: sanLuongTable.ngay,
      cong_doan_id: sanLuongTable.cong_doan_id,
      so_luong: sanLuongTable.so_luong,
      thoi_gian: sanLuongTable.thoi_gian,
      created_at: sanLuongTable.created_at,
      cong_doan: congDoanTable,
    })
    .from(sanLuongTable)
    .leftJoin(congDoanTable, eq(sanLuongTable.cong_doan_id, congDoanTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sanLuongTable.ngay, sanLuongTable.created_at);

  res.json(ListSanLuongResponse.parse(rows.map(formatRow)));
});

router.post("/san-luong", async (req, res): Promise<void> => {
  const parsed = CreateSanLuongBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(sanLuongTable)
    .values({
      ngay: parsed.data.ngay,
      cong_doan_id: parsed.data.cong_doan_id,
      so_luong: String(parsed.data.so_luong),
      thoi_gian: parsed.data.thoi_gian,
    })
    .returning();

  const [joined] = await db
    .select({
      id: sanLuongTable.id,
      ngay: sanLuongTable.ngay,
      cong_doan_id: sanLuongTable.cong_doan_id,
      so_luong: sanLuongTable.so_luong,
      thoi_gian: sanLuongTable.thoi_gian,
      created_at: sanLuongTable.created_at,
      cong_doan: congDoanTable,
    })
    .from(sanLuongTable)
    .leftJoin(congDoanTable, eq(sanLuongTable.cong_doan_id, congDoanTable.id))
    .where(eq(sanLuongTable.id, row.id));

  res.status(201).json(CreateSanLuongResponse.parse(formatRow(joined)));
});

router.patch("/san-luong/:id", async (req, res): Promise<void> => {
  const params = UpdateSanLuongParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSanLuongBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.so_luong !== undefined) updateData.so_luong = String(parsed.data.so_luong);
  if (parsed.data.thoi_gian !== undefined) updateData.thoi_gian = parsed.data.thoi_gian;

  const [updated] = await db
    .update(sanLuongTable)
    .set(updateData)
    .where(eq(sanLuongTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Không tìm thấy bản ghi" });
    return;
  }

  const [joined] = await db
    .select({
      id: sanLuongTable.id,
      ngay: sanLuongTable.ngay,
      cong_doan_id: sanLuongTable.cong_doan_id,
      so_luong: sanLuongTable.so_luong,
      thoi_gian: sanLuongTable.thoi_gian,
      created_at: sanLuongTable.created_at,
      cong_doan: congDoanTable,
    })
    .from(sanLuongTable)
    .leftJoin(congDoanTable, eq(sanLuongTable.cong_doan_id, congDoanTable.id))
    .where(eq(sanLuongTable.id, updated.id));

  res.json(UpdateSanLuongResponse.parse(formatRow(joined)));
});

router.delete("/san-luong/:id", async (req, res): Promise<void> => {
  const params = DeleteSanLuongParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(sanLuongTable)
    .where(eq(sanLuongTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Không tìm thấy bản ghi" });
    return;
  }

  res.sendStatus(204);
});

export default router;
