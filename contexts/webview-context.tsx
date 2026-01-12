'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import { useWebViewBridge, type AppEnv, type WebViewTokens } from '@/hooks/useWebViewBridge';

interface WebViewContextType {
  isWebView: boolean;
  appEnv: AppEnv | null;
  tokens: WebViewTokens;
  isReady: boolean;
  getApiHeaders: () => Record<string, string>;
  getApiPayload: <T extends object>(base?: T) => T & { expoPushToken?: string; deviceId?: string };
}

const WebViewContext = createContext<WebViewContextType | undefined>(undefined);

export function WebViewProvider({ children }: { children: ReactNode }) {
  const bridge = useWebViewBridge();
  return <WebViewContext.Provider value={bridge}>{children}</WebViewContext.Provider>;
}

export function useWebView() {
  const ctx = useContext(WebViewContext);
  if (!ctx) throw new Error('useWebView must be used within WebViewProvider');
  return ctx;
}

export function WebViewOnly({ children }: { children: ReactNode }) {
  const { isWebView, isReady } = useWebView();
  if (!isReady || !isWebView) return null;
  return <>{children}</>;
}

export function BrowserOnly({ children }: { children: ReactNode }) {
  const { isWebView, isReady } = useWebView();
  if (!isReady || isWebView) return null;
  return <>{children}</>;
}