-- 1. Bật extension pg_net và pg_cron (nếu chưa bật)
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 2. Bỏ qua bước unschedule ở lần chạy đầu tiên

-- 3. Tạo một schedule chạy lúc 20:00 (8 PM) hằng ngày theo giờ Việt Nam
-- Giờ UTC của 20:00 VN là 13:00 UTC.
-- Cú pháp cron: Phút Giờ Ngày_trong_tháng Tháng Ngày_trong_tuần
select cron.schedule(
  'daily_reminder_job',
  '0 13 * * 1-6', -- Chạy lúc 13:00 UTC (20:00 VN) từ Thứ 2 đến Thứ 7
  $$
    select net.http_post(
      url:='https://zdpssvuxktbfwcrgdial.supabase.co/functions/v1/send-daily-reminder',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkcHNzdnV4a3RiZndjcmdkaWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjE5ODYsImV4cCI6MjA5OTA5Nzk4Nn0.jMBEdC_ainWaLOa5vB6tWvqBN8WniNdDrjZAm7qDZGk"}'::jsonb
    );
  $$
);

-- LƯU Ý: Thay thế LẤY_MÃ_ANON_KEY_HOẶC_SERVICE_ROLE_KEY_TRONG_CÀI_ĐẶT bằng VITE_SUPABASE_ANON_KEY của bạn.
