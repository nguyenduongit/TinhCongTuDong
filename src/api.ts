import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { computeCongSp, computeCongNhat, computeCongHoTro, computeWeeklyCongSp, truncate3, isBasketQuyCach, type ChiTietItem } from '@/lib/business-logic';
import { minutesToCong, getWorkMinutesForDay } from '@/lib/work-rules';
import { getCycleStringFromYearMonth } from '@/lib/date-utils';
import { type CompanyConfig, DEFAULT_COMPANY_CONFIG, mergeWithDefaults } from '@/lib/company-config';

export type CongDoan = {
  id: number;
  ma_cong_doan: string;
  ten_cong_doan: string;
  dinh_muc: number | string;
  quy_cach: string;
  order: number;
};

export type SanLuong = {
  id: number;
  ngay: string;
  chi_tiet: { cong_doan: string; so_luong: number; dinh_muc: number; cong_sp: number; phan_tram_dinh_muc?: number }[];
  thong_ke_ngay: { cong_nhat: number; tong_cong_sp: number; tong_cong_ho_tro?: number; chi_tiet_cong?: Record<string, number> };
  thoi_gian_thuc_hien: number;
  thoi_gian_ho_tro: number;
};



// Query Keys
export const getListCongDoanQueryKey = () => ['cong-doan', 'list'];
export const getListSanLuongQueryKey = () => ['san-luong', 'list'];
export const getGetSanLuongDashboardQueryKey = () => ['san-luong', 'dashboard'];
export const getGetCongTuanQueryKey = (params: any) => ['cong-tuan', 'list', params];


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
    .join("-");
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay() || 7; 
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

// --- CONG DOAN ---
export const useListCongDoan = ({ query = {} }: any = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: getListCongDoanQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase.from('cong_doan').select('*').eq('user_id', user?.id).order('order', { ascending: false });
      if (error) throw error;
      return data as CongDoan[];
    },
    enabled: !!user?.id && (query.enabled !== false),
  });
};

export const useCreateCongDoan = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ data }: { data: any }) => {
      const { data: result, error } = await supabase.from('cong_doan').insert({ ...data, user_id: user?.id, order: Date.now() }).select().single();
      if (error) throw error;
      return result;
    }
  });
};

export const useUpdateCongDoan = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      // 1. Lấy mã công đoạn hiện tại
      const { data: cd } = await supabase.from('cong_doan').select('ma_cong_doan').eq('id', id).eq('user_id', user?.id).single();
      if (!cd) throw new Error('Công đoạn không tồn tại');

      // 2. Nếu người dùng đổi mã công đoạn, kiểm tra xem mã cũ đã được dùng trong sản lượng chưa
      if (data.ma_cong_doan && data.ma_cong_doan !== cd.ma_cong_doan) {
        const { data: sanLuongUsed, error: slError } = await supabase
          .from('san_luong')
          .select('id')
          .eq('user_id', user?.id)
          .contains('chi_tiet', [{ cong_doan: cd.ma_cong_doan }])
          .limit(1);

        if (slError) throw slError;
        if (sanLuongUsed && sanLuongUsed.length > 0) {
          throw new Error('Công đoạn này đã được nhập sản lượng, không thể đổi Mã công đoạn!');
        }
      }

      const { data: result, error } = await supabase.from('cong_doan').update(data).eq('id', id).eq('user_id', user?.id).select().single();
      if (error) throw error;
      return result;
    }
  });
};

export const useDeleteCongDoan = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { error } = await supabase.from('cong_doan').delete().eq('id', id).eq('user_id', user?.id);
      if (error) throw error;
    }
  });
};


// --- SAN LUONG ---
export const setBaseUrl = () => {}; 

export const useListSanLuong = (params?: { ngay?: string, startDate?: string, endDate?: string }, options: any = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['san-luong', 'list', params],
    queryFn: async () => {
      let query = supabase.from('san_luong').select('*').eq('user_id', user?.id).order('ngay', { ascending: false });
      if (params?.ngay) query = query.eq('ngay', params.ngay);
      if (params?.startDate) query = query.gte('ngay', params.startDate);
      if (params?.endDate) query = query.lte('ngay', params.endDate);
      const { data, error } = await query;
      if (error) throw error;
      return data as SanLuong[];
    },
    enabled: !!user?.id && (options.query?.enabled !== false),
  });
};

