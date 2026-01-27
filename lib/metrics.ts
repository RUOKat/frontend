import * as client from 'prom-client';

// 기본 레지스트리 사용 (prom-client 내부 싱글톤)
export const register = client.register;

// 이미 초기화되었는지 확인
const isInitialized = register.getSingleMetric('nextjs_http_requests_total');

if (!isInitialized) {
  // 기본 메트릭 수집
  client.collectDefaultMetrics({
    register,
    prefix: 'nextjs_',
  });

  // HTTP 요청 카운터
  new client.Counter({
    name: 'nextjs_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [register],
  });

  // HTTP 요청 지속 시간
  new client.Histogram({
    name: 'nextjs_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  });

  // 활성 연결 수
  new client.Gauge({
    name: 'nextjs_http_active_connections',
    help: 'Number of active HTTP connections',
    registers: [register],
  });
}

// 메트릭 getter
export const httpRequestsTotal = register.getSingleMetric('nextjs_http_requests_total') as client.Counter<string>;
export const httpRequestDuration = register.getSingleMetric('nextjs_http_request_duration_seconds') as client.Histogram<string>;
export const httpActiveConnections = register.getSingleMetric('nextjs_http_active_connections') as client.Gauge<string>;
