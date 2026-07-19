import React, { useState, useEffect } from 'react';
import type { CongDoan } from '@/api';
import { useGetDinhMucByCode, useGetThongTinLuong } from '@/api';
import { toast } from 'sonner';

export interface CongDoanFormUIProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  isPending?: boolean;
  defaultValues?: Partial<CongDoan>;
  isEditing?: boolean;
  readOnly?: boolean;
}

export function parseQuyCach(qc: string | null | undefined) {
  if (!qc) return { sl: '', unit: 'hộp' };
  const match = qc.match(/^(\d+)\s*pcs\/(.+)$/i);
  if (match) return { sl: match[1], unit: match[2].toLowerCase() };
  return { sl: qc.replace(/\D/g, ''), unit: 'hộp' };
}

export function CongDoanFormUI({
  onSubmit,
  onCancel,
  isPending,
  defaultValues,
  isEditing,
  readOnly
}: CongDoanFormUIProps) {
  const qcParsed = parseQuyCach(defaultValues?.quy_cach);

  const FormWrapper = readOnly ? 'div' : 'form';

  const [maCongDoan, setMaCongDoan] = useState(defaultValues?.ma_cong_doan || '');
  const [debouncedMaCongDoan, setDebouncedMaCongDoan] = useState(maCongDoan);
  const { data: profile } = useGetThongTinLuong();
  const [bacLuong, setBacLuong] = useState<string>(profile?.bac_luong || '');
  const [tenCongDoan, setTenCongDoan] = useState(defaultValues?.ten_cong_doan || '');
  const [dinhMuc, setDinhMuc] = useState<number | string>(defaultValues?.dinh_muc || '');
  const [quyCachSl, setQuyCachSl] = useState(qcParsed.sl || '');
  const [quyCachUnit, setQuyCachUnit] = useState(qcParsed.unit || 'hộp');
  const [isQuyCachLocked, setIsQuyCachLocked] = useState(false);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMaCongDoan(maCongDoan);
    }, 300);
    return () => clearTimeout(timer);
  }, [maCongDoan]);

  const { data: dinhMucData } = useGetDinhMucByCode(debouncedMaCongDoan);

  // Auto lookups and reverse-lookups
  useEffect(() => {
    if (dinhMucData) {
      setTenCongDoan(dinhMucData.product_name);
      
      const activeBacLuong = profile?.bac_luong || bacLuong;
      if (!activeBacLuong) {
        setBacLuong('1.0');
        setDinhMuc(dinhMucData.level_1_0);
      } else {
        let val = 0;
        if (activeBacLuong === '1.0') val = dinhMucData.level_1_0;
        else if (activeBacLuong === '1.1') val = dinhMucData.level_1_1;
        else if (activeBacLuong === '2.0') val = dinhMucData.level_2_0;
        else if (activeBacLuong === '2.1') val = dinhMucData.level_2_1;
        else if (activeBacLuong === '2.2') val = dinhMucData.level_2_2;
        else if (activeBacLuong === '2.5') val = dinhMucData.level_2_5;
        setDinhMuc(val);
      }
      
      if (dinhMucData.quy_cach) {
        const parsed = parseQuyCach(dinhMucData.quy_cach);
        setQuyCachSl(parsed.sl);
        setQuyCachUnit(parsed.unit);
        setIsQuyCachLocked(true);
      } else {
        setIsQuyCachLocked(false);
      }
    } else if (!isEditing && !readOnly) {
      setTenCongDoan('');
      setDinhMuc('');
      setIsQuyCachLocked(false);
    }
  }, [dinhMucData, bacLuong, isEditing, defaultValues, readOnly]);

  return (
    <FormWrapper 
      onSubmit={!readOnly ? (onSubmit as any) : undefined} 
      className={`bg-black/40 backdrop-blur-md border ${isEditing ? 'border-blue-500/30' : 'border-primary/30'} rounded-3xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden ${readOnly ? 'pointer-events-none' : ''}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${isEditing ? 'bg-blue-500/10' : 'bg-primary/10'} rounded-full blur-[30px] -mr-16 -mt-16 pointer-events-none`} />
      
      {!isEditing && <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        Thêm công đoạn mới
      </h4>}
      {isEditing && <h4 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Sửa công đoạn
      </h4>}
      
      <div className="grid grid-cols-2 gap-3.5 mb-5 relative z-10">
        <div className="col-span-1">
          <label className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5 block font-bold pl-1">Mã</label>
          <input 
            required 
            readOnly={readOnly || isEditing}
            name="ma_cong_doan" 
            value={maCongDoan}
            onChange={(e) => setMaCongDoan(e.target.value)}
            placeholder={readOnly ? "5.2" : undefined}
            className={`w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground transition-all placeholder:text-zinc-600 font-medium shadow-inner ${readOnly || isEditing ? 'opacity-70 cursor-not-allowed outline-none' : 'outline-none focus:bg-black/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50'}`} 
          />
        </div>
        <div className="col-span-1">
          <label className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5 block font-bold pl-1">Bậc lương</label>
          <input type="hidden" name="bac_luong" value={bacLuong} />
          {readOnly || profile?.bac_luong ? (
            <div 
              onClick={() => {
                if (profile?.bac_luong && !readOnly) {
                  toast.info("Muốn đổi bậc lương hãy vào Hồ sơ cá nhân");
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground flex items-center font-medium opacity-70 cursor-not-allowed"
            >
              {bacLuong || '-'}
            </div>
          ) : (
            <div className="relative">
              <select 
                value={bacLuong}
                onChange={(e) => setBacLuong(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:bg-black/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium appearance-none shadow-inner cursor-pointer"
              >
                <option value="1.0" className="bg-background">1.0</option>
                <option value="1.1" className="bg-background">1.1</option>
                <option value="2.0" className="bg-background">2.0</option>
                <option value="2.1" className="bg-background">2.1</option>
                <option value="2.2" className="bg-background">2.2</option>
                <option value="2.5" className="bg-background">2.5</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          )}
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5 block font-bold pl-1">Tên công đoạn</label>
          <input 
            required 
            readOnly
            name="ten_cong_doan" 
            value={tenCongDoan} 
            placeholder={readOnly ? "Kiểm tra chất lượng" : undefined}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/70 outline-none transition-all placeholder:text-zinc-600 font-medium shadow-inner cursor-not-allowed opacity-80" 
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5 block font-bold pl-1">Định mức</label>
          <input 
            required 
            readOnly
            type={readOnly ? "text" : "number"} 
            name="dinh_muc" 
            value={dinhMuc} 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/70 outline-none transition-all font-medium shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-not-allowed opacity-80" 
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5 block font-bold pl-1">Quy cách (VD: 270 / hộp)</label>
          <div className="flex gap-2">
            <input 
              required={!isQuyCachLocked && !readOnly}
              readOnly={readOnly || isQuyCachLocked}
              type={readOnly || isQuyCachLocked ? "text" : "number"} 
              name="quy_cach_sl" 
              value={quyCachSl}
              onChange={e => setQuyCachSl(e.target.value)}
              placeholder="Số lượng"
              className={`w-2/3 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm transition-all placeholder:text-zinc-600 font-medium shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${readOnly || isQuyCachLocked ? 'text-foreground/70 outline-none cursor-not-allowed opacity-80' : 'text-foreground outline-none focus:bg-black/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50'}`} 
            />
            <input type="hidden" name="quy_cach_unit" value={quyCachUnit} />
            {readOnly || isQuyCachLocked ? (
               <div className="w-1/3 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/70 flex items-center justify-between font-medium cursor-not-allowed opacity-80">
                 <span className="capitalize">{quyCachUnit}</span>
               </div>
            ) : (
              <div className="w-1/3 relative">
                <select 
                  value={quyCachUnit}
                  onChange={e => setQuyCachUnit(e.target.value)}
                  className="w-full h-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:bg-black/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium appearance-none shadow-inner cursor-pointer"
                >
                  <option value="hộp" className="bg-background">Hộp</option>
                  <option value="rổ" className="bg-background">Rổ</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 relative z-10">
        <button 
          type="button" 
          onClick={!readOnly ? onCancel : undefined} 
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          Hủy
        </button>
        <button 
          type={readOnly ? "button" : "submit"} 
          disabled={!readOnly && isPending} 
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center min-w-[80px] ${
            isEditing 
              ? "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20" 
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
          }`}
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Lưu'
          )}
        </button>
      </div>
    </FormWrapper>
  );
}