export const useCreateSanLuong = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: any }) => {
      const { data: allCongDoan } = await supabase.from('cong_doan').select('*').eq('user_id', user?.id);
      const groupedChiTietMap = new Map<string, any>();
      for (const ct of data.chi_tiet) {
        const key = `${ct.cong_doan}_${ct.phan_tram_dinh_muc ?? 100}`;
        if (groupedChiTietMap.has(key)) {
          groupedChiTietMap.get(key).so_luong += Number(ct.so_luong);
        } else {
          groupedChiTietMap.set(key, { ...ct, so_luong: Number(ct.so_luong) });
        }
      }
      const groupedChiTiet = Array.from(groupedChiTietMap.values());

      const chi_tiet_computed = groupedChiTiet.map((ct: any) => {
        const cd = allCongDoan?.find(c => c.ma_cong_doan === ct.cong_doan);
        const dinh_muc_goc = cd ? Number(cd.dinh_muc) : 1;
        const dinh_muc = dinh_muc_goc * ((ct.phan_tram_dinh_muc ?? 100) / 100);
        const cong_sp = computeCongSp(ct.so_luong, dinh_muc, isBasketQuyCach(cd?.quy_cach));
        return { cong_doan: ct.cong_doan, so_luong: ct.so_luong, dinh_muc, cong_sp };
      });

      let tong_cong_sp = chi_tiet_computed.reduce((sum: number, ct: any) => sum + ct.cong_sp, 0);
      tong_cong_sp = truncate3(tong_cong_sp);
      const cong_nhat = computeCongNhat(data.thoi_gian_thuc_hien, data.thoi_gian_ho_tro ?? 0);
      const tong_cong_ho_tro = computeCongHoTro(data.thoi_gian_ho_tro ?? 0);
      
      const chi_tiet_cong: Record<string, number> = {};
      chi_tiet_computed.forEach((ct: any) => {
        if (chi_tiet_cong[ct.cong_doan] === undefined) chi_tiet_cong[ct.cong_doan] = 0;
        chi_tiet_cong[ct.cong_doan] += ct.cong_sp;
      });
      Object.keys(chi_tiet_cong).forEach(k => { chi_tiet_cong[k] = truncate3(chi_tiet_cong[k]); });

      const thong_ke_ngay = { tong_cong_sp, cong_nhat, tong_cong_ho_tro, chi_tiet_cong };

      const { data: result, error } = await supabase.from('san_luong').insert({
        ngay: data.ngay,
        chi_tiet: chi_tiet_computed,
        thong_ke_ngay,
        thoi_gian_thuc_hien: data.thoi_gian_thuc_hien,
        thoi_gian_ho_tro: data.thoi_gian_ho_tro ?? 0,
        user_id: user?.id,
      }).select().single();

      if (error) throw error;
      
      const congDoanMAs = chi_tiet_computed.map((ct: any) => ct.cong_doan);
      if (congDoanMAs.length > 0) {
        await supabase.from('cong_doan').update({ order: Date.now() }).in('ma_cong_doan', congDoanMAs).eq('user_id', user?.id);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['san-luong'] });
      queryClient.invalidateQueries({ queryKey: ['cong-doan'] });
    }
  });
};

