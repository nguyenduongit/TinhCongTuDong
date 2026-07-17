# Spec: Công cụ tính lương nhân viên (theo mẫu phiếu lương estron)

## 1. Mục tiêu
Xây dựng một form/tool (web app) cho phép người dùng nhập các thông số đầu vào của một tháng làm việc và tự động tính ra **Lương thực lãnh (Net income)**, theo đúng công thức và cấu trúc phiếu lương của công ty (dựa trên mẫu phiếu lương thực tế, cấu trúc số La Mã I–VII).

## 2. Cấu trúc phiếu lương gốc (để tool tham chiếu format hiển thị)

```
I.   TỔNG TIỀN LƯƠNG (Salary income)
II.  TỔNG PHỤ CẤP (Allowance)
III. TỔNG THƯỞNG (Bonus)
IV.  TỔNG THU NHẬP / Gross pay = I + II + III
V.   TỔNG KHẤU TRỪ (Deduction)
VI.  NGÀY PHÉP TỒN (thông tin tham khảo, không ảnh hưởng tính toán)
VII. LƯƠNG THỰC LÃNH / Net income = IV - V
```

## 3. Input cần thu thập từ người dùng

### 3.1 Thông tin cơ bản
| Field | Kiểu | Ghi chú |
|---|---|---|
| `basicSalary` | number (VNĐ) | Lương cơ bản |
| `standardWorkdays` | number | Số ngày công chuẩn trong tháng (mặc định 22 hoặc 26, cho phép chỉnh) |
| `actualWorkdays` | number | Số ngày công thực tế đã làm (ngày thường) |
| `insuranceSalary` | number (VNĐ) | Lương đóng bảo hiểm (mặc định = basicSalary, cho phép override) |

### 3.2 Giờ tăng ca (OT) — MỖI LOẠI CÓ HỆ SỐ KHÁC NHAU, phải tách riêng input
| Field | Kiểu | Hệ số | Ghi chú |
|---|---|---|---|
| `otNormalHours` | number (giờ) | ×1.5 | OT ngày thường |
| `otWeeklyRestHours` | number (giờ) | ×2.0 | OT ngày nghỉ hàng tuần |
| `otPublicHolidayHours` | number (giờ) | ×3.0 | OT ngày lễ/Tết |
| `nightShiftHours` | number (giờ) | +30% | Làm ca đêm (22h-6h), cộng thêm 30% đơn giá giờ ngày thường |
| `nightShiftOtHours` | number (giờ) | +20% thêm | Nếu vừa là OT vừa là ca đêm, cộng dồn thêm 20% nữa (tổng ~90% tùy loại OT) |

**Công thức đơn giá giờ:**
```
hourlyRate = basicSalary / (standardWorkdays * 8)
```

**Công thức tiền OT từng loại:**
```
otNormalPay        = hourlyRate * otNormalHours * 1.5
otWeeklyRestPay     = hourlyRate * otWeeklyRestHours * 2.0
otPublicHolidayPay  = hourlyRate * otPublicHolidayHours * 3.0
nightShiftPay       = hourlyRate * nightShiftHours * 0.3   // phần cộng thêm
nightShiftOtExtra   = hourlyRate * nightShiftOtHours * 0.2 // phần cộng dồn thêm nếu OT + đêm
```

### 3.3 Lương ngày thường (mục I)
```
regularWorkdayPay = (basicSalary / standardWorkdays) * actualWorkdays
```
Mục I. TỔNG TIỀN LƯƠNG = regularWorkdayPay + tất cả các khoản OT ở trên

### 3.4 Phụ cấp (mục II) — nhập số tiền cố định, danh sách có thể thêm/bớt dòng
| Field | Ghi chú |
|---|---|
| `mealAllowance` | Tiền ăn giữa ca |
| `complianceBonus` | Trợ cấp tuân thủ |
| `kindergartenSupport` | Hỗ trợ con nhỏ |
| `responsibilityAllowance` | Phụ cấp trách nhiệm |
| `trainerAllowance` | Phụ cấp đào tạo |
| `otherAllowances[]` | Mảng {tên khoản, số tiền} cho các phụ cấp khác |

Mục II. TỔNG PHỤ CẤP = tổng tất cả các dòng trên

### 3.5 Thưởng (mục III) — nhập số tiền cố định
| Field | Ghi chú |
|---|---|
| `loyaltyBonus` | Thưởng gắn bó / thâm niên |
| `skillBonus` | Thưởng tay nghề |
| `kpiBonus` | Thưởng KPI / tháng 13 |
| `recruitmentBonus` | Thưởng tuyển dụng |
| `otherBonuses[]` | Mảng {tên khoản, số tiền} |

