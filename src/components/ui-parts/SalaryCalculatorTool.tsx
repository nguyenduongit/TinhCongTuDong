import React, { useState, useEffect } from 'react';
import { X, Calculator, Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SalaryCalculatorToolProps {
  onClose: () => void;
}

const FIELD_KEYS = {
  I: ['1_1', '1_2', '1_3', '1_4', '1_5', '1_6', '1_7', '1_8', '1_9', '1_10', '1_11', '1_12', '1_13', '1_14', '1_15', '1_16', '1_17'],
  II: ['2_1', '2_2', '2_3', '2_4', '2_5', '2_6', '2_7'],
  III: ['3_1', '3_2', '3_3', '3_4'],
  V: ['5_1', '5_2', '5_3', '5_4', '5_5', '5_6'],
};

export function SalaryCalculatorTool({ onClose }: SalaryCalculatorToolProps) {
  const { user, refetchUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (sessionUser?.user_metadata?.salary_config) {
        setFormData(sessionUser.user_metadata.salary_config);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (key: string, value: string) => {
    // Chỉ giữ lại số
    const numStr = value.replace(/\D/g, '');
    const num = numStr ? parseInt(numStr, 10) : 0;
    setFormData(prev => ({ ...prev, [key]: num }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { salary_config: formData }
      });
      if (error) throw error;
      toast.success("Đã lưu cấu hình lương mặc định");
    } catch (err: any) {
      toast.error("Lỗi khi lưu: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatVND = (val: number) => val ? val.toLocaleString('vi-VN') : '';

  const sumI = FIELD_KEYS.I.reduce((sum, k) => sum + (formData[k] || 0), 0);
  const sumII = FIELD_KEYS.II.reduce((sum, k) => sum + (formData[k] || 0), 0);
  const sumIII = FIELD_KEYS.III.reduce((sum, k) => sum + (formData[k] || 0), 0);
  const sumV = FIELD_KEYS.V.reduce((sum, k) => sum + (formData[k] || 0), 0);

  const netIncome = sumI + sumII + sumIII - sumV;

  const inputStyle = "text-right w-32 md:w-40 font-medium";

  const renderField = (id: string, label: string) => (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
      <Label htmlFor={id} className="text-[13px] font-medium text-foreground/80 flex-1 pr-2 leading-tight">
        {label}
      </Label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={formatVND(formData[id] || 0)}
        onChange={(e) => handleChange(id, e.target.value)}
        className={`h-9 rounded-md bg-background border-border/60 shadow-sm focus-visible:ring-1 focus-visible:ring-primary ${inputStyle}`}
        placeholder=""
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-border/50 bg-card z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Tính Lương</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Theo cấu trúc phiếu lương</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 text-xs bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 hover:text-purple-700 border-purple-500/20"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Lưu
          </Button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* BODY (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* LƯƠNG CƠ BẢN */}
        <div className="px-4 py-3 bg-secondary/10 border-b-8 border-secondary/30">
          {renderField('1_0', 'Lương cơ bản (Basic salary)')}
        </div>

        <Accordion type="single" collapsible defaultValue="i" className="w-full">

          {/* I. TỔNG TIỀN LƯƠNG */}
          <AccordionItem value="i" className="border-b-8 border-secondary/30">
            <AccordionTrigger className="hover:no-underline px-5 py-4 bg-card sticky top-0 z-10 shadow-sm group">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-bold text-[14px] text-blue-600 uppercase tracking-wider">I. Tổng tiền lương</span>
                <span className="font-bold text-[14px] text-blue-600 group-hover:text-blue-700 transition-colors">
                  {formatVND(sumI)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 bg-card space-y-1">
              {renderField('1_1', '1.1 Làm việc ngày thường')}
              {renderField('1_2', '1.2 Làm việc ngày lễ')}
              {renderField('1_3', '1.3 Nghỉ hưởng lương')}
              {renderField('1_4', '1.4 Nghỉ phép năm')}
              {renderField('1_5', '1.5 Nghỉ chế độ')}
              {renderField('1_6', '1.6 Nghỉ ngừng việc')}
              {renderField('1_7', '1.7 Làm việc từ xa (WFH)')}
              {renderField('1_8', '1.8 Làm ca đêm')}
              {renderField('1_9', '1.9 Tăng ca ngày thường')}
              {renderField('1_10', '1.10 Tăng ca ngày nghỉ')}
              {renderField('1_11', '1.11 Tăng ca ngày nghỉ lễ')}
              {renderField('1_12', '1.12 Tăng ca ca 3')}
              {renderField('1_13', '1.13 Thưởng năng suất')}
              {renderField('1_14', '1.14 Phụ cấp đào tạo')}
              {renderField('1_15', '1.15 Trách nhiệm')}
              {renderField('1_16', '1.16 Phụ cấp bổ sung')}
              {renderField('1_17', '1.17 Phép năm chưa sử dụng')}
            </AccordionContent>
          </AccordionItem>

          {/* II. TỔNG PHỤ CẤP */}
          <AccordionItem value="ii" className="border-b-8 border-secondary/30">
            <AccordionTrigger className="hover:no-underline px-5 py-4 bg-card sticky top-0 z-10 shadow-sm group">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-bold text-[14px] text-indigo-500 uppercase tracking-wider">II. Tổng phụ cấp</span>
                <span className="font-bold text-[14px] text-indigo-500 group-hover:text-indigo-600 transition-colors">
                  {formatVND(sumII)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 bg-card space-y-1">
              {renderField('2_1', '2.1 Tiền ăn giữa ca')}
              {renderField('2_2', '2.2 Trợ cấp tuân thủ')}
              {renderField('2_3', '2.3 Máy 8')}
              {renderField('2_4', '2.4 Làm ca 2')}
              {renderField('2_5', '2.5 Hỗ trợ con nhỏ')}
              {renderField('2_6', '2.6 Trợ cấp hành kinh')}
              {renderField('2_7', '2.7 Phụ cấp bổ sung')}
            </AccordionContent>
          </AccordionItem>

          {/* III. TỔNG THƯỞNG */}
          <AccordionItem value="iii" className="border-b-8 border-secondary/30">
            <AccordionTrigger className="hover:no-underline px-5 py-4 bg-card sticky top-0 z-10 shadow-sm group">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-bold text-[14px] text-amber-500 uppercase tracking-wider">III. Tổng thưởng</span>
                <span className="font-bold text-[14px] text-amber-500 group-hover:text-amber-600 transition-colors">
                  {formatVND(sumIII)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 bg-card space-y-1">
              {renderField('3_1', '3.1 Gắn bó + Tay nghề')}
              {renderField('3_2', '3.2 Thưởng Tuyển dụng')}
              {renderField('3_3', '3.3 Thưởng tháng 13+KPI')}
              {renderField('3_4', '3.4 Trợ cấp thôi việc')}
            </AccordionContent>
          </AccordionItem>

          {/* V. TỔNG KHẤU TRỪ */}
          <AccordionItem value="v" className="border-b-0">
            <AccordionTrigger className="hover:no-underline px-5 py-4 bg-card sticky top-0 z-10 shadow-sm group">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-bold text-[14px] text-red-500 uppercase tracking-wider">V. Tổng khấu trừ</span>
                <span className="font-bold text-[14px] text-red-500 group-hover:text-red-600 transition-colors">
                  -{formatVND(sumV)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 bg-card space-y-1">
              {renderField('5_1', '5.1 Bảo hiểm xã hội (8%)')}
              {renderField('5_2', '5.2 Bảo hiểm y tế (1.5%)')}
              {renderField('5_3', '5.3 Bảo hiểm thất nghiệp (1%)')}
              {renderField('5_4', '5.4 Thuế TNCN')}
              {renderField('5_5', '5.5 Tạm ứng')}
              {renderField('5_6', '5.6 Khác')}
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

      {/* FIXED FOOTER */}
      <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border/80 px-4 py-5 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center text-emerald-500">
          <span className="text-[15px] font-black uppercase tracking-widest">Lương thực lãnh</span>
          <span className="text-2xl font-black">{formatVND(netIncome)} đ</span>
        </div>
      </div>
    </div>
  );
}