export const useUpdateSanLuong = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      let chi_tiet_computed = data.chi_tiet;
      let thong_ke_ngay = data.thong_ke_ngay;

      if (data.chi_tiet) {
        const { data: allCongDoan } = await supabase.from('cong_doan').select('*').eq('user_id', user?.id);
        
        const groupedChiTietMap = new Map<string, any>();
        for (const ct of data.chi_tiet) {
          const key = `${ct.cong_doan}_${ct.phan_tram_dinh_muc ?? 100}`;
          if (groupedChiTietMap.has(key)) {
            groupedChiTietMap.get(key).so_luong += Number(ct.so_luong);
          } else {
            groupedChiTietMap.set(key, { ...ct, so_luong: Number(ct.so_luong) });
          }
        }
        const groupedChiTiet = Array.from(groupedChiTietMap.values());

        chi_tiet_computed = groupedChiTiet.map((ct: any) => {
          const cd = allCongDoan?.find(c => c.ma_cong_doan === ct.cong_doan);
          const dinh_muc_goc = cd ? Number(cd.dinh_muc) : 1;
          const dinh_muc = dinh_muc_goc * ((ct.phan_tram_dinh_muc ?? 100) / 100);
          const cong_sp = computeCongSp(ct.so_luong, dinh_muc, isBasketQuyCach(cd?.quy_cach));
          return { cong_doan: ct.cong_doan, so_luong: ct.so_luong, dinh_muc, cong_sp };
        });

        let tong_cong_sp = chi_tiet_computed.reduce((sum: number, ct: any) => sum + ct.cong_sp, 0);
        tong_cong_sp = truncate3(tong_cong_sp);
        
        const chi_tiet_cong: Record<string, number> = {};
        chi_tiet_computed.forEach((ct: any) => {
          if (chi_tiet_cong[ct.cong_doan] === undefined) chi_tiet_cong[ct.cong_doan] = 0;
          chi_tiet_cong[ct.cong_doan] += ct.cong_sp;
        });
        Object.keys(chi_tiet_cong).forEach(k => { chi_tiet_cong[k] = truncate3(chi_tiet_cong[k]); });

        const { data: existing } = await supabase.from('san_luong').select('thoi_gian_thuc_hien, thoi_gian_ho_tro').eq('id', id).single();
        const t_thuc_hien = data.thoi_gian_thuc_hien ?? existing?.thoi_gian_thuc_hien ?? 0;
        const t_ho_tro = data.thoi_gian_ho_tro ?? existing?.thoi_gian_ho_tro ?? 0;

        const cong_nhat = computeCongNhat(t_thuc_hien, t_ho_tro);
        const tong_cong_ho_tro = computeCongHoTro(t_ho_tro);

        thong_ke_ngay = { tong_cong_sp, cong_nhat, tong_cong_ho_tro, chi_tiet_cong };
      }

      const updatePayload: any = {};
      if (chi_tiet_computed) updatePayload.chi_tiet = chi_tiet_computed;
      if (thong_ke_ngay) updatePayload.thong_ke_ngay = thong_ke_ngay;
      if (data.thoi_gian_thuc_hien !== undefined) updatePayload.thoi_gian_thuc_hien = data.thoi_gian_thuc_hien;
      if (data.thoi_gian_ho_tro !== undefined) updatePayload.thoi_gian_ho_tro = data.thoi_gian_ho_tro;

      const { data: result, error } = await supabase.from('san_luong').update(updatePayload).eq('id', id).eq('user_id', user?.id).select().single();
      if (error) throw error;
      
      if (chi_tiet_computed) {
        const congDoanMAs = chi_tiet_computed.map((ct: any) => ct.cong_doan);
        if (congDoanMAs.length > 0) {
          await supabase.from('cong_doan').update({ order: Date.now() }).in('ma_cong_doan', congDoanMAs).eq('user_id', user?.id);
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['san-luong'] });
      queryClient.invalidateQueries({ queryKey: ['cong-doan'] });
    }
  });
};

export const useDeleteSanLuong = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { error } = await supabase.from('san_luong').delete().eq('id', id).eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['san-luong'] })
  });
};

export const useConfirmNgayNghi = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ngay: string, loai_nghi: string }) => {
      const { data: result, error } = await supabase.from('san_luong').insert({
        ngay: data.ngay,
        chi_tiet: [],
        thong_ke_ngay: { is_ngay_nghi: true, loai_nghi: data.loai_nghi },
        thoi_gian_thuc_hien: 0,
        thoi_gian_ho_tro: 0,
        user_id: user?.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['san-luong'] });
    }
  });
};

// --- CALCULATIONS FOR DASHBOARD / BAO CAO ---

// Tra quy_cách theo mã công đoạn, dùng để xác định logic rổ (32pcs/rổ)
// khi tính lại công từ dữ liệu đã lưu (chi_tiet không lưu sẵn quy_cách).
function mapDbChiTiet(dbChiTietArray: any[], quyCachByMa: Record<string, string | null | undefined> = {}): ChiTietItem[] {
  return dbChiTietArray.map(ct => ({
    ma_cong_doan: ct.cong_doan,
    so_luong: Number(ct.so_luong) || 0,
    dinh_muc: Number(ct.dinh_muc) || 1,
    quy_cach: quyCachByMa[ct.cong_doan]
  }));
}

