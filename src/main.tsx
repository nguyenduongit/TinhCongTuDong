import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

// --- PWA: tự động cập nhật khi có bản deploy mới ---
// workbox (registerType: 'autoUpdate') tự skipWaiting + clientsClaim ở tầng
// Service Worker ngay khi phát hiện bản build mới, nhưng KHÔNG tự reload tab
// đang mở. Kết quả: SW mới đã "tiếp quản" ở hậu trường nhưng UI vẫn hiển thị
// bundle JS cũ đã nạp sẵn trong bộ nhớ -> nhìn như app không hề được cập nhật,
// kể cả sau khi deploy xong hay tạo lại icon PWA (vì lần mở đầu tiên vẫn phục
// vụ bởi SW cũ, việc kích hoạt SW mới diễn ra ngầm sau đó, không kèm reload).
if ('serviceWorker' in navigator) {
  let hasReloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasReloaded) return;
    hasReloaded = true;
    window.location.reload();
  });

  // PWA standalone thường được mở lại từ nền (không phải điều hướng mới) nên
  // trình duyệt ít có cơ hội tự kiểm tra SW mới. Chủ động kiểm tra mỗi khi
  // app quay lại foreground để không phải chờ tới lần khởi động kế tiếp.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then(reg => reg?.update()).catch(() => {});
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <App />
);

