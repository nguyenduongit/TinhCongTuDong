import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronLeft } from 'lucide-react';
import { useSearchDinhMuc, DinhMuc } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function QuotaLookupPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<DinhMuc | null>(null);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: results, isLoading, isError } = useSearchDinhMuc(debouncedSearch);

  // Lấy focus tự động hoặc không cần thiết nữa vì không còn ẩn hiện như modal

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden">
      <div className="w-full max-w-[430px] mx-auto bg-background flex flex-col h-[100dvh] relative">
        
        {/* Background effects */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent blur-[60px] pointer-events-none rounded-full transform -translate-y-1/2 z-0" />

        <header className="p-5 pb-4 shrink-0 border-b border-white/5 bg-transparent relative z-10">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <button 
              onClick={() => setLocation('/')}
              className="w-9 h-9 flex items-center justify-center -ml-2 rounded-full bg-white/5 text-muted-foreground border border-white/5 hover:text-foreground hover:bg-white/10 transition-colors outline-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Search className="w-4 h-4" />
            </div>
            Tra cứu định mức
          </h1>
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
        </header>

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
                    onClick={() => setSelectedItem(item)}
                    className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 hover:bg-card/60 transition-all cursor-pointer"
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
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[430px] bg-zinc-900 border border-white/10 rounded-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                <h3 className="text-lg font-bold text-foreground">Chi tiết định mức</h3>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto hide-scrollbar flex flex-col gap-5">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-2">
                  <span className="inline-flex self-start items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 uppercase tracking-wider">
                    {selectedItem.product_code}
                  </span>
                  <h4 className="font-bold text-foreground text-base leading-snug">
                    {selectedItem.product_name}
                  </h4>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Định mức theo bậc lương</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Bậc 1.0', val: selectedItem.level_1_0 },
                      { label: 'Bậc 1.1', val: selectedItem.level_1_1 },
                      { label: 'Bậc 2.0', val: selectedItem.level_2_0 },
                      { label: 'Bậc 2.1', val: selectedItem.level_2_1 },
                      { label: 'Bậc 2.2', val: selectedItem.level_2_2 },
                      { label: 'Bậc 2.5', val: selectedItem.level_2_5 },
                    ].map((lv) => (
                      <div key={lv.label} className="bg-black/20 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 mb-1">{lv.label}</span>
                        <span className="text-base font-black text-amber-400">{lv.val || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
