import React from 'react';
import { X, Plus } from 'lucide-react';
import type { CongDoan } from '@/api';

export interface CongDoanBlock {
  id: string;
  congDoan: CongDoan | null;
  soLuong: string;
  phanTram: string;
}

export interface SanLuongFormUIProps {
  // Common
  readOnly?: boolean;
  readOnlyNgay?: boolean;
  isPending?: boolean;
  submitText?: string;
  
  // State
  ngay: string;
  congDoanBlocks: CongDoanBlock[];
  thoiGian: string;
  thoiGianHoTro: string;

  // Handlers
  setNgay?: (val: string) => void;
  setThoiGian?: (val: string) => void;
  setThoiGianHoTro?: (val: string) => void;
  openCongDoanModal?: (index: number) => void;
  handleBlockSoLuongChange?: (id: string, val: string) => void;
  handleBlockPhanTramChange?: (id: string, val: string) => void;
  handleRemoveBlock?: (id: string) => void;
  handleAddBlock?: () => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function SanLuongFormUI({
  readOnly,
  readOnlyNgay,
  isPending,
  submitText = 'Lưu sản lượng',
  ngay,
  congDoanBlocks,
  thoiGian,
  thoiGianHoTro,
  setNgay,
  setThoiGian,
  setThoiGianHoTro,
  openCongDoanModal,
  handleBlockSoLuongChange,
  handleBlockPhanTramChange,
  handleRemoveBlock,
  handleAddBlock,
  onSubmit
}: SanLuongFormUIProps) {
  const FormWrapper = readOnly ? 'div' : 'form';

  return (
    <FormWrapper 
      onSubmit={!readOnly ? (onSubmit as any) : undefined} 
      className={`flex flex-col flex-1 min-h-0 ${readOnly ? 'pointer-events-none' : ''}`}
    >
      <div className="flex flex-col gap-5 flex-1 overflow-y-auto pb-4 shrink [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Ngày</label>
        <input 
          type="date" 
          required
          readOnly={readOnly || readOnlyNgay}
          value={ngay}
          onChange={e => !(readOnly || readOnlyNgay) && setNgay?.(e.target.value)}
          className={`w-full bg-card border border-border/50 rounded-xl squircle-lg px-4 py-3.5 text-base text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all [color-scheme:dark] ${(readOnly || readOnlyNgay) ? 'pointer-events-none opacity-80' : ''}`}
        />
      </div>

      <div className="flex flex-col gap-3">
        {congDoanBlocks.map((block, index) => (
          <div key={block.id} className="flex gap-2 items-center">
            <div 
              onClick={() => !readOnly && openCongDoanModal?.(index)}
              className={`flex-1 min-w-0 bg-card border border-border/50 rounded-xl squircle-lg px-4 py-3.5 flex justify-center items-center ${readOnly ? '' : 'cursor-pointer hover:border-primary/50 transition-colors'}`}
            >
              {block.congDoan ? (
                <span className="text-base text-primary font-bold">{block.congDoan.ma_cong_doan}</span>
              ) : (
                <span className="text-base text-muted-foreground">Công đoạn</span>
              )}
            </div>
            
            {readOnly ? (
              <div className="flex-1 min-w-0 bg-card border border-border/50 rounded-xl squircle-lg px-3 py-3.5 text-base font-bold text-foreground text-center">
                {block.soLuong || 'SL'}
              </div>
            ) : (
              <input 
                type="number" 
                required
                min="1"
                value={block.soLuong}
                onChange={e => handleBlockSoLuongChange?.(block.id, e.target.value)}
                placeholder="SL"
                className="flex-1 min-w-0 bg-card border border-border/50 rounded-xl squircle-lg px-3 py-3.5 text-base font-bold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            )}
            
            {readOnly ? (
              <div className="flex-1 min-w-0 bg-card border border-border/50 rounded-xl squircle-lg px-3 py-3.5 text-base font-bold text-foreground text-center">
                {block.phanTram || '%'}
              </div>
            ) : (
              <input 
                type="text" 
                inputMode="numeric"
                required
                value={block.phanTram}
                onFocus={() => {
                  if (block.phanTram.includes('%')) {
                    handleBlockPhanTramChange?.(block.id, block.phanTram.replace('%', ''));
                  }
                }}
                onBlur={() => {
                  if (block.phanTram && !block.phanTram.includes('%')) {
                    handleBlockPhanTramChange?.(block.id, block.phanTram + '%');
                  }
                }}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9%]/g, '');
                  handleBlockPhanTramChange?.(block.id, val);
                }}
                placeholder="%"
                className="flex-1 min-w-0 bg-card border border-border/50 rounded-xl squircle-lg px-3 py-3.5 text-base font-bold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center"
              />
            )}
            
            {!readOnly && congDoanBlocks.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveBlock?.(block.id)}
                className="w-12 h-12 flex items-center justify-center rounded-xl squircle-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        
        {!readOnly && (
          <button
            type="button"
            onClick={handleAddBlock}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl squircle-lg border border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Thêm công đoạn</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Thời gian thực hiện <span className="normal-case font-normal">(phút)</span></label>
        {readOnly ? (
          <div className="w-full bg-card border border-border/50 rounded-xl squircle-lg px-4 py-3.5 text-xl font-bold text-foreground text-center">
            {thoiGian || '0'}
          </div>
        ) : (
          <input 
            type="number" 
            required
            min="1"
            value={thoiGian}
            onChange={e => setThoiGian?.(e.target.value)}
            placeholder="0"
            className="w-full bg-card border border-border/50 rounded-xl squircle-lg px-4 py-3.5 text-xl font-bold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        )}
      </div>
      
      {(!readOnly || (readOnly && thoiGianHoTro && thoiGianHoTro !== '0')) && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Thời gian hỗ trợ <span className="normal-case font-normal">(phút)</span></label>
          {readOnly ? (
            <div className="w-full bg-card border border-border/50 rounded-xl squircle-lg px-4 py-3.5 text-xl font-bold text-foreground text-center">
              {thoiGianHoTro}
            </div>
          ) : (
            <input 
              type="number" 
              min="0"
              value={thoiGianHoTro}
              onChange={e => setThoiGianHoTro?.(e.target.value)}
              placeholder="0"
              className="w-full bg-card border border-border/50 rounded-xl squircle-lg px-4 py-3.5 text-xl font-bold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          )}
        </div>
      )}

      </div>

      <div className="shrink-0 pt-4 pb-8 bg-background">
        {readOnly ? (
          <div className="w-full h-14 rounded-xl squircle-lg bg-primary text-primary-foreground text-base font-bold shadow-[0_0_20px_rgba(212,168,67,0.3)] flex items-center justify-center">
            Lưu sản lượng
          </div>
        ) : (
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full h-14 rounded-xl squircle-lg bg-primary text-primary-foreground text-base font-bold shadow-[0_0_20px_rgba(212,168,67,0.3)] disabled:opacity-50 disabled:shadow-none transition-transform active:scale-[0.98]"
          >
            {isPending ? 'Đang lưu...' : submitText}
          </button>
        )}
      </div>
    </FormWrapper>
  );
}