export const useGetSanLuongDashboard = (options: any = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: getGetSanLuongDashboardQueryKey(),
    queryFn: async () => {
      const today = getTodayVN();
      const [yearStr, monthStr, dayStr] = today.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const d = parseInt(dayStr, 10);
      
      // Xác định tháng công hiện tại (ngày > 20 → tháng sau)
      let cycleMonth = m;
      let cycleYear = y;
      if (d > 20) {
        cycleMonth = m + 1;
        if (cycleMonth > 12) { cycleMonth = 1; cycleYear++; }
      }

      const { cycleStartStr, cycleEndStr } = getCycleStringFromYearMonth(cycleYear, cycleMonth);

      const now = new Date();
      const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      vnTime.setUTCHours(0, 0, 0, 0);
      const dayOfWeek = vnTime.getUTCDay();
      const weekStart = new Date(vnTime);
      weekStart.setUTCDate(vnTime.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const weekStartStr = weekStart.toISOString().slice(0, 10);

      const minStartStr = cycleStartStr < weekStartStr ? cycleStartStr : weekStartStr;
      const maxEndStr = cycleEndStr > today ? cycleEndStr : today;

      const [{ data: rows, error }, { data: congDoanList }] = await Promise.all([
        supabase.from('san_luong')
          .select('*')
          .eq('user_id', user?.id)
          .gte('ngay', minStartStr)
          .lte('ngay', maxEndStr)
          .order('created_at', { ascending: true }),
        supabase.from('cong_doan').select('ma_cong_doan, quy_cach').eq('user_id', user?.id),
      ]);

      if (error) throw error;
      if (!rows) return { stats: {}, todayEntries: [] };

      // Tra quy_cách theo mã công đoạn (dùng để xác định logic rổ 32pcs/rổ khi
      // tính lại công từ dữ liệu đã lưu — chi_tiet không lưu sẵn quy_cách).
      const quyCachByMa: Record<string, string | null | undefined> = {};
      (congDoanList || []).forEach(cd => { quyCachByMa[cd.ma_cong_doan] = cd.quy_cach; });

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
      
      const weekItems: ChiTietItem[] = [];
      let weekHoTroCong = 0;
      for (const r of weekRows) {
        const tk = r.thong_ke_ngay as any;
        if (tk?.tong_cong_ho_tro) weekHoTroCong += Number(tk.tong_cong_ho_tro);
        if (Array.isArray(r.chi_tiet)) weekItems.push(...mapDbChiTiet(r.chi_tiet, quyCachByMa));
      }
      const week_total_sl = computeWeeklyCongSp(weekItems) + weekHoTroCong;

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
        if (Array.isArray(r.chi_tiet)) group.items.push(...mapDbChiTiet(r.chi_tiet, quyCachByMa));
      }
      
      let month_total_sl = 0;
      for (const group of monthWeeks.values()) {
        month_total_sl += computeWeeklyCongSp(group.items) + group.hoTro;
      }

      return {
        stats: {
          today_count, today_total_time, today_total_sl,
          month_count, month_total_time, month_total_sl,
          week_count, week_total_time, week_total_sl,
        },
        todayEntries: todayRows,
        monthEntries: monthRows,
      };
    },
    enabled: !!user?.id && (options.query?.enabled !== false),
  });
};

