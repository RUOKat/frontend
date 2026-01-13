'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * WebView 환경에서 앱으로 OAuth 요청을 전달하는 훅
 */

export interface WebViewAuthState {
  isWebView: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email?: string; name?: string } | null;
  error: string | null;
}

export interface AppAuthMessage {
  type: 'AUTH_LOGIN_SUCCESS' | 'AUTH_LOGIN_ERROR' | 'AUTH_LOGOUT_SUCCESS' | 'AUTH_STATE_CHANGED';
  user?: { id: string; email?: string; name?: string };
  accessToken?: string;
  error?: string;
  isAuthenticated?: boolean;
}

export function useWebViewAuth() {
  const [state, setState] = useState<WebViewAuthState>({
    isWebView: false,
    isAuthenticated: false,
    isLoading: false, // 초기값을 false로 변경
    user: null,
    error: null,
  });

  const initRef = useRef(false);

  // WebView 환경 감지
  const checkWebViewEnvironment = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).ReactNativeWebView;
  }, []);

  // 앱에서 오는 인증 메시지 처리
  const handleAppMessage = useCallback((event: MessageEvent) => {
    try {
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      if (!message.type?.startsWith('AUTH_')) return;

      console.log('🔐 앱에서 인증 메시지 수신:', message);

      switch (message.type) {
        case 'AUTH_LOGIN_SUCCESS':
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
            user: message.user || null,
            error: null,
          }));
          // 로그인 성공 후 페이지 새로고침 또는 리다이렉트
          if (typeof window !== 'undefined') {
            window.location.href = '/onboarding/cat';
          }
          break;

        case 'AUTH_LOGIN_ERROR':
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            error: message.error || '로그인 실패',
          }));
          break;

        case 'AUTH_LOGOUT_SUCCESS':
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
          }));
          break;

        case 'AUTH_STATE_CHANGED':
          setState(prev => ({
            ...prev,
            isAuthenticated: message.isAuthenticated || false,
            isLoading: false,
            user: message.user || null,
          }));
          break;
      }
    } catch (error) {
      console.error('❌ 앱 메시지 파싱 실패:', error);
    }
  }, []);

  // Google 로그인 요청 (앱으로 전달)
  const requestGoogleLogin = useCallback(() => {
    if (!state.isWebView) {
      console.warn('⚠️ WebView 환경이 아닙니다.');
      return false;
    }

    const webView = (window as any).ReactNativeWebView;
    if (webView?.postMessage) {
      webView.postMessage(JSON.stringify({
        type: 'LOGIN_REQUEST',
        provider: 'Google',
      }));
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      console.log('📤 앱으로 Google 로그인 요청 전송');
      return true;
    }
    return false;
  }, [state.isWebView]);

  // 로그아웃 요청 (앱으로 전달)
  const requestLogout = useCallback(() => {
    if (!state.isWebView) {
      console.warn('⚠️ WebView 환경이 아닙니다.');
      return false;
    }

    const webView = (window as any).ReactNativeWebView;
    if (webView?.postMessage) {
      webView.postMessage(JSON.stringify({
        type: 'LOGOUT_REQUEST',
      }));
      console.log('📤 앱으로 로그아웃 요청 전송');
      return true;
    }
    return false;
  }, [state.isWebView]);

  // 초기화
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const isWebView = checkWebViewEnvironment();
    setState(prev => ({ ...prev, isWebView }));

    if (isWebView) {
      console.log('📱 WebView 환경 감지됨 - 앱 인증 모드 활성화');

      // 앱에서 오는 메시지 리스너 등록 (여러 방식 지원)

      // 방법 1: window.postMessage
      window.addEventListener('message', handleAppMessage);

      // 방법 2: 커스텀 이벤트
      const handleCustomEvent = (event: CustomEvent) => {
        console.log('📥 커스텀 이벤트 수신:', event.detail);
        handleAppMessage({ data: event.detail } as MessageEvent);
      };
      window.addEventListener('appMessage', handleCustomEvent as EventListener);

      // 방법 3: handleAppMessage를 전역으로 노출 (앱에서 직접 호출 가능)
      (window as any).handleAppMessage = (message: AppAuthMessage) => {
        console.log('📥 전역 핸들러로 메시지 수신:', message);
        handleAppMessage({ data: message } as MessageEvent);
      };

      return () => {
        window.removeEventListener('message', handleAppMessage);
        window.removeEventListener('appMessage', handleCustomEvent as EventListener);
        delete (window as any).handleAppMessage;
      };
    }
  }, [checkWebViewEnvironment, handleAppMessage]);

  return {
    ...state,
    requestGoogleLogin,
    requestLogout,
  };
}
