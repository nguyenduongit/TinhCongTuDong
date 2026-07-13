import React, { useState } from 'react';
import { 
  format, addMonths, subMonths,
  startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, isToday, parseISO
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Coffee, X, Plus, CalendarDays } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useListLichTrinh, 
  useUpsertLichTrinh, 
  useDeleteLichTrinh,
  getListLichTrinhQueryKey
} from '@/api';
import { getCycleMonthFromDate, getCycleRangeStrings, getCycleRange } from '@/lib/date-utils';
import { toast } from 'sonner';

interface ScheduleManagerProps {
  onClose?: () => void;
}

export function ScheduleManager({ onClose }: ScheduleManagerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Lấy data lịch trình của kỳ công đang xem
  const cycleMonth = getCycleMonthFromDate(currentDate);
  const { start: cycleStart, end: cycleEnd } = getCycleRange(cycleMonth);
  
  const queryClient = useQueryClient();
  
  const { data: schedules = [], isLoading } = useListLichTrinh({
    startDate: format(cycleStart, 'yyyy-MM-dd'),
    endDate: format(cycleEnd, 'yyyy-MM-dd')
  });

  const upsertMutation = useUpsertLichTrinh();
  const deleteMutation = useDeleteLichTrinh();

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Render lịch
  const calendarStart = startOfWeek(cycleStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(cycleEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const currentSchedule = schedules.find(s => s.ngay === selectedDateStr);

  // Form State
  const [formType, setFormType] = useState<'tang_ca' | 'nghi_phep'>(currentSchedule?.loai as any || 'tang_ca');
  const [soPhut, setSoPhut] = useState<number>(currentSchedule?.so_phut || 0);

  // Update form when selecting a new date
  React.useEffect(() => {
    if (currentSchedule) {
      setFormType(currentSchedule.loai as any);
      setSoPhut(currentSchedule.so_phut);
    } else {
      setFormType('tang_ca');
      setSoPhut(0);
    }
  }, [selectedDateStr, currentSchedule?.ngay, currentSchedule?.loai, currentSchedule?.so_phut]);

  const handleSave = async () => {
    await upsertMutation.mutateAsync({
      ngay: selectedDateStr,
      loai: formType,
      so_phut: soPhut
    });
    queryClient.invalidateQueries({ queryKey: ['/api/lich-trinh'] });
    toast.success('Đã lưu lịch trình');
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ ngay: selectedDateStr });
    queryClient.invalidateQueries({ queryKey: ['/api/lich-trinh'] });
    toast.success('Đã xóa lịch trình');
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h2 className="text-lg font-bold text-foreground capitalize">
            Kỳ công tháng {format(cycleMonth, 'M/yyyy')}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={nextMonth} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 px-4 py-2 border-b border-border/50">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
          <div key={d} className={`text-center text-[11px] font-bold ${i === 6 ? 'text-rose-500/80' : 'text-muted-foreground/50'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 px-4 py-2">
        {calendarDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentCycle = day >= cycleStart && day <= cycleEnd;
          const isTodayDate = isToday(day);
          const dayStr = format(day, 'yyyy-MM-dd');
          const schedule = schedules.find(s => s.ngay === dayStr);
          
          const isSixRows = calendarDays.length > 35;
          const isSunday = day.getDay() === 0;

          return (
            <div 
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`${isSixRows ? 'h-[46px]' : 'aspect-square'} w-full rounded-xl squircle-lg flex flex-col items-center justify-center relative cursor-pointer border-2 transition-all duration-200
                ${!isCurrentCycle ? 'opacity-30' : 'opacity-100'}
                ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border'}
                ${isTodayDate && !isSelected ? 'bg-secondary' : ''}
              `}
            >
              <span className={`text-sm font-semibold 
                ${isSelected ? 'text-primary' : (isSunday ? 'text-rose-500' : 'text-foreground')}
              `}>
                {format(day, 'd')}
              </span>
              
              {/* Markers */}
              {schedule && (
                <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${schedule.loai === 'tang_ca' ? 'bg-blue-500' : 'bg-rose-500'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Container */}
      <div className="flex-1 bg-secondary/20 border-t border-border/50 p-4 flex flex-col overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">
            Ngày {format(selectedDate, 'dd/MM/yyyy')}
          </span>
        </div>

        <div className="flex bg-secondary/50 rounded-xl squircle-lg p-1 mb-4">
          <button 
            onClick={() => setFormType('tang_ca')}
            disabled={currentSchedule?.loai === 'nghi_phep'}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${formType === 'tang_ca' ? 'bg-blue-500 text-white' : 'text-muted-foreground hover:bg-secondary'} ${currentSchedule?.loai === 'nghi_phep' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Clock className="w-4 h-4" /> Tăng ca
          </button>
          <button 
            onClick={() => setFormType('nghi_phep')}
            disabled={currentSchedule?.loai === 'tang_ca'}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${formType === 'nghi_phep' ? 'bg-rose-500 text-white' : 'text-muted-foreground hover:bg-secondary'} ${currentSchedule?.loai === 'tang_ca' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Coffee className="w-4 h-4" /> Nghỉ phép
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-foreground">
            {formType === 'tang_ca' ? 'Số phút làm thêm:' : 'Số phút vắng mặt:'}
          </label>
          
          <input 
            type="number" 
            value={soPhut.toString()}
            onChange={(e) => setSoPhut(e.target.value === '' ? 0 : Number(e.target.value))}
            className="w-full bg-background border border-border/50 rounded-xl squircle-lg px-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          {/* Quick actions */}
          <div className="flex gap-2">
            {formType === 'tang_ca' ? (
              <>
                <button onClick={() => setSoPhut(60)} className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-semibold text-foreground">+1 tiếng</button>
                <button onClick={() => setSoPhut(120)} className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-semibold text-foreground">+2 tiếng</button>
                <button onClick={() => setSoPhut(180)} className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-semibold text-foreground">+3 tiếng</button>
                <button onClick={() => setSoPhut(240)} className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-semibold text-foreground">+4 tiếng</button>
              </>
            ) : (
              <>
                <button onClick={() => setSoPhut(240)} className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-semibold text-foreground">Nửa ngày</button>
                <button onClick={() => setSoPhut(480)} className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-semibold text-foreground">Cả ngày</button>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-auto pt-4">
          <button 
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            className="flex-1 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl squircle-lg hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {upsertMutation.isPending ? 'Đang lưu...' : 'Lưu lịch trình'}
          </button>

          {currentSchedule && (
            <button 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-rose-500/10 text-rose-500 font-bold py-3.5 rounded-xl squircle-lg hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <X className="w-5 h-5" />
              <span>Xóa lịch trình</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


