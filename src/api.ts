import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { computeCongSp, computeCongNhat, computeCongHoTro, computeWeeklyCongSp, truncate3, type ChiTietItem } from '@/lib/business-logic';

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

export type LichTrinh = {
  id: number;
  ngay: string;
  loai: 'tang_ca' | 'nghi_phep';
  so_phut: number;
};

// Query Keys
export const getListCongDoanQueryKey = () => ['cong-doan', 'list'];
export const getListSanLuongQueryKey = () => ['san-luong', 'list'];
export const getGetSanLuongDashboardQueryKey = () => ['san-luong', 'dashboard'];
export const getGetSanLuongBaoCaoQueryKey = (params: any) => ['san-luong', 'bao-cao', params];
export const getListLichTrinhQueryKey = (params?: any) => ['lich-trinh', 'list', params];

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

// --- LICH TRINH ---
export const useListLichTrinh = (params?: { startDate?: string, endDate?: string }, options: any = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: getListLichTrinhQueryKey(params),
    queryFn: async () => {
      let query = supabase.from('lich_trinh').select('*').eq('user_id', user?.id);
      if (params?.startDate) query = query.gte('ngay', params.startDate);
      if (params?.endDate) query = query.lte('ngay', params.endDate);
      const { data, error } = await query;
      if (error) throw error;
      return data as LichTrinh[];
    },
    enabled: !!user?.id && (options.query?.enabled !== false),
  });
};

export const useUpsertLichTrinh = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { ngay: string; loai: 'tang_ca' | 'nghi_phep'; so_phut: number }) => {
      const { data: existing } = await supabase.from('lich_trinh').select('id').eq('ngay', data.ngay).eq('user_id', user?.id).single();
      
      if (existing) {
        const { data: result, error } = await supabase.from('lich_trinh').update(data).eq('id', existing.id).select().single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase.from('lich_trinh').insert({ ...data, user_id: user?.id }).select().single();
        if (error) throw error;
        return result;
      }
    }
  });
};

export const useDeleteLichTrinh = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ ngay }: { ngay: string }) => {
      const { error } = await supabase.from('lich_trinh').delete().eq('ngay', ngay).eq('user_id', user?.id);
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
        const cong_sp = computeCongSp(ct.so_luong, dinh_muc, ct.cong_doan.startsWith('9'));
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
          const cong_sp = computeCongSp(ct.so_luong, dinh_muc, ct.cong_doan.startsWith('9'));
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

// --- CALCULATIONS FOR DASHBOARD / BAO CAO ---

function mapDbChiTiet(dbChiTietArray: any[]): ChiTietItem[] {
  return dbChiTietArray.map(ct => ({
    ma_cong_doan: ct.cong_doan,
    so_luong: Number(ct.so_luong) || 0,
    dinh_muc: Number(ct.dinh_muc) || 1
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

      const { data: rows, error } = await supabase.from('san_luong')
        .select('*')
        .eq('user_id', user?.id)
        .gte('ngay', minStartStr)
        .lte('ngay', maxEndStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!rows) return { stats: {}, todayEntries: [] };

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
        if (Array.isArray(r.chi_tiet)) weekItems.push(...mapDbChiTiet(r.chi_tiet));
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
        if (Array.isArray(r.chi_tiet)) group.items.push(...mapDbChiTiet(r.chi_tiet));
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
      };
    },
    enabled: !!user?.id && (options.query?.enabled !== false),
  });
};

export const useGetSanLuongBaoCao = (params: { month: string }, options: any = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: getGetSanLuongBaoCaoQueryKey(params),
    queryFn: async () => {
      const monthStr = params.month;
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

      const { data: rows, error } = await supabase.from('san_luong')
        .select('*')
        .eq('user_id', user?.id)
        .gte('ngay', cycleStartStr)
        .lte('ngay', cycleEndStr);

      if (error) throw error;
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
            const sp = ct.cong_sp !== undefined ? Number(ct.cong_sp) : computeCongSp(sl, dm, ma.startsWith('9'));
            
            if (!weekGroup.congDoanStats[ma]) weekGroup.congDoanStats[ma] = { so_luong: 0, cong_sp: 0 };
            weekGroup.congDoanStats[ma].so_luong += sl;
            weekGroup.congDoanStats[ma].cong_sp += sp; 
            
            weekGroup.items.push({ ma_cong_doan: ma, so_luong: sl, dinh_muc: dm });
          });
        }
      }

      const weekGroups = Array.from(weekMap.values());
      weekGroups.forEach(week => {
        week.totalCongSp = computeWeeklyCongSp(week.items);
      });
      weekGroups.sort((a, b) => b.weekNum - a.weekNum);

      const totalCongMonth = weekGroups.reduce((sum, week) => sum + week.totalCongSp + (week.totalHoTroPhut / 480), 0);

      return { weekGroups, totalCongMonth };
    },
    enabled: !!user?.id && (options.query?.enabled !== false),
  });
};
