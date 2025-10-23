// API Configuration
// @ts-ignore
const VITE_API_URL = import.meta.env?.VITE_API_URL;
// @ts-ignore
const VITE_WS_URL = import.meta.env?.VITE_WS_URL;

// Для production используем публичный API домен
export const API_URL = VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname.includes('vadimevgrafov.ru')
    ? 'https://api-smartsupport.vadimevgrafov.ru'
    : 'http://localhost:3001'
);

export const WS_URL = VITE_WS_URL || 
  (window.location.hostname.includes('vadimevgrafov.ru') 
    ? 'wss://api-smartsupport.vadimevgrafov.ru' 
    : 'ws://localhost:3001');

export const config = {
  apiUrl: API_URL,
  wsUrl: WS_URL,
  endpoints: {
    appeals: `${API_URL}/api/appeals`,
    health: `${API_URL}/health`,
  }
};

export default config;

