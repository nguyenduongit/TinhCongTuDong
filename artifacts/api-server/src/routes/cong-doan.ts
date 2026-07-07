import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, congDoanTable } from "@workspace/db";
import {
  CreateCongDoanBody,
  UpdateCongDoanBody,
  UpdateCongDoanParams,
  DeleteCongDoanParams,
  ListCongDoanResponse,
  CreateCongDoanResponse,
  UpdateCongDoanResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/cong-doan", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(congDoanTable)
    .orderBy(congDoanTable.ma_cong_doan);

  const items = rows.map((r) => ({
    ...r,
    dinh_muc: Number(r.dinh_muc),
    created_at: r.created_at.toISOString(),
  }));

  res.json(ListCongDoanResponse.parse(items));
});

router.post("/cong-doan", async (req, res): Promise<void> => {
  const parsed = CreateCongDoanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(congDoanTable)
    .values({
      ma_cong_doan: parsed.data.ma_cong_doan,
      ten_cong_doan: parsed.data.ten_cong_doan,
      dinh_muc: String(parsed.data.dinh_muc),
      quy_cach: parsed.data.quy_cach,
    })
    .returning();

  res.status(201).json(
    CreateCongDoanResponse.parse({
      ...row,
      dinh_muc: Number(row.dinh_muc),
      created_at: row.created_at.toISOString(),
    })
  );
});

router.patch("/cong-doan/:id", async (req, res): Promise<void> => {
  const params = UpdateCongDoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCongDoanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.ma_cong_doan !== undefined) updateData.ma_cong_doan = parsed.data.ma_cong_doan;
  if (parsed.data.ten_cong_doan !== undefined) updateData.ten_cong_doan = parsed.data.ten_cong_doan;
  if (parsed.data.dinh_muc !== undefined) updateData.dinh_muc = String(parsed.data.dinh_muc);
  if (parsed.data.quy_cach !== undefined) updateData.quy_cach = parsed.data.quy_cach;

  const [row] = await db
    .update(congDoanTable)
    .set(updateData)
    .where(eq(congDoanTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Không tìm thấy công đoạn" });
    return;
  }

  res.json(
    UpdateCongDoanResponse.parse({
      ...row,
      dinh_muc: Number(row.dinh_muc),
      created_at: row.created_at.toISOString(),
    })
  );
});

router.delete("/cong-doan/:id", async (req, res): Promise<void> => {
  const params = DeleteCongDoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(congDoanTable)
    .where(eq(congDoanTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Không tìm thấy công đoạn" });
    return;
  }

  res.sendStatus(204);
});

export default router;
