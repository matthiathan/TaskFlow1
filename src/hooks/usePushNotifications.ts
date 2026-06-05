import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isPermissionGranted, setIsPermissionGranted] = useState(true); // Assume granted until proven otherwise to avoid flickering, or use a loading state

  useEffect(() => {
    // Initialize OneSignal
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      });

      // Check permission state
      const checkPermission = () => {
        const permission = OneSignal.Notifications.permission;
        setIsPermissionGranted(permission);
      };
      checkPermission();

      // Listener for changes
      OneSignal.Notifications.addEventListener('permissionChange', (permission: boolean) => {
        setIsPermissionGranted(permission);
      });
    });
  }, []);

  // Sync user with OneSignal
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal: any) => {
      if (user?.id) {
        OneSignal.login(user.id);
        if (user.role) {
          OneSignal.User.addTag('role', user.role);
        }
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

  return { requestPermission, isPermissionGranted };
};
