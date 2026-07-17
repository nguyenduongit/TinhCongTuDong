import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useSearchDinhMuc } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';

export function QuotaLookupModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: results, isLoading, isError } = useSearchDinhMuc(debouncedSearch);

  // Reset khi tắt/mở modal
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setDebouncedSearch('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[430px] p-0 gap-0 overflow-hidden flex flex-col h-[85vh] sm:h-[600px] rounded-t-[2rem] sm:rounded-[2rem] border-white/10 bg-background/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Background effects */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent blur-[60px] pointer-events-none rounded-full transform -translate-y-1/2 z-0" />

        <DialogHeader className="p-5 pb-4 shrink-0 border-b border-white/5 bg-transparent relative z-10">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Search className="w-4 h-4" />
            </div>
            Tra cứu định mức
          </DialogTitle>
          <div className="relative mt-4 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập mã hoặc tên công đoạn..."
              className="pl-12 pr-10 bg-black/20 border-white/10 h-13 py-3.5 text-base rounded-2xl focus-visible:ring-1 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 focus-visible:bg-black/40 transition-all placeholder:text-zinc-500 shadow-inner"
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 animate-spin" />
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 bg-transparent relative z-0 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <AnimatePresence mode="popLayout">
            {!debouncedSearch.trim() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3 opacity-60 mt-10"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 border border-white/5">
                  <Search className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-sm font-medium">Gõ từ khóa để tra cứu</p>
              </motion.div>
            )}

            {debouncedSearch.trim() && !isLoading && !isError && (!results || results.length === 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3 mt-10"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 border border-white/5">
                  <Search className="w-8 h-8 text-zinc-600 opacity-50" />
                </div>
                <p className="text-sm font-medium">Không tìm thấy kết quả nào</p>
              </motion.div>
            )}

            {isError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center h-full text-rose-500 gap-3 mt-10"
              >
                <p className="text-sm font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">Lỗi kết nối đến máy chủ. Vui lòng thử lại.</p>
              </motion.div>
            )}

            {results && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3 pb-8"
              >
                {results.map((item, index) => (
                  <motion.div
                    key={item.product_code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 hover:bg-card/60 transition-all"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500/50 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <h4 className="font-bold text-foreground text-[15px] leading-snug line-clamp-2">
                        {item.product_name}
                      </h4>
                      <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider shadow-sm">
                        {item.product_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide snap-x" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                      {[
                        { label: '1.1', val: item.level_1_1 },
                        { label: '2.0', val: item.level_2_0 },
                        { label: '2.1', val: item.level_2_1 },
                        { label: '2.2', val: item.level_2_2 },
                        { label: '2.5', val: item.level_2_5 },
                      ].map((lv) => (
                        <div 
                          key={lv.label} 
                          className="flex-1 min-w-[50px] snap-center flex flex-col items-center justify-center rounded-2xl py-2.5 px-1 border border-white/5 bg-black/20 shadow-inner group-hover:bg-black/30 transition-colors"
                        >
                          <span className="text-[10px] uppercase font-black mb-1 text-amber-400/80">
                            {lv.label}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {lv.val || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
