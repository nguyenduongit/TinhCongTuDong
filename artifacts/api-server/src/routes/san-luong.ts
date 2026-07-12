import { Router, type IRouter } from "express";
import { eq, sql, and, inArray } from "drizzle-orm";
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
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { truncate3, computeCongSp, computeCongNhat, computeCongHoTro } from "@workspace/business-logic";

const router: IRouter = Router();

/** Trả về ngày hôm nay theo múi giờ Việt Nam (Asia/Ho_Chi_Minh) dạng yyyy-MM-dd */
function getTodayVN(): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("/")
    .reverse()
    .join("-"); // "dd/mm/yyyy" → "yyyy-mm-dd"
}

function formatRow(sl: typeof sanLuongTable.$inferSelect) {
  return {
    ...sl,
    chi_tiet: sl.chi_tiet as any,
    thong_ke_ngay: sl.thong_ke_ngay as any,
    thoi_gian_thuc_hien: Number(sl.thoi_gian_thuc_hien),
    thoi_gian_ho_tro: Number(sl.thoi_gian_ho_tro || 0),
    created_at: sl.created_at.toISOString(),
  };
}

router.get("/san-luong/today", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const today = getTodayVN();

  const rows = await db
    .select({
      id: sanLuongTable.id,
      ngay: sanLuongTable.ngay,
      chi_tiet: sanLuongTable.chi_tiet,
      thong_ke_ngay: sanLuongTable.thong_ke_ngay,
      thoi_gian_thuc_hien: sanLuongTable.thoi_gian_thuc_hien,
      thoi_gian_ho_tro: sanLuongTable.thoi_gian_ho_tro,
      user_id: sanLuongTable.user_id,
      created_at: sanLuongTable.created_at,
    })
    .from(sanLuongTable)
    .where(and(eq(sanLuongTable.ngay, today), eq(sanLuongTable.user_id, req.user!.id)))
    .orderBy(sanLuongTable.created_at);

  res.json(GetSanLuongTodayResponse.parse(rows.map(formatRow)));
});

