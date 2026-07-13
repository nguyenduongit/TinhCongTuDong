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
  UpdateSanLuongResponse,
  GetSanLuongDashboardResponse,

  GetSanLuongBaoCaoQueryParams,
  GetSanLuongBaoCaoResponse,
} from "@workspace/api-zod";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { truncate3, computeCongSp, computeCongNhat, computeCongHoTro, computeWeeklyCongSp, ChiTietItem } from "@workspace/business-logic";

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

router.get("/san-luong/dashboard", requireAuth, async (req: AuthRequest, res): Promise<void> => {
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

  const rows = await db
    .select({
      id: sanLuongTable.id,
      ngay: sanLuongTable.ngay,
      thoi_gian_thuc_hien: sanLuongTable.thoi_gian_thuc_hien,
      thoi_gian_ho_tro: sanLuongTable.thoi_gian_ho_tro,
      thong_ke_ngay: sanLuongTable.thong_ke_ngay,
      chi_tiet: sanLuongTable.chi_tiet,
      user_id: sanLuongTable.user_id,
      created_at: sanLuongTable.created_at,
    })
    .from(sanLuongTable)
    .where(and(
      eq(sanLuongTable.user_id, req.user!.id),
      sql`${sanLuongTable.ngay} >= ${minStartStr} AND ${sanLuongTable.ngay} <= ${maxEndStr}`
    ))
    .orderBy(sanLuongTable.created_at);

  const todayRows = rows.filter(r => r.ngay === today);
  const today_count = todayRows.length;
  const today_total_time = todayRows.reduce((sum, r) => sum + Number(r.thoi_gian_thuc_hien) + Number(r.thoi_gian_ho_tro || 0), 0);
  const today_total_sl = todayRows.reduce((sum, r) => {
    const tk = r.thong_ke_ngay as any;
    return sum + (Number(tk?.tong_cong_sp) || 0) + (Number(tk?.tong_cong_ho_tro) || 0);
  }, 0);

  const weekRows = rows.filter(r => r.ngay >= weekStartStr);
  const week_count = weekRows.length;
  const week_total_time = weekRows.reduce((sum, r) => sum + Number(r.thoi_gian_thuc_hien) + Number(r.thoi_gian_ho_tro || 0), 0);
  
  const allCongDoan = await db.select().from(congDoanTable).where(eq(congDoanTable.user_id, req.user!.id));

  function mapDbChiTiet(dbChiTietArray: any[]): ChiTietItem[] {
    return dbChiTietArray.map(ct => {
      const cd = allCongDoan.find(c => c.ma_cong_doan === ct.cong_doan);
      return {
        ma_cong_doan: ct.cong_doan,
        so_luong: Number(ct.so_luong) || 0,
        dinh_muc: cd ? Number(cd.dinh_muc) : 1,
        phan_tram_dinh_muc: Number(ct.phan_tram_dinh_muc) || 100
      };
    });
  }

  const weekItems: ChiTietItem[] = [];
  let weekHoTroCong = 0;
  for (const r of weekRows) {
    const tk = r.thong_ke_ngay as any;
    if (tk?.tong_cong_ho_tro) weekHoTroCong += Number(tk.tong_cong_ho_tro);
    if (Array.isArray(r.chi_tiet)) weekItems.push(...mapDbChiTiet(r.chi_tiet));
  }
  const week_total_sl = computeWeeklyCongSp(weekItems) + weekHoTroCong;

  function getMonday(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00Z");
    const day = d.getUTCDay() || 7; 
    if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
    return d.toISOString().slice(0, 10);
  }

  const monthRows = rows.filter(r => r.ngay >= cycleStartStr && r.ngay <= cycleEndStr);
  const month_count = monthRows.length;
  const month_total_time = monthRows.reduce((sum, r) => sum + Number(r.thoi_gian_thuc_hien) + Number(r.thoi_gian_ho_tro || 0), 0);
  
  const monthWeeks = new Map<string, { items: ChiTietItem[], hoTro: number }>();
  for (const r of monthRows) {
    const monday = getMonday(r.ngay);
    if (!monthWeeks.has(monday)) {
      monthWeeks.set(monday, { items: [], hoTro: 0 });
    }
    const group = monthWeeks.get(monday)!;
    
    const tk = r.thong_ke_ngay as any;
    if (tk?.tong_cong_ho_tro) group.hoTro += Number(tk.tong_cong_ho_tro);
    if (Array.isArray(r.chi_tiet)) group.items.push(...mapDbChiTiet(r.chi_tiet));
  }
  
  let month_total_sl = 0;
  for (const group of monthWeeks.values()) {
    month_total_sl += computeWeeklyCongSp(group.items) + group.hoTro;
  }

  res.json(
    GetSanLuongDashboardResponse.parse({
      stats: {
        today_count,
        today_total_time,
        today_total_sl,
        month_count,
        month_total_time,
        month_total_sl,
        week_count,
        week_total_time,
        week_total_sl,
      },
      todayEntries: todayRows.map(formatRow)
    })
  );
});

