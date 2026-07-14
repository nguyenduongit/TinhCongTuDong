import OneSignal from 'react-onesignal';

let initPromise: Promise<void> | null = null;

export const initOneSignal = () => {
  if (!initPromise) {
    initPromise = OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "c93d0d06-6e89-4bb3-b7fa-0d7f78e3e6f4",
      allowLocalhostAsSecureOrigin: true,
    }).catch(console.error) as Promise<void>;
  }
  return initPromise;
};

export const loginOneSignal = async (userId: string) => {
  await initOneSignal();
  try {
    await OneSignal.login(userId);
  } catch (err) {
    console.error("OneSignal login error:", err);
  }
};

export const logoutOneSignal = async () => {
  await initOneSignal();
  try {
    await OneSignal.logout();
  } catch (err) {
    console.error("OneSignal logout error:", err);
  }
};

export const requestOneSignalPermission = async () => {
  await initOneSignal();
  return await OneSignal.Notifications.requestPermission();
};
