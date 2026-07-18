import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useGetThongTinLuong, useUpdateProfile, useGetSalaryTiers } from '@/api';
import { toast } from 'sonner';

export function ProfileModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const { data: initialData, isLoading: isLoadingProfile } = useGetThongTinLuong();
  const { data: salaryTiers = [], isLoading: isLoadingTiers } = useGetSalaryTiers();
  const updateMutation = useUpdateProfile();
  
  const isLoading = isLoadingProfile || isLoadingTiers;

  const [name, setName] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [gender, setGender] = useState('');
  const [tier, setTier] = useState('');

  useEffect(() => {
    if (open) {
      if (user) {
        setName(user.name || '');
      }
      if (initialData) {
        if (initialData.ngay_vao_cong_ty) {
          setJoinDate(initialData.ngay_vao_cong_ty);
        } else {
          setJoinDate('');
        }
        if (initialData.ngay_ky_hop_dong) {
          setContractDate(initialData.ngay_ky_hop_dong);
        } else {
          setContractDate('');
        }
        if (initialData.gioi_tinh) {
          setGender(initialData.gioi_tinh);
        } else {
          setGender('');
        }
        
        // Cập nhật mức lương cơ bản hiện tại dựa trên bậc lương từ DB
        if (initialData.bac_luong) {
          const tierStr = initialData.bac_luong;
          setTier(tierStr);
          // Tìm trong list salaryTiers mức lương tương ứng (nếu salaryTiers đã load)
          if (salaryTiers.length > 0) {
            const matched = salaryTiers.find(t => t.tier_code === tierStr);
            if (matched) {
              setBasicSalary(new Intl.NumberFormat('vi-VN').format(matched.base_salary));
            }
          }
        } else {
          setTier('');
        }
      }
    }
  }, [open, user, initialData, salaryTiers]);

  const handleTierChange = (selectedTier: string) => {
    setTier(selectedTier);
    const matchedTier = salaryTiers.find(t => t.tier_code === selectedTier);
    if (matchedTier) {
      setBasicSalary(new Intl.NumberFormat('vi-VN').format(matchedTier.base_salary));
    } else {
      setBasicSalary('');
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name,
        ngay_vao_cong_ty: joinDate || null,
        ngay_ky_hop_dong: contractDate || null,
        gioi_tinh: gender || null,
        bac_luong: tier || null,
      });
      toast.success('Cập nhật hồ sơ thành công!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
      console.error(error);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background border-border flex flex-col max-h-[90dvh] mx-auto max-w-[430px]">
        <DrawerHeader>
          <DrawerTitle>Chỉnh sửa hồ sơ</DrawerTitle>
          <DrawerDescription>Cập nhật thông tin cá nhân và thiết lập lương cơ bản.</DrawerDescription>
        </DrawerHeader>
        
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="profileName">Tên hiển thị</Label>
                <Input 
                  id="profileName" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên hiển thị..."
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profileGender">Giới tính</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="profileGender" className="h-12 rounded-xl">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      <SelectItem value="nam" className="rounded-lg">Nam</SelectItem>
                      <SelectItem value="nu" className="rounded-lg">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profileTier">Bậc lương</Label>
                  <Select value={tier} onValueChange={handleTierChange}>
                    <SelectTrigger id="profileTier" className="h-12 rounded-xl">
                      <SelectValue placeholder="Chọn bậc lương" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      {salaryTiers.map((t) => (
                        <SelectItem key={t.tier_code} value={t.tier_code} className="rounded-lg">
                          {t.tier_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileBasicSalary">Lương cơ bản (VNĐ) - Tự động theo bậc</Label>
                <Input 
                  id="profileBasicSalary" 
                  value={basicSalary}
                  readOnly
                  disabled
                  placeholder="Lương cơ bản..."
                  className="h-12 rounded-xl text-lg font-medium bg-white/5 border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profileJoinDate">Ngày vào công ty</Label>
                  <Input 
                    id="profileJoinDate" 
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileContractDate">Ngày ký HĐ</Label>
                  <Input 
                    id="profileContractDate" 
                    type="date"
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        <DrawerFooter className="pt-2">
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending || isLoading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Lưu thay đổi
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
