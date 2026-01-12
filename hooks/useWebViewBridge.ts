'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface AppEnv {
  platform: "android" | "ios";
  appVersion: string;
  appState: "active" | "background" | "inactive" | "unknown";
  networkState: "online" | "offline";
  isApp: true;
}

export interface WebViewTokens {
  appToken: string | null;
  expoPushToken: string | null;
  deviceId: string | null;
}

export function useWebViewBridge() {
  const [isWebView, setIsWebView] = useState(false);
  const [appEnv, setAppEnv] = useState<AppEnv | null>(null);
  const [tokens, setTokens] = useState<WebViewTokens>({
    appToken: null,
    expoPushToken: null,
    deviceId: null,
  });
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  const checkWebViewTokens = useCallback(() => {
    if (typeof window === 'undefined') return;

    const env = (window as any).APP_ENV as AppEnv | undefined;
    const isWebViewEnv = !!env?.isApp;

    setIsWebView(isWebViewEnv);
    setAppEnv(env || null);

    if (isWebViewEnv) {
      setTokens({
        appToken: (window as any).APP_TOKEN || null,
        expoPushToken: (window as any).EXPO_PUSH_TOKEN || null,
        deviceId: (window as any).DEVICE_ID || null,
      });
      console.log('🔗 WebView 환경 감지됨');
    }
    setIsReady(true);
  }, []);

  const getApiHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (isWebView) {
      if (tokens.appToken) headers['Authorization'] = `Bearer ${tokens.appToken}`;
      if (tokens.expoPushToken) headers['X-Expo-Push-Token'] = tokens.expoPushToken;
      if (tokens.deviceId) headers['X-Device-ID'] = tokens.deviceId;
    }
    return headers;
  }, [isWebView, tokens]);

  const getApiPayload = useCallback(<T extends object>(base: T = {} as T) => {
    if (!isWebView) return base;
    return {
      ...base,
      ...(tokens.expoPushToken && { expoPushToken: tokens.expoPushToken }),
      ...(tokens.deviceId && { deviceId: tokens.deviceId }),
    };
  }, [isWebView, tokens]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkWebViewTokens);
    } else {
      checkWebViewTokens();
    }
    setTimeout(checkWebViewTokens, 100);

    return () => document.removeEventListener('DOMContentLoaded', checkWebViewTokens);
  }, [checkWebViewTokens]);

  // 토큰 변경 감지
  useEffect(() => {
    if (!isWebView) return;
    const interval = setInterval(() => {
      const current = {
        appToken: (window as any).APP_TOKEN || null,
        expoPushToken: (window as any).EXPO_PUSH_TOKEN || null,
        deviceId: (window as any).DEVICE_ID || null,
      };
      if (JSON.stringify(current) !== JSON.stringify(tokens)) {
        setTokens(current);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isWebView, tokens]);

  return { isWebView, appEnv, tokens, isReady, getApiHeaders, getApiPayload };
}