router.get("/san-luong/bao-cao", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const queryParsed = GetSanLuongBaoCaoQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }
  
  const monthStr = queryParsed.data.month;
  if (!/^\d{4}-\d{2}$/.test(monthStr)) {
    res.status(400).json({ error: "Invalid month format. Expected YYYY-MM" });
    return;
  }
  
  const [yearStr, mStr] = monthStr.split('-');
  let cycleYear = parseInt(yearStr, 10);
  let cycleMonth = parseInt(mStr, 10);
  
  let prevMonth = cycleMonth - 1;
  let prevYear = cycleYear;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }

  const cycleStartStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-21`;
  const cycleEndStr = `${cycleYear}-${cycleMonth.toString().padStart(2, '0')}-20`;

  const rows = await db
    .select({
      ngay: sanLuongTable.ngay,
      thoi_gian_thuc_hien: sanLuongTable.thoi_gian_thuc_hien,
      thoi_gian_ho_tro: sanLuongTable.thoi_gian_ho_tro,
      chi_tiet: sanLuongTable.chi_tiet,
    })
    .from(sanLuongTable)
    .where(and(
      eq(sanLuongTable.user_id, req.user!.id),
      sql`${sanLuongTable.ngay} >= ${cycleStartStr} AND ${sanLuongTable.ngay} <= ${cycleEndStr}`
    ));

  const allCongDoan = await db.select().from(congDoanTable).where(eq(congDoanTable.user_id, req.user!.id));

  // Date parsing logic
  function getWeekNumberAndEdges(dateStr: string, cStartStr: string, cEndStr: string) {
    const d = new Date(dateStr + "T00:00:00Z");
    const cycleStart = new Date(cStartStr + "T00:00:00Z");
    const cycleEnd = new Date(cEndStr + "T00:00:00Z");
    
    // Find Monday of the week containing d
    const day = d.getUTCDay() || 7;
    const wStart = new Date(d);
    wStart.setUTCDate(wStart.getUTCDate() - (day - 1));
    
    const wEnd = new Date(wStart);
    wEnd.setUTCDate(wEnd.getUTCDate() + 6);
    
    // clamp to cycle boundaries
    const start = wStart < cycleStart ? cycleStart : wStart;
    const end = wEnd > cycleEnd ? cycleEnd : wEnd;

    // Find week number starting from cycleStart week
    const cycleStartDay = cycleStart.getUTCDay() || 7;
    const startWeekStart = new Date(cycleStart);
    startWeekStart.setUTCDate(startWeekStart.getUTCDate() - (cycleStartDay - 1));
    
    const weekNum = Math.round((wStart.getTime() - startWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

    return { weekNum, start, end };
  }

  const now = new Date();
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  vnTime.setUTCHours(0, 0, 0, 0);
  
  const vnDay = vnTime.getUTCDay() || 7;
  const currentWeekStart = new Date(vnTime);
  currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - (vnDay - 1));
  
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);

  const weekMap = new Map<number, any>();

  for (const entry of rows) {
    const { weekNum, start, end } = getWeekNumberAndEdges(entry.ngay, cycleStartStr, cycleEndStr);
    
    if (!weekMap.has(weekNum)) {
      const wStartForCheck = new Date(entry.ngay + "T00:00:00Z");
      const d = wStartForCheck.getUTCDay() || 7;
      wStartForCheck.setUTCDate(wStartForCheck.getUTCDate() - (d - 1));

      const isCurrentWeek = wStartForCheck.getTime() === currentWeekStart.getTime();
      const isLastWeek = wStartForCheck.getTime() === lastWeekStart.getTime();

      weekMap.set(weekNum, {
        weekNum,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        isCurrentWeek,
        isLastWeek,
        totalCongSp: 0,
        totalHoTroPhut: 0,
        totalTime: 0,
        congDoanStats: {} as Record<string, { so_luong: number; cong_sp: number }>
      });
    }

    const weekGroup = weekMap.get(weekNum)!;
    weekGroup.totalHoTroPhut += (entry.thoi_gian_ho_tro || 0);
    weekGroup.totalTime += (entry.thoi_gian_thuc_hien || 0) + (entry.thoi_gian_ho_tro || 0);

    if (Array.isArray(entry.chi_tiet)) {
      entry.chi_tiet.forEach((ct: any) => {
        if (!weekGroup.congDoanStats[ct.cong_doan]) {
          weekGroup.congDoanStats[ct.cong_doan] = { so_luong: 0, cong_sp: 0 };
        }
        // Quy đổi so_luong về số pcs tương đương định mức 100%
        // Ví dụ: định mức 1000, làm 800 pcs với % định mức 80% → 800 / 0.8 = 1000 pcs tương đương
        const soLuong = Number(ct.so_luong) || 0;
        const phanTram = Number(ct.phan_tram_dinh_muc) || 100;
        const quyDoi = soLuong / (phanTram / 100);
        weekGroup.congDoanStats[ct.cong_doan].so_luong += quyDoi;
      });
    }
  }

  const weekGroups = Array.from(weekMap.values());
  
  weekGroups.forEach(week => {
    const items: ChiTietItem[] = [];
    Object.entries(week.congDoanStats).forEach(([ma_cong_doan, stat]: [string, any]) => {
      const cd = allCongDoan.find(c => c.ma_cong_doan === ma_cong_doan);
      const dinh_muc = cd ? Number(cd.dinh_muc) : 1;
      
      // so_luong đã được quy đổi về định mức 100%, nên dùng phan_tram_dinh_muc = 100
      stat.cong_sp = computeCongSp(stat.so_luong, dinh_muc, 100, ma_cong_doan.startsWith('9'));

      items.push({
        ma_cong_doan,
        so_luong: stat.so_luong,
        dinh_muc,
        phan_tram_dinh_muc: 100
      });
    });

    week.totalCongSp = computeWeeklyCongSp(items);
  });

  weekGroups.sort((a, b) => b.weekNum - a.weekNum);

  const totalCongMonth = weekGroups.reduce((sum, week) => sum + week.totalCongSp + (week.totalHoTroPhut / 480), 0);

  res.json(
    GetSanLuongBaoCaoResponse.parse({
      weekGroups,
      totalCongMonth,
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
