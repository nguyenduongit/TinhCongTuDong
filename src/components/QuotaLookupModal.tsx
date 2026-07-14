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
      <DialogContent className="max-w-[430px] p-0 gap-0 overflow-hidden flex flex-col h-[85vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-4 pb-2 shrink-0 border-b border-border/30 bg-background/50 relative z-10">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Tra cứu định mức
          </DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập mã hoặc tên công đoạn..."
              className="pl-10 bg-secondary/50 border-border/50 h-12 text-base rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 bg-secondary/10 relative z-0 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <AnimatePresence mode="popLayout">
            {!debouncedSearch.trim() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
                  <Search className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm font-medium">Gõ từ khóa để tra cứu</p>
              </motion.div>
            )}

            {debouncedSearch.trim() && !isLoading && !isError && (!results || results.length === 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3"
              >
                <p className="text-sm font-medium">Không tìm thấy kết quả nào</p>
              </motion.div>
            )}

            {isError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center h-full text-destructive gap-3"
              >
                <p className="text-sm font-medium">Lỗi kết nối đến máy chủ. Vui lòng thử lại.</p>
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
                    className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h4 className="font-bold text-foreground text-sm leading-tight line-clamp-2">
                        {item.product_name}
                      </h4>
                      <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                        {item.product_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-hide snap-x" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                      {[
                        { label: '0.9', val: item.level_0_9 },
                        { label: '1.0', val: item.level_1_0 },
                        { label: '1.1', val: item.level_1_1 },
                        { label: '2.0', val: item.level_2_0 },
                        { label: '2.1', val: item.level_2_1 },
                        { label: '2.2', val: item.level_2_2 },
                        { label: '2.5', val: item.level_2_5 },
                      ].map((lv) => (
                        <div 
                          key={lv.label} 
                          className="flex-1 min-w-[46px] snap-center flex flex-col items-center justify-center rounded-xl py-2 px-0.5 border bg-secondary/40 border-transparent"
                        >
                          <span className="text-[10px] uppercase font-bold mb-0.5 text-blue-400/80">
                            {lv.label}
                          </span>
                          <span className="text-xs font-bold text-foreground">
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
