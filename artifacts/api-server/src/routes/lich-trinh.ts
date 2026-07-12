import { Router, type IRouter } from "express";
import { eq, and, sql, between } from "drizzle-orm";
import { db, lichTrinhTable } from "@workspace/db";
import {
  UpsertLichTrinhBody,
  ListLichTrinhQueryParams,
  ListLichTrinhResponse,
  LichTrinhResponse,
  DeleteLichTrinhParams
} from "@workspace/api-zod";
import { requireAuth, AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

// Lấy danh sách lịch trình
router.get("/lich-trinh", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const query = ListLichTrinhQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { startDate, endDate } = query.data;
  
  const conditions = [eq(lichTrinhTable.user_id, req.user!.id)];
  
  if (startDate && endDate) {
    conditions.push(between(lichTrinhTable.ngay, startDate, endDate));
  } else if (startDate) {
    conditions.push(sql`${lichTrinhTable.ngay} >= ${startDate}`);
  } else if (endDate) {
    conditions.push(sql`${lichTrinhTable.ngay} <= ${endDate}`);
  }

  const rows = await db
    .select()
    .from(lichTrinhTable)
    .where(and(...conditions))
    .orderBy(lichTrinhTable.ngay);

  res.json(ListLichTrinhResponse.parse(rows));
});

// Thêm / Cập nhật lịch trình cho 1 ngày
router.put("/lich-trinh", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const body = UpsertLichTrinhBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body", details: body.error.message });
    return;
  }

  const data = body.data;

  // Xoá record cũ của ngày đó (nếu có)
  await db.delete(lichTrinhTable).where(
    and(
      eq(lichTrinhTable.user_id, req.user!.id),
      eq(lichTrinhTable.ngay, data.ngay)
    )
  );

  // Thêm mới
  const [inserted] = await db.insert(lichTrinhTable).values({
    ...data,
    user_id: req.user!.id
  }).returning();

  res.json(LichTrinhResponse.parse(inserted));
});

// Xoá lịch trình của 1 ngày
router.delete("/lich-trinh/:ngay", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteLichTrinhParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  await db.delete(lichTrinhTable).where(
    and(
      eq(lichTrinhTable.user_id, req.user!.id),
      eq(lichTrinhTable.ngay, params.data.ngay)
    )
  );

  res.status(200).json({ success: true });
});

export default router;