export const useGetCongTuan = (params: { month: string }, options: any = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: getGetCongTuanQueryKey(params),
    queryFn: async () => {
      const monthStr = params.month;
      const [yearStr, mStr] = monthStr.split('-');
      const cycleYear  = parseInt(yearStr, 10);
      const cycleMonth = parseInt(mStr, 10);

      const { cycleStartStr, cycleEndStr } = getCycleStringFromYearMonth(cycleYear, cycleMonth);

      const [{ data: rows, error }, { data: congDoanList }] = await Promise.all([
        supabase.from('san_luong')
          .select('*')
          .eq('user_id', user?.id)
          .gte('ngay', cycleStartStr)
          .lte('ngay', cycleEndStr),
        supabase.from('cong_doan').select('ma_cong_doan, quy_cach').eq('user_id', user?.id),
      ]);

      if (error) throw error;

      // Tra quy_cách theo mã công đoạn (dùng để xác định logic rổ 32pcs/rổ khi
      // tính lại công từ dữ liệu đã lưu — chi_tiet không lưu sẵn quy_cách).
      const quyCachByMa: Record<string, string | null | undefined> = {};
      (congDoanList || []).forEach(cd => { quyCachByMa[cd.ma_cong_doan] = cd.quy_cach; });
      if (!rows) return { weekGroups: [], totalCongMonth: 0 };

      function getWeekNumberAndEdges(dateStr: string) {
        const d = new Date(dateStr + "T00:00:00Z");
        const cycleStart = new Date(cycleStartStr + "T00:00:00Z");
        const cycleEnd = new Date(cycleEndStr + "T00:00:00Z");
        
        const day = d.getUTCDay() || 7;
        const wStart = new Date(d);
        wStart.setUTCDate(wStart.getUTCDate() - (day - 1));
        
        const wEnd = new Date(wStart);
        wEnd.setUTCDate(wEnd.getUTCDate() + 6);
        
        const start = wStart < cycleStart ? cycleStart : wStart;
        const end = wEnd > cycleEnd ? cycleEnd : wEnd;

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
        const { weekNum, start, end } = getWeekNumberAndEdges(entry.ngay);
        
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
            items: [] as ChiTietItem[],
            congDoanStats: {} as Record<string, { so_luong: number; cong_sp: number }>
          });
        }

        const weekGroup = weekMap.get(weekNum)!;
        weekGroup.totalHoTroPhut += (entry.thoi_gian_ho_tro || 0);
        weekGroup.totalTime += (entry.thoi_gian_thuc_hien || 0) + (entry.thoi_gian_ho_tro || 0);

        if (Array.isArray(entry.chi_tiet)) {
          entry.chi_tiet.forEach((ct: any) => {
            const ma = ct.cong_doan;
            const sl = Number(ct.so_luong) || 0;
            const dm = Number(ct.dinh_muc) || 1;
            const qc = quyCachByMa[ma];
            const sp = ct.cong_sp !== undefined ? Number(ct.cong_sp) : computeCongSp(sl, dm, isBasketQuyCach(qc));
            
            if (!weekGroup.congDoanStats[ma]) weekGroup.congDoanStats[ma] = { so_luong: 0, cong_sp: 0 };
            weekGroup.congDoanStats[ma].so_luong += sl;
            weekGroup.congDoanStats[ma].cong_sp += sp; 
            
            weekGroup.items.push({ ma_cong_doan: ma, so_luong: sl, dinh_muc: dm, quy_cach: qc });
          });
        }
      }

      const weekGroups = Array.from(weekMap.values());
      weekGroups.forEach(week => {
        week.totalCongSp = computeWeeklyCongSp(week.items);
      });
      weekGroups.sort((a, b) => b.weekNum - a.weekNum);

      const totalCongMonth = weekGroups.reduce((sum, week) => sum + week.totalCongSp + minutesToCong(week.totalHoTroPhut), 0);

      return { weekGroups, totalCongMonth };
    },
    enabled: !!user?.id && (options.query?.enabled !== false),
  });
};

// --- TRA CỨU ĐỊNH MỨC ---
export type DinhMuc = {
  product_code: string;
  product_name: string;
  level_1_0: number;
  level_1_1: number;
  level_2_0: number;
  level_2_1: number;
  level_2_2: number;
  level_2_5: number;
  quy_cach?: string | null;
  created_at: string;
};

export const useSearchDinhMuc = (keyword: string) => {
  return useQuery({
    queryKey: ['dinh-muc', 'search', keyword],
    queryFn: async () => {
      if (!keyword || keyword.trim() === '') return [] as DinhMuc[];
      
      const searchTerm = `%${keyword.trim()}%`;
      const { data, error } = await supabase
        .from('dinh_muc')
        .select('*')
        .or(`product_code.ilike.${searchTerm},product_name.ilike.${searchTerm}`)
        .limit(50);
        
      if (error) throw error;
      return data as DinhMuc[];
    },
    enabled: keyword.trim().length > 0,
  });
};

export const useGetDinhMucByCode = (productCode: string) => {
  return useQuery({
    queryKey: ['dinh-muc', 'detail', productCode],
    queryFn: async () => {
      if (!productCode || productCode.trim() === '') return null;
      
      const { data, error } = await supabase
        .from('dinh_muc')
        .select('*')
        .eq('product_code', productCode.trim())
        .maybeSingle();
        
      if (error) throw error;
      return data as DinhMuc | null;
    },
    enabled: !!productCode && productCode.trim().length > 0,
  });
};

