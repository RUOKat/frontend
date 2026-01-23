import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// 싱글톤 인스턴스를 저장할 전역 변수
const globalForMetrics = globalThis as unknown as {
  metricsRegistry: Registry | undefined;
  httpRequestsTotal: Counter<string> | undefined;
  httpRequestDuration: Histogram<string> | undefined;
  httpActiveConnections: Gauge<string> | undefined;
  metricsInitialized: boolean | undefined;
};

// 레지스트리 싱글톤
export const register = globalForMetrics.metricsRegistry ?? new Registry();

// 초기화 여부 확인
if (!globalForMetrics.metricsInitialized) {
  // 기본 메트릭 수집 (한 번만)
  collectDefaultMetrics({ register });
  globalForMetrics.metricsInitialized = true;
}

// HTTP 요청 카운터 싱글톤
export const httpRequestsTotal =
  globalForMetrics.httpRequestsTotal ??
  new Counter({
    name: 'nextjs_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [register],
  });

// HTTP 요청 지속 시간 싱글톤
export const httpRequestDuration =
  globalForMetrics.httpRequestDuration ??
  new Histogram({
    name: 'nextjs_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  });

// 활성 연결 수 싱글톤
export const httpActiveConnections =
  globalForMetrics.httpActiveConnections ??
  new Gauge({
    name: 'nextjs_http_active_connections',
    help: 'Number of active HTTP connections',
    registers: [register],
  });

// 전역에 저장 (HMR에서도 유지)
if (process.env.NODE_ENV !== 'production') {
  globalForMetrics.metricsRegistry = register;
  globalForMetrics.httpRequestsTotal = httpRequestsTotal;
  globalForMetrics.httpRequestDuration = httpRequestDuration;
  globalForMetrics.httpActiveConnections = httpActiveConnections;
}
