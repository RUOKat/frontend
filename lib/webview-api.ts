import type { WebViewTokens } from '@/hooks/useWebViewBridge';

export function isWebViewEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).APP_ENV?.isApp;
}

export function getWebViewTokens(): WebViewTokens {
  if (typeof window === 'undefined') {
    return { appToken: null, expoPushToken: null, deviceId: null };
  }
  return {
    appToken: (window as any).APP_TOKEN || null,
    expoPushToken: (window as any).EXPO_PUSH_TOKEN || null,
    deviceId: (window as any).DEVICE_ID || null,
  };
}

export async function webViewFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const tokens = getWebViewTokens();
  const headers = new Headers(options.headers);

  if (isWebViewEnvironment()) {
    if (tokens.appToken) headers.set('Authorization', `Bearer ${tokens.appToken}`);
    if (tokens.expoPushToken) headers.set('X-Expo-Push-Token', tokens.expoPushToken);
    if (tokens.deviceId) headers.set('X-Device-ID', tokens.deviceId);
  }

  return fetch(url, { ...options, headers });
}

export async function webViewPost(url: string, data: object = {}, options: RequestInit = {}): Promise<Response> {
  const tokens = getWebViewTokens();
  let payload = data;

  if (isWebViewEnvironment()) {
    payload = {
      ...data,
      ...(tokens.expoPushToken && { expoPushToken: tokens.expoPushToken }),
      ...(tokens.deviceId && { deviceId: tokens.deviceId }),
    };
  }

  return webViewFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(payload),
    ...options,
  });
}