// --- ADMIN ĐỊNH MỨC CRUD ---
export const useAdminListDinhMuc = () => {
  return useQuery({
    queryKey: ['admin', 'dinh-muc', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dinh_muc')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DinhMuc[];
    },
  });
};

export const useAdminCreateDinhMuc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<DinhMuc, 'created_at'>) => {
      const { data, error } = await supabase
        .from('dinh_muc')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dinh-muc', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dinh-muc'] });
    },
  });
};

export const useAdminUpdateDinhMuc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<DinhMuc, 'created_at'>) => {
      const { error } = await supabase
        .from('dinh_muc')
        .update({
          product_name: payload.product_name,
          level_1_0: payload.level_1_0,
          level_1_1: payload.level_1_1,
          level_2_0: payload.level_2_0,
          level_2_1: payload.level_2_1,
          level_2_2: payload.level_2_2,
          level_2_5: payload.level_2_5,
          quy_cach: payload.quy_cach,
        })
        .eq('product_code', payload.product_code);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dinh-muc', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dinh-muc', 'detail', variables.product_code] });
      queryClient.invalidateQueries({ queryKey: ['dinh-muc'] });
    },
  });
};

export const useAdminDeleteDinhMuc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productCode: string) => {
      const { error } = await supabase
        .from('dinh_muc')
        .delete()
        .eq('product_code', productCode);
      
      if (error) throw error;
    },
    onSuccess: (_, productCode) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dinh-muc', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dinh-muc', 'detail', productCode] });
      queryClient.invalidateQueries({ queryKey: ['dinh-muc'] });
    },
  });
};

export const useUpdateDinhMucQuyCach = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productCode, quyCach }: { productCode: string; quyCach: string }) => {
      const { error } = await supabase
        .from('dinh_muc')
        .update({ quy_cach: quyCach })
        .eq('product_code', productCode);
      
      if (error) throw error;
    },
    onSuccess: (_, { productCode }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dinh-muc', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dinh-muc', 'detail', productCode] });
      queryClient.invalidateQueries({ queryKey: ['dinh-muc'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'quy-cach-suggestions'] });
    },
  });
};

// --- THONG TIN LUONG ---

export type QuyCachSuggestion = {
  ma_cong_doan: string;
  ten_cong_doan: string;
  quy_cach: string;
};

export const useAdminListQuyCachSuggestions = () => {
  return useQuery({
    queryKey: ['admin', 'quy-cach-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_quy_cach_suggestions');
      if (error) throw error;
      return (data || []) as QuyCachSuggestion[];
    },
  });
};

export type ThongTinLuong = {
  ngay_vao_cong_ty: string | null;
  ngay_ky_hop_dong: string | null;
  gioi_tinh: string | null;
  bac_luong: string | null;
  /** Theo tháng lương (yyyy-MM): đã khai báo hành kinh với PNS trong tháng đó hay chưa. */
  menstrual_declared?: Record<string, boolean>;
};

export const useGetThongTinLuong = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['thong-tin-luong'],
    queryFn: async () => {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      const config = currentUser?.user_metadata?.profile || currentUser?.user_metadata?.salary_config || {};
      return {
        ngay_vao_cong_ty: config['ngay_vao'] || null,
        ngay_ky_hop_dong: config['ngay_ky_hd'] || null,
        gioi_tinh: config['gioi_tinh'] || null,
        bac_luong: config['bac_luong'] || null,
        menstrual_declared: config['menstrual_declared'] || {},
      } as ThongTinLuong;
    },
    enabled: !!user?.id,
  });
};

