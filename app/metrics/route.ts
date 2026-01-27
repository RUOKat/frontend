import { NextResponse } from 'next/server';
import * as client from 'prom-client';

// 메트릭 초기화 (route 파일에서 직접)
const register = new client.Registry();

// 기본 메트릭 수집
client.collectDefaultMetrics({
  register,
  prefix: 'nextjs_',
});

// 커스텀 메트릭
new client.Counter({
  name: 'nextjs_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

new client.Histogram({
  name: 'nextjs_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

new client.Gauge({
  name: 'nextjs_http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

export async function GET() {
  try {
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
