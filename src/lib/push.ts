import { supabase } from './supabase';

const PUBLIC_VAPID_KEY = "BN2br3pB7RDQM3rO4BKjiQYlRXBvf-Qnhdwin5rOoeKK2l9daNIilN_VPeJoHH1zpt8vwvp0vwbVgw0WqGY68R8";

// Utility to convert Base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestPushPermission(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error("Browser không hỗ trợ Web Push");
    return false;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    if (permission !== 'granted') {
      return false;
    }

    // Unregister OneSignal service worker if it exists
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      if (reg.active?.scriptURL.includes('OneSignal')) {
        await reg.unregister();
      }
    }

    // Đăng ký Service Worker mới
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Đăng ký Push
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
    }

    // Gửi subscription lên Supabase
    const subJSON = subscription.toJSON();
    if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
      console.error("Subscription thiếu thông tin keys");
      return false;
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth
      }, { onConflict: 'user_id, endpoint' });

    if (error) {
      console.error("Lỗi khi lưu push subscription:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Lỗi đăng ký Push:", err);
    return false;
  }
}