Mục III. TỔNG THƯỞNG = tổng tất cả các dòng trên

### 3.6 Khấu trừ (mục V)
| Field | Công thức mặc định | Ghi chú |
|---|---|---|
| `socialInsurance` (BHXH) | `insuranceSalary * 8%` | Có thể override thủ công |
| `healthInsurance` (BHYT) | `insuranceSalary * 1.5%` (hoặc 4.5% nếu diện đóng khác — cho user chọn) | |
| `unemploymentInsurance` (BHTN) | `insuranceSalary * 1%` | |
| `personalIncomeTax` | Xem mục 4 bên dưới | Thuế TNCN lũy tiến |
| `advance` (Tạm ứng) | Nhập tay | |
| `otherDeductions[]` | Mảng {tên khoản, số tiền} | |

Mục V. TỔNG KHẤU TRỪ = tổng tất cả các dòng trên

## 4. Thuế TNCN (tùy chọn nâng cao — có thể để user tự nhập nếu không cần tự động tính)
Nếu muốn tự động tính thuế TNCN theo biểu lũy tiến từng phần (áp dụng cho thu nhập chịu thuế sau giảm trừ):
- Giảm trừ bản thân: 11.000.000 VNĐ/tháng (theo quy định hiện hành — **cần agent xác nhận số liệu mới nhất khi code**, vì có thể thay đổi theo luật)
- Giảm trừ người phụ thuộc: 4.400.000 VNĐ/người/tháng (input `dependents: number`)
- Thu nhập chịu thuế = Gross - BHXH - BHYT - BHTN - giảm trừ bản thân - giảm trừ phụ thuộc
- Áp bậc thuế lũy tiến (7 bậc: 5%, 10%, 15%, 20%, 25%, 30%, 35%)

> Ghi chú cho agent: nên để đây là tính năng optional/toggle, vì mức giảm trừ gia cảnh và các bậc thuế có thể thay đổi theo thời gian — nên cho phép cấu hình (config) thay vì hard-code, hoặc để user tự nhập số thuế nếu công ty có cách tính riêng.

## 5. Công thức tổng hợp cuối cùng

```
I.   TotalSalaryIncome = regularWorkdayPay + otNormalPay + otWeeklyRestPay 
                         + otPublicHolidayPay + nightShiftPay + nightShiftOtExtra

II.  TotalAllowance = tổng mục 3.4

III. TotalBonus = tổng mục 3.5

IV.  GrossPay = I + II + III

V.   TotalDeduction = socialInsurance + healthInsurance + unemploymentInsurance 
                      + personalIncomeTax + advance + otherDeductions

VII. NetIncome = IV - V
```

## 6. Yêu cầu UI/UX cho agent coding
- Form chia theo từng nhóm (accordion/section): Thông tin cơ bản → Ngày công & OT → Phụ cấp → Thưởng → Khấu trừ
- Cho phép thêm/xóa dòng tùy chỉnh ở phần Phụ cấp/Thưởng/Khấu trừ khác
- Hiển thị kết quả real-time dạng bảng giống phiếu lương gốc (I → VII), có tổng đậm ở Gross và Net
- Validate: số phải >= 0, ngày công thực tế không vượt ngày công chuẩn (cảnh báo nếu vượt)
- Định dạng số tiền theo VNĐ (dấu chấm phân cách hàng nghìn)
- Có nút "Reset" và hiển thị công thức/breakdown chi tiết từng dòng khi hover/click (transparency)

## 7. Ví dụ dữ liệu test (đối chiếu với phiếu lương thực tế T06/2026)
```
Input:
- basicSalary = 9,754,000
- standardWorkdays = 26 (giả định, agent cần xác nhận số ngày công chuẩn thực tế công ty áp dụng)
- mealAllowance = 945,000
- complianceBonus = 400,000
- loyaltyBonus = 1,200,000 (gộp 3 tháng "gắn bó")
- skillBonus = 600,000 (gộp 3 tháng "tay nghề")

Output kỳ vọng:
- I. TotalSalaryIncome = 9,754,000
- II. TotalAllowance = 1,345,000
- III. TotalBonus = 1,800,000
- IV. GrossPay = 12,899,000
- socialInsurance (8%) = 780,320
- healthInsurance (1.5%) = 146,310
- unemploymentInsurance (1%) = 97,540
- V. TotalDeduction = 1,024,170
- VII. NetIncome = 11,874,830
```
