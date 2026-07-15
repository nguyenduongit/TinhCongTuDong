import React from 'react';
import { Drawer } from 'vaul';
import { format, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarX, Check, Plus, Loader2 } from 'lucide-react';

interface MissingDaysModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingDays: Date[];
  loadingDays: Record<string, boolean>;
  onConfirmNghi: (dateStr: string) => void;
  onOpenAddSanLuong: (dateStr: string) => void;
}

export function MissingDaysModal({ open, onOpenChange, missingDays, loadingDays, onConfirmNghi, onOpenAddSanLuong }: MissingDaysModalProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-background border-t border-border flex flex-col rounded-t-[2rem] h-[60vh] mt-24 fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] outline-none before:absolute before:top-0 before:left-0 before:right-0 before:h-24 before:bg-gradient-to-b before:from-primary/5 before:to-transparent before:pointer-events-none">
          <div className="p-4 bg-background rounded-t-[2rem] flex-1 flex flex-col relative min-h-0">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
            
            <Drawer.Title className="text-xl font-bold text-foreground mb-6 px-2 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <CalendarX className="w-4 h-4 text-amber-500" />
              </div>
              Cần nhập sản lượng
            </Drawer.Title>
            
            <div className="overflow-y-auto flex-1 px-2 pb-6 flex flex-col gap-3">
              {missingDays.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayName = format(date, 'EEEE', { locale: vi });
                const isSaturday = getDay(date) === 6;
                const isLoading = loadingDays[dateStr];

                return (
                  <div key={dateStr} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">
                        {format(date, 'dd/MM')}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {dayName} {isSaturday ? '(0.5 công)' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onConfirmNghi(dateStr)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Nghỉ
                      </button>

                      <button
                        onClick={() => {
                          onOpenChange(false);
                          setTimeout(() => onOpenAddSanLuong(dateStr), 300);
                        }}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3" strokeWidth={3} />
                        Nhập
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
