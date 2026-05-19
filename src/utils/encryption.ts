import CryptoJS from 'crypto-js';

// In a real enterprise app, this key would be managed securely or derived from user session
const ENCRYPTION_KEY = (import.meta as any).env.VITE_ENCRYPTION_KEY || 'dallmayr-enterprise-secure-key-2024';

export const EncryptionService = {
  encrypt: (text: string): string => {
    if (!text) return '';
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  },

  decrypt: (cipherText: string): string => {
    if (!cipherText) return '';
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return '[Decryption Error]';
    }
  }
};
