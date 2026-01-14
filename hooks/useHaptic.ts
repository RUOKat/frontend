'use client';

import { useCallback } from 'react';

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection';

/**
 * WebView 환경에서 네이티브 햅틱 피드백을 트리거하는 훅
 */
export function useHaptic() {
  const isWebView = typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;

  const trigger = useCallback((type: HapticFeedbackType = 'selection') => {
    if (!isWebView) return;

    try {
      const webView = (window as any).ReactNativeWebView;
      if (webView?.postMessage) {
        webView.postMessage(JSON.stringify({
          type: 'HAPTIC_FEEDBACK',
          feedbackType: type,
        }));
      }
    } catch (e) {
      console.error('햅틱 피드백 실패:', e);
    }
  }, [isWebView]);

  return {
    isWebView,
    trigger,
    light: useCallback(() => trigger('light'), [trigger]),
    medium: useCallback(() => trigger('medium'), [trigger]),
    heavy: useCallback(() => trigger('heavy'), [trigger]),
    selection: useCallback(() => trigger('selection'), [trigger]),
  };
}
