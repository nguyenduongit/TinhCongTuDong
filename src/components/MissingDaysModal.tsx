import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarX, Check, Plus, Loader2 } from 'lucide-react';
import { useConfirmNgayNghi } from '@/api';

export interface MissingDaysModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingDays: Date[];
  onInputForDay: (dateStr: string) => void;
}

export function MissingDaysModal({ open, onOpenChange, missingDays, onInputForDay }: MissingDaysModalProps) {
  const confirmMutation = useConfirmNgayNghi();
  const [loadingDays, setLoadingDays] = useState<Record<string, boolean>>({});

  const handleConfirm = async (dateStr: string) => {
    setLoadingDays(prev => ({ ...prev, [dateStr]: true }));
    try {
      await confirmMutation.mutateAsync(dateStr);
    } finally {
      setLoadingDays(prev => ({ ...prev, [dateStr]: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-background border-border/50 shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <CalendarX className="w-4 h-4 text-amber-500" />
            </div>
            Ngày chưa nhập
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Bạn có <strong className="text-amber-500">{missingDays.length} ngày</strong> làm việc chưa có dữ liệu sản lượng.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {missingDays.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-foreground font-medium">Tuyệt vời!</p>
              <p className="text-sm text-muted-foreground">Bạn đã nhập đầy đủ dữ liệu.</p>
            </div>
          ) : (
            missingDays.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayName = format(date, 'EEEE', { locale: vi });
              const isSaturday = getDay(date) === 6;
              const isLoading = loadingDays[dateStr];

              return (
                <div key={dateStr} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">
                      {format(date, 'dd/MM')}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {dayName} {isSaturday ? '(0.5 công)' : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleConfirm(dateStr)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Nghỉ
                    </button>
                    
                    <button
                      onClick={() => onInputForDay(dateStr)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" strokeWidth={3} />
                      Nhập
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