router.get("/san-luong/stats", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const today = getTodayVN();
  const [yearStr, monthStr, dayStr] = today.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  const d = parseInt(dayStr, 10);
  
  let cycleMonth = m;
  let cycleYear = y;
  if (d > 20) {
    cycleMonth = m + 1;
    if (cycleMonth > 12) {
      cycleMonth = 1;
      cycleYear++;
    }
  }
  
  let prevMonth = cycleMonth - 1;
  let prevYear = cycleYear;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }

  const cycleStartStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-21`;
  const cycleEndStr = `${cycleYear}-${cycleMonth.toString().padStart(2, '0')}-20`;

  const now = new Date();
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  vnTime.setUTCHours(0, 0, 0, 0);
  const dayOfWeek = vnTime.getUTCDay();
  const weekStart = new Date(vnTime);
  weekStart.setUTCDate(vnTime.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const minStartStr = cycleStartStr < weekStartStr ? cycleStartStr : weekStartStr;
  const maxEndStr = cycleEndStr > today ? cycleEndStr : today;

  const [stats] = await db
    .select({
      today_count: sql<number>`sum(case when ${sanLuongTable.ngay} = ${today} then 1 else 0 end)::int`,
      today_time: sql<number>`coalesce(sum(case when ${sanLuongTable.ngay} = ${today} then ${sanLuongTable.thoi_gian_thuc_hien} + coalesce(${sanLuongTable.thoi_gian_ho_tro}, 0) else 0 end), 0)::int`,
      today_sl: sql<number>`coalesce(sum(case when ${sanLuongTable.ngay} = ${today} then coalesce((${sanLuongTable.thong_ke_ngay}->>'tong_cong_sp')::numeric, 0) + coalesce((${sanLuongTable.thong_ke_ngay}->>'tong_cong_ho_tro')::numeric, 0) else 0 end), 0)::float`,

      month_count: sql<number>`sum(case when ${sanLuongTable.ngay} >= ${cycleStartStr} AND ${sanLuongTable.ngay} <= ${cycleEndStr} then 1 else 0 end)::int`,
      month_time: sql<number>`coalesce(sum(case when ${sanLuongTable.ngay} >= ${cycleStartStr} AND ${sanLuongTable.ngay} <= ${cycleEndStr} then ${sanLuongTable.thoi_gian_thuc_hien} + coalesce(${sanLuongTable.thoi_gian_ho_tro}, 0) else 0 end), 0)::int`,
      month_sl: sql<number>`coalesce(sum(case when ${sanLuongTable.ngay} >= ${cycleStartStr} AND ${sanLuongTable.ngay} <= ${cycleEndStr} then coalesce((${sanLuongTable.thong_ke_ngay}->>'tong_cong_sp')::numeric, 0) + coalesce((${sanLuongTable.thong_ke_ngay}->>'tong_cong_ho_tro')::numeric, 0) else 0 end), 0)::float`,

      week_count: sql<number>`sum(case when ${sanLuongTable.ngay} >= ${weekStartStr} then 1 else 0 end)::int`,
      week_time: sql<number>`coalesce(sum(case when ${sanLuongTable.ngay} >= ${weekStartStr} then ${sanLuongTable.thoi_gian_thuc_hien} + coalesce(${sanLuongTable.thoi_gian_ho_tro}, 0) else 0 end), 0)::int`,
      week_sl: sql<number>`coalesce(sum(case when ${sanLuongTable.ngay} >= ${weekStartStr} then coalesce((${sanLuongTable.thong_ke_ngay}->>'tong_cong_sp')::numeric, 0) + coalesce((${sanLuongTable.thong_ke_ngay}->>'tong_cong_ho_tro')::numeric, 0) else 0 end), 0)::float`,
    })
    .from(sanLuongTable)
    .where(and(
      eq(sanLuongTable.user_id, req.user!.id),
      sql`${sanLuongTable.ngay} >= ${minStartStr} AND ${sanLuongTable.ngay} <= ${maxEndStr}`
    ));

  res.json(
    GetSanLuongStatsResponse.parse({
      today_count: stats?.today_count ?? 0,
      today_total_time: stats?.today_time ?? 0,
      today_total_sl: stats?.today_sl ?? 0,
      month_count: stats?.month_count ?? 0,
      month_total_time: stats?.month_time ?? 0,
      month_total_sl: stats?.month_sl ?? 0,
      week_count: stats?.week_count ?? 0,
      week_total_time: stats?.week_time ?? 0,
      week_total_sl: stats?.week_sl ?? 0,
    })
  );
});

router.get("/san-luong", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const queryParsed = ListSanLuongQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  const conditions = [];
  conditions.push(eq(sanLuongTable.user_id, req.user!.id));

  if (queryParsed.data.ngay) {
    conditions.push(eq(sanLuongTable.ngay, queryParsed.data.ngay));
  } else {
    if (queryParsed.data.startDate) {
      conditions.push(sql`${sanLuongTable.ngay} >= ${queryParsed.data.startDate}`);
    }
    if (queryParsed.data.endDate) {
      conditions.push(sql`${sanLuongTable.ngay} <= ${queryParsed.data.endDate}`);
    }
  }

  const rows = await db
    .select({
      id: sanLuongTable.id,
      ngay: sanLuongTable.ngay,
      chi_tiet: sanLuongTable.chi_tiet,
      thong_ke_ngay: sanLuongTable.thong_ke_ngay,
      thoi_gian_thuc_hien: sanLuongTable.thoi_gian_thuc_hien,
      thoi_gian_ho_tro: sanLuongTable.thoi_gian_ho_tro,
      user_id: sanLuongTable.user_id,
      created_at: sanLuongTable.created_at,
    })
    .from(sanLuongTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sanLuongTable.ngay, sanLuongTable.created_at);

  res.json(ListSanLuongResponse.parse(rows.map(formatRow)));
});

router.post("/san-luong", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateSanLuongBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(sanLuongTable).where(and(eq(sanLuongTable.ngay, parsed.data.ngay), eq(sanLuongTable.user_id, req.user!.id)));
  if (existing.length > 0) {
    res.status(400).json({ error: "Ngày này đã có sản lượng. Vui lòng thêm công đoạn vào dữ liệu có sẵn của ngày này." });
    return;
  }

  const uniqueCongDoan = new Set(parsed.data.chi_tiet.map(ct => ct.cong_doan));
  if (uniqueCongDoan.size !== parsed.data.chi_tiet.length) {
    res.status(400).json({ error: "Không được phép nhập trùng mã công đoạn trong cùng một ngày. Vui lòng gộp chung số lượng lại." });
    return;
  }

  const allCongDoan = await db.select().from(congDoanTable).where(eq(congDoanTable.user_id, req.user!.id));
  
  const chi_tiet_computed = parsed.data.chi_tiet.map(ct => {
    const cd = allCongDoan.find(c => c.ma_cong_doan === ct.cong_doan);
    const dinh_muc = cd ? Number(cd.dinh_muc) : 1;
    const cong_sp = computeCongSp(ct.so_luong, dinh_muc, ct.phan_tram_dinh_muc, ct.cong_doan.startsWith('9'));
    return { ...ct, cong_sp };
  });

  let tong_cong_sp = chi_tiet_computed.reduce((sum, ct) => sum + ct.cong_sp, 0);
  tong_cong_sp = truncate3(tong_cong_sp);
  const cong_nhat = computeCongNhat(parsed.data.thoi_gian_thuc_hien, parsed.data.thoi_gian_ho_tro ?? 0);
  const tong_cong_ho_tro = computeCongHoTro(parsed.data.thoi_gian_ho_tro ?? 0);
  
  const chi_tiet_cong: Record<string, number> = {};
  chi_tiet_computed.forEach(ct => {
    if (chi_tiet_cong[ct.cong_doan] === undefined) chi_tiet_cong[ct.cong_doan] = 0;
    chi_tiet_cong[ct.cong_doan] += ct.cong_sp;
  });
  
  Object.keys(chi_tiet_cong).forEach(key => {
    chi_tiet_cong[key] = truncate3(chi_tiet_cong[key]);
  });

  const [row] = await db
    .insert(sanLuongTable)
    .values({
      ngay: parsed.data.ngay,
      chi_tiet: chi_tiet_computed as any,
      thong_ke_ngay: { tong_cong_sp, cong_nhat, tong_cong_ho_tro, chi_tiet_cong },
      thoi_gian_thuc_hien: parsed.data.thoi_gian_thuc_hien,
      thoi_gian_ho_tro: parsed.data.thoi_gian_ho_tro ?? 0,
      user_id: req.user!.id,
    })
    .returning();

  const congDoanMAs = chi_tiet_computed.map(ct => ct.cong_doan);
  if (congDoanMAs.length > 0) {
    await db.update(congDoanTable)
      .set({ order: Date.now() })
      .where(and(inArray(congDoanTable.ma_cong_doan, congDoanMAs), eq(congDoanTable.user_id, req.user!.id)));
  }

  res.status(201).json(CreateSanLuongResponse.parse(formatRow(row)));
});

router.patch("/san-luong/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
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
  
  let chi_tiet_computed = undefined;
  let tong_cong_sp = 0;
  
  if (parsed.data.chi_tiet !== undefined) {
    const uniqueCongDoan = new Set(parsed.data.chi_tiet.map(ct => ct.cong_doan));
    if (uniqueCongDoan.size !== parsed.data.chi_tiet.length) {
      res.status(400).json({ error: "Không được phép nhập trùng mã công đoạn trong cùng một ngày. Vui lòng gộp chung số lượng lại." });
      return;
    }

    const allCongDoan = await db.select().from(congDoanTable).where(eq(congDoanTable.user_id, req.user!.id));
    chi_tiet_computed = parsed.data.chi_tiet.map(ct => {
      const cd = allCongDoan.find(c => c.ma_cong_doan === ct.cong_doan);
      const dinh_muc = cd ? Number(cd.dinh_muc) : 1;
      const cong_sp = computeCongSp(ct.so_luong, dinh_muc, ct.phan_tram_dinh_muc, ct.cong_doan.startsWith('9'));
      return { ...ct, cong_sp };
    });
    tong_cong_sp = chi_tiet_computed.reduce((sum, ct) => sum + ct.cong_sp, 0);
    updateData.chi_tiet = chi_tiet_computed as any;
  }
  if (parsed.data.thoi_gian_thuc_hien !== undefined) {
    updateData.thoi_gian_thuc_hien = parsed.data.thoi_gian_thuc_hien;
  }
  if (parsed.data.thoi_gian_ho_tro !== undefined) {
    updateData.thoi_gian_ho_tro = parsed.data.thoi_gian_ho_tro;
  }

  // Need to compute thong_ke_ngay if either chi_tiet or thoi_gian_thuc_hien changed
  if (chi_tiet_computed !== undefined || parsed.data.thoi_gian_thuc_hien !== undefined || parsed.data.thoi_gian_ho_tro !== undefined) {
    const existing = await db.select().from(sanLuongTable).where(and(eq(sanLuongTable.id, params.data.id), eq(sanLuongTable.user_id, req.user!.id)));
    if (existing[0]) {
      let finalTongCongSp = chi_tiet_computed !== undefined ? tong_cong_sp : (existing[0].thong_ke_ngay as any)?.tong_cong_sp ?? 0;
      finalTongCongSp = truncate3(finalTongCongSp);
      
      let finalChiTietCong = (existing[0].thong_ke_ngay as any)?.chi_tiet_cong ?? {};
      if (chi_tiet_computed !== undefined) {
        finalChiTietCong = {};
        chi_tiet_computed.forEach(ct => {
          if (finalChiTietCong[ct.cong_doan] === undefined) finalChiTietCong[ct.cong_doan] = 0;
          finalChiTietCong[ct.cong_doan] += ct.cong_sp;
        });
      }
      Object.keys(finalChiTietCong).forEach(key => {
        finalChiTietCong[key] = truncate3(finalChiTietCong[key]);
      });

      const finalThoiGian = parsed.data.thoi_gian_thuc_hien !== undefined ? parsed.data.thoi_gian_thuc_hien : existing[0].thoi_gian_thuc_hien;
      const finalThoiGianHoTro = parsed.data.thoi_gian_ho_tro !== undefined ? parsed.data.thoi_gian_ho_tro : (existing[0].thoi_gian_ho_tro ?? 0);
      const finalCongNhat = computeCongNhat(finalThoiGian, finalThoiGianHoTro);
      const finalTongCongHoTro = computeCongHoTro(finalThoiGianHoTro);
      
      updateData.thong_ke_ngay = { 
        tong_cong_sp: finalTongCongSp, 
        cong_nhat: finalCongNhat, 
        tong_cong_ho_tro: finalTongCongHoTro,
        chi_tiet_cong: finalChiTietCong
      };
    }
  }

  const [updated] = await db
    .update(sanLuongTable)
    .set(updateData)
    .where(and(eq(sanLuongTable.id, params.data.id), eq(sanLuongTable.user_id, req.user!.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Không tìm thấy bản ghi" });
    return;
  }

  if (chi_tiet_computed !== undefined) {
    const congDoanMAs = chi_tiet_computed.map(ct => ct.cong_doan);
    if (congDoanMAs.length > 0) {
      await db.update(congDoanTable)
        .set({ order: Date.now() })
        .where(and(inArray(congDoanTable.ma_cong_doan, congDoanMAs), eq(congDoanTable.user_id, req.user!.id)));
    }
  }

  res.json(UpdateSanLuongResponse.parse(formatRow(updated)));
});

router.delete("/san-luong/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteSanLuongParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(sanLuongTable)
    .where(and(eq(sanLuongTable.id, params.data.id), eq(sanLuongTable.user_id, req.user!.id)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Không tìm thấy bản ghi" });
    return;
  }

  res.sendStatus(204);
});

export default router;
