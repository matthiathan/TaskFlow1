import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize OneSignal
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      });
    });
  }, []);

  // Sync user with OneSignal
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      if (user?.id) {
        OneSignal.login(user.id);
      } else {
        OneSignal.logout();
      }
    });
  }, [user]);

  const requestPermission = () => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      OneSignal.Slidedown.promptPush();
    });
  };

  return { requestPermission };
};