export type UserProfileUpdate = ThongTinLuong & {
  name?: string;
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { refetchUser } = useAuth();
  return useMutation({
    mutationFn: async (data: UserProfileUpdate) => {
      const { data: { user: currentUser }, error: fetchError } = await supabase.auth.getUser();
      if (fetchError) throw fetchError;

      const currentConfig = currentUser?.user_metadata?.profile || {};

      const resolvedGioiTinh = data.gioi_tinh !== undefined
        ? data.gioi_tinh
        : (currentConfig['gioi_tinh'] ?? null);

      // Merge với dữ liệu hiện có: chỉ ghi đè field nào thực sự được gửi lên,
      // các field không gửi (undefined) sẽ giữ nguyên giá trị cũ thay vì bị xoá.
      const newProfile = {
        'ngay_vao': data.ngay_vao_cong_ty !== undefined
          ? data.ngay_vao_cong_ty
          : (currentConfig['ngay_vao'] ?? null),
        'ngay_ky_hd': data.ngay_ky_hop_dong !== undefined
          ? data.ngay_ky_hop_dong
          : (currentConfig['ngay_ky_hd'] ?? null),
        'gioi_tinh': resolvedGioiTinh,
        'bac_luong': data.bac_luong !== undefined
          ? data.bac_luong
          : (currentConfig['bac_luong'] ?? null),
        'menstrual_declared': resolvedGioiTinh === 'nu'
          ? (data.menstrual_declared !== undefined ? data.menstrual_declared : (currentConfig['menstrual_declared'] || {}))
          : {},
      };

      const updatePayload: any = {
        profile: newProfile,
        salary_config: null // Xóa key cũ để dọn dẹp data
      };
      if (data.name !== undefined) {
        updatePayload.full_name = data.name;
      }

      const { data: updateData, error } = await supabase.auth.updateUser({
        data: updatePayload
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thong-tin-luong'] });
      refetchUser();
    }
  });
};


// --- COMPANY CONFIG ---

export const getCompanyConfigQueryKey = () => ['company-config'];

/**
 * Hook lấy cấu hình nghiệp vụ của công ty từ Supabase.
 *
 * - Fetch bảng `company_config` (mỗi row là một key-value).
 * - Tự động merge với DEFAULT_COMPANY_CONFIG nếu DB thiếu key nào.
 * - Dữ liệu được cache bởi React Query, chỉ fetch lại khi stale.
 *
 * Dùng trong trang tính lương và bất kỳ component nào cần config công ty.
 *
 * @example
 * const { config } = useCompanyConfig();
 * const insurance = computeInsuranceDeductions(basicSalary, config);
 */
export const useCompanyConfig = () => {
  const query = useQuery({
    queryKey: getCompanyConfigQueryKey(),
    queryFn: async (): Promise<CompanyConfig> => {
      const { data, error } = await supabase
        .from('company_config')
        .select('key, value');

      if (error) {
        // Bảng chưa tồn tại hoặc lỗi mạng → dùng defaults
        console.warn('[useCompanyConfig] Không thể fetch company_config, dùng giá trị mặc định:', error.message);
        return DEFAULT_COMPANY_CONFIG;
      }

      if (!data || data.length === 0) return DEFAULT_COMPANY_CONFIG;

      // Chuyển mảng [{key, value}] thành object {key: value}
      const partial = data.reduce<Record<string, number>>((acc, row) => {
        acc[row.key] = Number(row.value);
        return acc;
      }, {});

      return mergeWithDefaults(partial as Partial<CompanyConfig>);
    },
    // Config không thay đổi thường xuyên — cache 5 phút
    staleTime: 5 * 60 * 1000,
  });

  return {
    config: query.data ?? DEFAULT_COMPANY_CONFIG,
    isLoading: query.isLoading,
  };
};

/**
 * Mutation cập nhật một key config (dùng cho trang Admin sau này).
 *
 * @example
 * const { mutate } = useUpdateCompanyConfig();
 * mutate({ key: 'meal_allowance_per_day', value: 40000 });
 */
export const useUpdateCompanyConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: keyof CompanyConfig; value: number }) => {
      const { error } = await supabase
        .from('company_config')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCompanyConfigQueryKey() });
    },
  });
};

// --- SALARY TIERS ---

export type SalaryTier = {
  tier_code: string;
  base_salary: number;
};

export const useGetSalaryTiers = () => {
  return useQuery({
    queryKey: ['salary-tiers'],
    queryFn: async (): Promise<SalaryTier[]> => {
      const { data, error } = await supabase
        .from('salary_tiers')
        .select('tier_code, base_salary')
        .order('tier_code', { ascending: true });

      if (error) {
        console.warn('[useGetSalaryTiers] Không thể fetch salary_tiers:', error.message);
        return [];
      }

      return data as SalaryTier[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  raw_user_metadata: any;
};

export function useGetAllUsers() {
  return useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) {
        console.error('Error fetching all users:', error);
        return [] as AdminUser[]; // Return empty list instead of crashing
      }
      return (data ?? []) as AdminUser[];
    },
    retry: false, // don't retry if the RPC doesn't exist
  });
}

