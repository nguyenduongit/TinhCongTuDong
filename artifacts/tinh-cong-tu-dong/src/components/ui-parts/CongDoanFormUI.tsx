import React from 'react';
import type { CongDoan } from '@/api';

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

  return (
    <FormWrapper 
      onSubmit={!readOnly ? (onSubmit as any) : undefined} 
      className={`bg-card border ${isEditing ? 'border-primary/50' : 'border-primary/30'} rounded-2xl squircle-xl p-4 shadow-[0_0_15px_rgba(212,168,67,0.1)] ${readOnly ? 'pointer-events-none' : ''}`}
    >
      {!isEditing && <h4 className="text-sm font-semibold text-primary mb-3">Thêm công đoạn mới</h4>}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block font-medium">Mã</label>
          <input 
            required 
            readOnly={readOnly}
            name="ma_cong_doan" 
            defaultValue={defaultValues?.ma_cong_doan} 
            placeholder={readOnly ? "5.2" : undefined}
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" 
          />
        </div>
        <div className="col-span-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block font-medium">Định mức</label>
          <input 
            required 
            readOnly={readOnly}
            type={readOnly ? "text" : "number"} 
            name="dinh_muc" 
            defaultValue={defaultValues?.dinh_muc || (readOnly ? "1000" : undefined)} 
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block font-medium">Tên công đoạn</label>
          <input 
            required 
            readOnly={readOnly}
            name="ten_cong_doan" 
            defaultValue={defaultValues?.ten_cong_doan} 
            placeholder={readOnly ? "Kiểm tra chất lượng" : undefined}
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" 
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block font-medium">Quy cách</label>
          <div className="flex gap-2">
            <input 
              readOnly={readOnly}
              type={readOnly ? "text" : "number"} 
              name="quy_cach_sl" 
              defaultValue={isEditing || readOnly ? qcParsed.sl : "270"} 
              placeholder={readOnly ? "270" : "Số lượng"} 
              className="w-2/3 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            />
            {readOnly ? (
               <div className="w-1/3 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground flex items-center justify-between">
                 <span className="capitalize">{qcParsed.unit}</span>
               </div>
            ) : (
              <select 
                name="quy_cach_unit" 
                defaultValue={qcParsed.unit} 
                className="w-1/3 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="hộp">Hộp</option>
                <option value="rổ">Rổ</option>
              </select>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button 
          type="button" 
          onClick={!readOnly ? onCancel : undefined} 
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
        >
          Hủy
        </button>
        <button 
          type={readOnly ? "button" : "submit"} 
          disabled={!readOnly && isPending} 
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-95"
        >
          {isPending ? 'Lưu...' : 'Lưu'}
        </button>
      </div>
    </FormWrapper>
  );
}
