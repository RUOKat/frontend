import { NextResponse } from 'next/server';
import * as client from 'prom-client';

// Node.js 런타임 강제
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 메트릭 초기화
const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'nextjs_',
});

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
