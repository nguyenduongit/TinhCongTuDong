# Tính Công Tự Động

Dự án quản lý và tự động hóa tính lương (TinhCongTuDong), tích hợp thanh toán qua PayOS và xác thực người dùng bằng Supabase.

## 🚀 Công nghệ sử dụng
- **Frontend**: React 19, Vite, TypeScript
- **Styling & UI**: Tailwind CSS v4, Radix UI, Framer Motion
- **Routing & State**: Wouter, React Query (TanStack)
- **Backend & Database**: Supabase (Auth, Database, Edge Functions)
- **Payments**: PayOS

## 📦 Yêu cầu cài đặt
- [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản LTS)
- [pnpm](https://pnpm.io/) làm package manager chính.

## 🛠 Hướng dẫn chạy dự án

1. Clone dự án và cài đặt dependencies:
   ```bash
   pnpm install
   ```

2. Thiết lập biến môi trường (Environment Variables):
   - Copy file `.env.example` thành `.env`
   - Cập nhật các keys của Supabase và PayOS:
     ```env
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. Khởi chạy máy chủ phát triển (Development Server):
   ```bash
   pnpm dev
   ```

4. Truy cập trên trình duyệt qua địa chỉ `http://localhost:5173`.

## 🏗 Scripts khả dụng

- `pnpm dev`: Khởi chạy môi trường phát triển
- `pnpm build`: Build source code ra production
- `pnpm preview`: Xem trước bản build production tại máy local

## 🗄️ Cấu trúc thư mục chính
- `/src`: Chứa mã nguồn frontend chính (components, pages, utils).
- `/supabase`: Cấu hình Supabase và Edge Functions (ví dụ: webhook thanh toán).
- `/public`: Các tệp tĩnh (assets, icons).
