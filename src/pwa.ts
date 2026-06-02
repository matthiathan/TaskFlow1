import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(swScriptUrl) {
      console.log('Dallmayr FSM Service Worker registered:', swScriptUrl);
    },
    onRegisterError(error) {
      console.error('Dallmayr FSM Service Worker registration failed:', error);
    }
  });
}