export function useAdminUpdateUserPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetUserId,
      plan,
      expiresAt,
    }: {
      targetUserId: string;
      plan: 'free' | 'pro';
      expiresAt?: string | null;
    }) => {
      const { error } = await supabase.rpc('admin_update_user_plan', {
        target_user_id: targetUserId,
        new_plan: plan,
        new_expires_at: expiresAt ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    },
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: targetUserId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    },
  });
}

// ─── REFERRAL SYSTEM ──────────────────────────────────────────────────────────

export type ReferralInfo = {
  referral_id: string;
  referrer_id: string;
  referrer_email: string;
  referrer_name: string;
  referrer_avatar: string | null;
  referee_id: string;
  referee_email: string;
  referee_name: string;
  referee_avatar: string | null;
  referral_code: string;
  status: 'tracking' | 'completed' | 'failed';
  reward_granted: boolean;
  tracking_start_date: string;
  tracking_end_date: string;
  created_at: string;
  completed_at: string | null;
  days_with_entry: number;
  total_workdays: number;
};

export type DailyEntry = {
  ngay: string;
  day_of_week: number;
  is_workday: boolean;
  has_entry: boolean;
  total_cong_sp: number;
  total_time: number;
  entries: any[];
};

/**
 * Lấy hoặc tạo mã referral code của user hiện tại.
 */
export function useGetMyReferralCode() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_or_create_referral_code', {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return data as string;
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Code không đổi
  });
}

/**
 * Lấy danh sách người mà user hiện tại đã mời.
 */
export function useGetMyReferrals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-referrals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_referrals');
      if (error) throw error;
      return (data || []) as Array<{
        referral_id: string;
        referee_email: string;
        referee_name: string;
        referee_avatar: string;
        status: string;
        reward_granted: boolean;
        tracking_start_date: string;
        tracking_end_date: string;
        days_with_entry: number;
        total_workdays: number;
      }>;
    },
    enabled: !!user?.id,
  });
}

/**
 * Nhận thưởng khi người được mời đã hoàn thành đủ số ngày làm việc
 */
export function useClaimReferralReward() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (referralId: string) => {
      const { data, error } = await supabase.rpc('claim_referral_reward', {
        p_referral_id: referralId
      });
      if (error) throw error;
      if (data && typeof data === 'object' && 'success' in data && data.success === false) {
        throw new Error((data as any).error || 'Lỗi không xác định');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-referrals', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] }); // Cập nhật lại Pro status
    }
  });
}

/**
 * Áp dụng mã referral cho user hiện tại (người được mời).
 */
export function useApplyReferralCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (referralCode: string) => {
      const { data, error } = await supabase.rpc('apply_referral', {
        p_referee_id: user!.id,
        p_referral_code: referralCode,
      });
      if (error) throw error;
      return data as { success: boolean; error?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
    },
  });
}

/**
 * Admin: Lấy toàn bộ danh sách referral kèm thông tin user.
 */
export function useAdminGetReferrals() {
  return useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_referrals');
      if (error) {
        console.error('Error fetching admin referrals:', error);
        return [] as ReferralInfo[];
      }
      return (data ?? []) as ReferralInfo[];
    },
    retry: false,
  });
}

/**
 * Admin: Lấy chi tiết sản lượng hàng ngày của user trong khoảng thời gian.
 */
export function useAdminGetUserDailyEntries(
  userId: string | null,
  startDate: string | null,
  endDate: string | null
) {
  return useQuery({
    queryKey: ['admin-daily-entries', userId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_user_daily_entries', {
        p_user_id: userId!,
        p_start_date: startDate!,
        p_end_date: endDate!,
      });
      if (error) {
        console.error('Error fetching daily entries:', error);
        return [] as DailyEntry[];
      }
      return (data ?? []) as DailyEntry[];
    },
    enabled: !!userId && !!startDate && !!endDate,
  });
}

/**
 * Admin: Lấy danh sách công đoạn của 1 user bất kỳ (dùng để hiển thị tên
 * công đoạn khi xem lại sản lượng của user đó qua SanLuongDayCard).
 */
export function useAdminGetUserCongDoan(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user-cong-doan', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_user_cong_doan', {
        p_user_id: userId!,
      });
      if (error) {
        console.error('Error fetching user cong_doan:', error);
        return [] as CongDoan[];
      }
      return (data ?? []) as CongDoan[];
    },
    enabled: !!userId,
  });
}
