export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 서버 사이드에서만 메트릭 초기화
    await import('./lib/metrics');
    console.log('📊 Prometheus metrics initialized at /metrics');
  }
}
