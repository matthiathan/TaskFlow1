import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.init({
          appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
          // Only allow the SDK to run if the URL matches your environment
          allowLocalhostAsSecureOrigin: true 
        });

        const permission = await OneSignal.Notifications.hasPermission();
        setIsPermissionGranted(permission);

        OneSignal.Notifications.addEventListener('permissionChange', (permission: boolean) => {
          setIsPermissionGranted(permission);
        });
      } catch (error) {
        console.error("OneSignal initialization failed:", error);
      }
    });
  }, []);

  // Sync user separately after initialization
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      if (user?.id) {
        await OneSignal.login(user.id);
        if (user.role) {
          await OneSignal.User.addTag('role', user.role);
        }
      } else {
        await OneSignal.logout();
      }
    });
  }, [user]);

  const requestPermission = () => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      OneSignal.Slidedown.promptPush();
    });
  };

  return { requestPermission, isPermissionGranted };
};
