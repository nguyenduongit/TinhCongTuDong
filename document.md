Dưới đây là bức tranh tổng thể của nghiệp vụ theo những gì chúng ta đã thống nhất đến thời điểm này.

---

# **HỆ THỐNG TÍNH CÔNG SẢN XUẤT CÁ NHÂN**

## **1\. Dữ liệu gốc**

### **1.1 Bảng `cong_doan`**

Là bảng danh mục công đoạn.

| Trường | Ý nghĩa |
| ----- | ----- |
| ma\_cong\_doan | Mã công đoạn |
| ten\_cong\_doan | Tên công đoạn |
| dinh\_muc | Định mức chuẩn |
| quy\_cach | Quy cách |

Trong các phép tính chỉ sử dụng **`dinh_muc`**.

---

## **1.2 Dữ liệu nhập mỗi ngày**

Một ngày gồm:

Ngày

Danh sách công đoạn  
├── Công đoạn 1  
│     ├── Mã công đoạn  
│     ├── % định mức  
│     └── Số lượng  
│  
├── Công đoạn 2  
│     ├── Mã công đoạn  
│     ├── % định mức  
│     └── Số lượng  
│  
└── ...

Thời gian thực hiện (phút)

Thời gian hỗ trợ (phút)

---

# **2\. Ý nghĩa các trường**

## **Ngày**

Ngày phát sinh dữ liệu.

---

## **Mã công đoạn**

Tra sang bảng `cong_doan` để lấy:

* định mức

---

## **% định mức**

Là giá trị do quản lý quy định cho công đoạn trong ngày.

Người công nhân nhập dưới dạng số:

80  
90  
100  
110  
120

Khi tính toán sẽ quy đổi:

80 → 0.8

100 → 1.0

120 → 1.2

---

## **Số lượng**

Số sản phẩm hoàn thành của công đoạn đó.

---

## **Thời gian thực hiện**

Là tổng thời gian làm sản phẩm trong ngày.

Không dùng trực tiếp trong các công thức hiện tại nhưng được lưu lại.

---

## **Thời gian hỗ trợ**

Là thời gian:

* họp  
* đào tạo  
* hỗ trợ  
* ...

Được tính công riêng.

---

# **3\. Công thức tính theo ngày**

---

## **3.1 Công sản phẩm của một công đoạn**

Công sản phẩm

\=

Số lượng

÷

(

Định mức

×

(% định mức /100)

)

Hay:

CongSanPham

\=

SoLuong

/

(

DinhMuc

×

(PhanTramDinhMuc /100)

)

---

## **3.2 Công hỗ trợ**

CongHoTro

\=

ThoiGianHoTro

/

480

Trong đó:

480 phút \= 1 công.

---

## **3.3 Tổng công sản phẩm trong ngày**

TongCongNgay

\=

Σ(Công sản phẩm của tất cả công đoạn)

\+

Công hỗ trợ

---

# **4\. Tính công tuần**

## **Bước 1**

Gộp tất cả dữ liệu của tuần.

---

## **Bước 2**

Tính tổng số lượng từng công đoạn

TongSoLuongTuan(ma)

\=

Σ(SoLuong)

**Không quan tâm % định mức.**

Ví dụ

A01

100%

SL=100

\+

80%

SL=50

\+

120%

SL=80

\=

230

---

## **Bước 3**

Công sản phẩm tuần của từng công đoạn

**Không tính lại từ tổng số lượng.**

Mà:

CongSanPhamTuan(ma)

\=

Σ(CongSanPhamNgay(ma))

Ví dụ

Thứ 2

0.35 công

\+

Thứ 3

0.18 công

\+

Thứ 5

0.22 công

\=

0.75 công

Lý do:

Mỗi ngày có thể có % định mức khác nhau.

---

## **Bước 4**

Thời gian hỗ trợ tuần

ThoiGianHoTroTuan

\=

Σ(ThoiGianHoTroNgay)

---

## **Bước 5**

Công hỗ trợ tuần

CongHoTroTuan

\=

Σ(CongHoTroNgay)

---

## **Bước 6**

Tổng công tuần

TongCongTuan

\=

Σ(CongSanPhamTuan)

\+

CongHoTroTuan

---

# **5\. Quan hệ giữa các chỉ số**

                BẢNG CÔNG ĐOẠN  
                ┌────────────────┐  
                │ Mã công đoạn   │  
                │ Định mức       │  
                └───────┬────────┘  
                        │  
                        ▼  
             \=====================  
                  DỮ LIỆU NGÀY  
             \=====================

Ngày  
│  
├── Công đoạn A  
│      ├── Mã  
│      ├── % định mức  
│      └── Số lượng  
│  
├── Công đoạn B  
│  
├── Công đoạn C  
│  
├── Thời gian thực hiện  
│  
└── Thời gian hỗ trợ  
        │  
        ▼  
─────────────────────────────────  
Tính công từng công đoạn  
─────────────────────────────────

Công sản phẩm A

Công sản phẩm B

Công sản phẩm C

\+

Công hỗ trợ

↓

Tổng công ngày

        │  
        ▼

\=========================  
      GỘP THEO TUẦN  
\=========================

Theo từng công đoạn

├── Tổng số lượng tuần  
│  
└── Tổng công sản phẩm tuần  
      \=  
      Tổng công sản phẩm ngày

\+

Công hỗ trợ tuần

↓

Tổng công tuần

---

# **6\. Các nguyên tắc nghiệp vụ**

### **Quy tắc 1**

Định mức lấy từ bảng `cong_doan`.

---

### **Quy tắc 2**

`% định mức` luôn do người dùng nhập.

---

### **Quy tắc 3**

Một ngày có thể có nhiều công đoạn.

---

### **Quy tắc 4**

Thời gian hỗ trợ không thuộc công đoạn nào.

Là dữ liệu của cả ngày.

---

### **Quy tắc 5**

Công hỗ trợ được tính riêng.

---

### **Quy tắc 6**

Tổng công ngày

\=

Tổng công sản phẩm

* 

Công hỗ trợ.

---

### **Quy tắc 7**

Tổng số lượng tuần chỉ dùng để thống kê sản lượng theo công đoạn.

---

### **Quy tắc 8**

Công tuần **không được tính lại từ tổng số lượng tuần**.

Mà phải bằng tổng **công sản phẩm ngày** của công đoạn đó.

---

Theo mình, cấu trúc nghiệp vụ hiện tại rất mạch lạc và có tính phân lớp rõ ràng:

* **Lớp dữ liệu gốc**: `cong_doan` và dữ liệu nhập hằng ngày.  
* **Lớp tính toán theo ngày**: tính công sản phẩm, công hỗ trợ và tổng công ngày.  
* **Lớp tổng hợp theo tuần**: tổng hợp số lượng để thống kê và cộng dồn công đã tính theo ngày để ra công tuần.

