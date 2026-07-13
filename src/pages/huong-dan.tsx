import { ChevronLeft, Database, Info, LineChart, FileText } from 'lucide-react';
import { useLocation } from 'wouter';
import { useListSanLuong, useListCongDoan } from '@/api';
import { getListCongDoanQueryKey } from '@/api';

import { CongDoanFormUI } from '@/components/ui-parts/CongDoanFormUI';
import { SanLuongFormUI } from '@/components/ui-parts/SanLuongFormUI';
import { HistoryDayCard } from '@/components/ui-parts/HistoryDayCard';
import { WeekSummaryCard, type WeekGroup } from '@/components/ui-parts/WeekSummaryCard';

import { format, differenceInCalendarWeeks, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { getCycleMonthFromDate, getCycleRange, getNowVNDateLocal, getTodayVNString } from '@/lib/date-utils';

export default function HuongDan() {
  const [, setLocation] = useLocation();

  // Load real data to use as examples if available
  const { data: sanLuongList = [] } = useListSanLuong();
  const { data: congDoanList = [] } = useListCongDoan({ query: { queryKey: getListCongDoanQueryKey() } });

  const getCongDoanName = (ma: string) => {
    const cd = congDoanList.find(c => c.ma_cong_doan === ma);
    return cd ? cd.ten_cong_doan : ma;
  };

  // Mock data fallbacks
  const fallbackCongDoan = { ma_cong_doan: '5.2', ten_cong_doan: 'Kiểm tra chất lượng', dinh_muc: 1000, quy_cach: '270 pcs/hộp' };
  
  // Try to use the most recent entry for realistic examples
  const latestEntry = sanLuongList.length > 0 ? sanLuongList[0] : null;

  // 1. Prepare data for CongDoanFormUI
  const sampleCongDoan = congDoanList.length > 0 ? congDoanList[0] : fallbackCongDoan;

  // 2. Prepare data for SanLuongFormUI
  const sampleSanLuongBlocks = latestEntry ? latestEntry.chi_tiet.map((ct, i) => {
    const cd = congDoanList.find(c => c.ma_cong_doan === ct.cong_doan);
    const cdDinhMuc = cd?.dinh_muc || 1;
    const p = Math.round((Number(ct.dinh_muc) / Number(cdDinhMuc)) * 100);
    return {
      id: i.toString(),
      congDoan: cd || { ma_cong_doan: ct.cong_doan } as any,
      soLuong: ct.so_luong.toString(),
      phanTram: p === 100 ? '' : p + '%'
    };
  }) : [
    { id: '1', congDoan: sampleCongDoan as any, soLuong: '1500', phanTram: '' }
  ];

  // 3. Prepare data for HistoryDayCard
  const todayStr = latestEntry ? latestEntry.ngay : getTodayVNString();
  const currentMonth = getCycleMonthFromDate(latestEntry ? new Date(latestEntry.ngay) : getNowVNDateLocal());
  const dayItems = latestEntry ? sanLuongList.filter(e => e.ngay === latestEntry.ngay) : [
    {
      id: 1,
      ngay: todayStr,
      thoi_gian_thuc_hien: 480,
      thoi_gian_ho_tro: 60,
      thong_ke_ngay: { tong_cong_sp: 1.5 },
      chi_tiet: [
        { cong_doan: sampleCongDoan.ma_cong_doan, so_luong: 1500, dinh_muc: sampleCongDoan.dinh_muc }
      ]
    } as any
  ];

  // 4. Prepare data for WeekSummaryCard
  const getSampleWeek = (): WeekGroup => {
    if (sanLuongList.length > 0) {
      const currentMonth = getCycleMonthFromDate(new Date(latestEntry!.ngay));
      const { start: cycleStart, end: cycleEnd } = getCycleRange(currentMonth);
      
      const date = parseISO(latestEntry!.ngay);
      const weekNum = differenceInCalendarWeeks(date, cycleStart, { weekStartsOn: 1 }) + 1;
      let wStart = startOfWeek(date, { weekStartsOn: 1 });
      let wEnd = endOfWeek(date, { weekStartsOn: 1 });
      if (wStart < cycleStart) wStart = cycleStart;
      if (wEnd > cycleEnd) wEnd = cycleEnd;

      const weekEntries = sanLuongList.filter(e => {
        const d = parseISO(e.ngay);
        return d >= wStart && d <= wEnd;
      });

      const stats: any = {};
      let tCongSp = 0;
      let tHoTro = 0;
      let tTime = 0;

      weekEntries.forEach(entry => {
        tCongSp += (entry.thong_ke_ngay as any)?.tong_cong_sp || 0;
        tHoTro += entry.thoi_gian_ho_tro || 0;
        tTime += (entry.thoi_gian_thuc_hien || 0) + (entry.thoi_gian_ho_tro || 0);

        entry.chi_tiet.forEach(ct => {
          if (!stats[ct.cong_doan]) stats[ct.cong_doan] = { so_luong: 0, cong_sp: 0 };
          stats[ct.cong_doan].so_luong += ct.so_luong;
        });

        const chiTietCong = (entry.thong_ke_ngay as any)?.chi_tiet_cong || {};
        Object.entries(chiTietCong).forEach(([cd, csp]: [string, any]) => {
          if (!stats[cd]) stats[cd] = { so_luong: 0, cong_sp: 0 };
          stats[cd].cong_sp += csp;
        });
      });

      return {
        weekNum,
        startDate: wStart,
        endDate: wEnd,
        isCurrentWeek: false,
        isLastWeek: false,
        totalCongSp: tCongSp,
        totalHoTroPhut: tHoTro,
        totalTime: tTime,
        congDoanStats: stats
      };
    }

    // Fallback dummy week
    return {
      weekNum: 2,
      startDate: new Date(),
      endDate: new Date(),
      isCurrentWeek: true,
      isLastWeek: false,
      totalCongSp: 6.000,
      totalHoTroPhut: 60,
      totalTime: 480 * 6,
      congDoanStats: {
        [sampleCongDoan.ma_cong_doan]: { so_luong: 6000, cong_sp: 6.000 }
      }
    };
  };

  const sampleWeek = getSampleWeek();

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative bg-background min-h-[100dvh] flex flex-col shadow-2xl">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-primary/5 blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        {/* Header */}
        <header className="flex items-center gap-3 p-5 pt-12 border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-20">
          <button 
            onClick={() => setLocation('/cai-dat')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors outline-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex-1">Hướng dẫn sử dụng</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-5 pb-12 flex flex-col gap-10 relative z-10">
          
          <div className="text-sm text-muted-foreground leading-relaxed">
            Chào mừng bạn đến với <span className="font-bold text-primary">Tính Công Tự Động</span>. Vui lòng đọc kỹ các hướng dẫn bên dưới để hiểu rõ cách hoạt động của ứng dụng thông qua các giao diện thực tế.
          </div>

          {/* Section 1: Quản lý Công Đoạn */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">1. Hướng dẫn thêm công đoạn</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bạn vào mục Cài đặt &gt; Quản lý công đoạn. Tại đây, nhấn vào nút <strong className="text-primary">+ Thêm</strong> để mở form thêm mới. 
              Bạn cần nhập đủ các thông tin quan trọng như <strong>Định mức</strong> (số lượng sản phẩm trên 1 công chuẩn) và <strong>Quy cách</strong>.
            </p>
            
            <CongDoanFormUI 
              readOnly 
              isEditing={false} 
              defaultValues={sampleCongDoan as any} 
            />
          </section>

          {/* Section 2: Thêm sản lượng */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">2. Hướng dẫn thêm sản lượng</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tại Trang chủ, nhấn nút <strong className="text-primary">+</strong> ở dưới cùng để nhập sản lượng. 
              Bạn chọn Mã công đoạn, điền Số lượng (SL) và % tỷ lệ. 
              Thời gian thực hiện (phút) là bắt buộc. Thời gian hỗ trợ (phút) là không bắt buộc.
            </p>

            <div className="p-4 bg-background rounded-2xl squircle-xl border border-border/50 shadow-sm relative overflow-hidden">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />
              <div className="text-lg font-bold text-foreground mb-4 px-2 tracking-tight">Thêm sản lượng</div>
              <SanLuongFormUI 
                readOnly
                ngay={todayStr}
                congDoanBlocks={sampleSanLuongBlocks}
                thoiGian={latestEntry?.thoi_gian_thuc_hien?.toString() || '480'}
                thoiGianHoTro={latestEntry?.thoi_gian_ho_tro?.toString() || '60'}
              />
            </div>
          </section>

          {/* Section 3: Xem lịch sử theo ngày */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">3. Xem Lịch sử và Thống kê theo Ngày</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Toàn bộ dữ liệu bạn nhập trong ngày sẽ được tự động gộp lại thành một bảng tóm tắt nằm ở trang Lịch sử. 
              Tại đây, bạn có thể nhanh chóng xem được <strong>Tổng số công đạt được</strong> và <strong>Tổng số phút thực hiện</strong> trong ngày đó. Bạn cũng có thể xem lại hoặc chỉnh sửa chi tiết từng mã công đoạn mình đã nhập.
            </p>

            <HistoryDayCard 
              readOnly
              dateStr={todayStr}
              dateHeader={latestEntry ? "Ngày nhập gần nhất" : "Hôm nay"}
              items={dayItems}
              getCongDoanName={getCongDoanName}
              getCongDoanDinhMuc={(ma) => {
                const cd = congDoanList.find(c => c.ma_cong_doan === ma);
                return cd ? Number(cd.dinh_muc) : 1;
              }}
            />
          </section>

          {/* Section 4: Theo dõi báo cáo theo tuần */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <LineChart className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-foreground">4. Theo dõi Báo cáo theo Tuần</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tại trang Báo cáo, toàn bộ số lượng sản phẩm bạn làm được sẽ tự động cộng dồn lại theo từng Tuần <strong>(dựa trên chu kỳ tính công từ ngày 21 tháng này đến ngày 20 tháng sau)</strong>. 
              Bảng thống kê tuần giúp bạn nhìn lại trong tuần qua mình đã làm được tổng cộng bao nhiêu sản phẩm cho mỗi mã, và quy đổi ra được bao nhiêu <strong>Công Sản Phẩm (Công SP)</strong>.
            </p>

            <WeekSummaryCard 
              readOnly
              week={sampleWeek}
              getCongDoanName={getCongDoanName}
            />
          </section>

        </div>
      </div>
    </div>
  );
}
